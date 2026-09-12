using System.IO;

namespace PromptDraft.ServerManager.Services;

public sealed record LogEntry(DateTimeOffset Timestamp, string Level, string Subsystem, string Message)
{
    public string Format() => $"{Timestamp:HH:mm:ss} {Level,-5} {Subsystem,-12} {Message}";
}

public sealed class LoggingService : IDisposable
{
    private readonly string _logDirectory;
    private readonly int _retentionDays;
    private readonly SemaphoreSlim _writeLock = new(1, 1);

    public event EventHandler<LogEntry>? EntryWritten;

    public LoggingService(int retentionDays)
    {
        _retentionDays = Math.Max(1, retentionDays);
        _logDirectory = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PromptDraftServerManager", "logs");
        Directory.CreateDirectory(_logDirectory);
        PurgeOldLogs();
    }

    public async Task WriteAsync(string level, string subsystem, string message)
    {
        var entry = new LogEntry(DateTimeOffset.Now, level.ToUpperInvariant(), subsystem, Sanitize(message));
        await _writeLock.WaitAsync();
        try
        {
            var path = Path.Combine(_logDirectory, $"manager-{DateTime.Now:yyyy-MM-dd}.log");
            await File.AppendAllTextAsync(path, entry.Format() + Environment.NewLine);
        }
        finally
        {
            _writeLock.Release();
        }

        EntryWritten?.Invoke(this, entry);
    }

    private void PurgeOldLogs()
    {
        var cutoff = DateTime.Now.AddDays(-_retentionDays);
        foreach (var file in Directory.EnumerateFiles(_logDirectory, "manager-*.log"))
        {
            try
            {
                if (File.GetLastWriteTime(file) < cutoff) File.Delete(file);
            }
            catch { }
        }
    }

    private static string Sanitize(string message)
    {
        var compact = message.Replace("\r", " ").Replace("\n", " | ");
        var sensitiveMarkers = new[] { "CLOUDFLARE_TUNNEL_TOKEN", "GITHUB_TOKEN", "SECRET_ACCESS_KEY", "PASSWORD=" };
        return sensitiveMarkers.Any(marker => compact.Contains(marker, StringComparison.OrdinalIgnoreCase))
            ? "[redacted sensitive output]"
            : compact;
    }

    public void Dispose() => _writeLock.Dispose();
}
