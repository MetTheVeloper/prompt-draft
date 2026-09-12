using System.IO;
using System.Net.Http;

namespace PromptDraft.ServerManager.Services;

public sealed record ServerStatusSnapshot(string Docker, string Stack, string Tunnel, string Staging, string Production, string Message);

public sealed class LocalServerTarget
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(8) };
    private readonly CommandRunner _runner = new();
    private readonly string _repoRoot;

    public LocalServerTarget()
    {
        _repoRoot = ResolveRepoRoot();
    }

    public async Task<CommandResult> EnsureRunningAsync(CancellationToken cancellationToken)
    {
        await EnsureDockerReadyAsync(cancellationToken);
        var command = CommandRegistry.Commands["EnsureCloudflareStack"];
        return await _runner.RunAsync(command.FileName, command.Arguments, _repoRoot, command.Timeout, cancellationToken);
    }

    public async Task<ServerStatusSnapshot> GetStatusAsync(CancellationToken cancellationToken)
    {
        var docker = await ProbeDockerAsync(cancellationToken);
        if (!docker)
            return new("Unavailable", "Offline", "Offline", "Unknown", "Unknown", "Docker Engine is unavailable.");

        var statusCommand = CommandRegistry.Commands["CloudflareStatus"];
        var status = await _runner.RunAsync(statusCommand.FileName, statusCommand.Arguments, _repoRoot, statusCommand.Timeout, cancellationToken);
        var output = $"{status.StdOut}\n{status.StdErr}";
        var stackHealthy = status.ExitCode == 0 && ContainsHealthy(output, "frontend") && ContainsHealthy(output, "api") && ContainsHealthy(output, "db") && ContainsHealthy(output, "translator");
        var tunnelRunning = status.ExitCode == 0 && output.Contains("cloudflared", StringComparison.OrdinalIgnoreCase) && !output.Contains("cloudflared    Exited", StringComparison.OrdinalIgnoreCase);

        var staging = await ProbeEnvironmentAsync("https://grassic.ir/", "https://api.grassic.ir/api/db-check", cancellationToken);
        var production = await ProbeEnvironmentAsync("https://prompt-draft.ir/", "https://api.prompt-draft.ir/api/db-check", cancellationToken);

        var message = stackHealthy && tunnelRunning && staging && production
            ? "Local services, tunnel, staging and production endpoints are responding."
            : "One or more runtime layers are degraded; inspect service status and logs.";

        return new("Ready", stackHealthy ? "Healthy" : "Degraded", tunnelRunning ? "Running" : "Degraded", staging ? "Healthy" : "Offline", production ? "Healthy" : "Offline", message);
    }

    private async Task EnsureDockerReadyAsync(CancellationToken cancellationToken)
    {
        if (await ProbeDockerAsync(cancellationToken)) return;

        var dockerDesktop = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Docker", "Docker", "Docker Desktop.exe");
        if (!File.Exists(dockerDesktop)) throw new FileNotFoundException("Docker Desktop could not be located.", dockerDesktop);

        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(dockerDesktop) { UseShellExecute = true });
        var deadline = DateTime.UtcNow.AddMinutes(5);
        while (DateTime.UtcNow < deadline)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
            if (await ProbeDockerAsync(cancellationToken)) return;
        }

        throw new TimeoutException("Docker Engine did not become ready within five minutes.");
    }

    private async Task<bool> ProbeDockerAsync(CancellationToken cancellationToken)
    {
        try
        {
            var command = CommandRegistry.Commands["DockerInfo"];
            var result = await _runner.RunAsync(command.FileName, command.Arguments, _repoRoot, command.Timeout, cancellationToken);
            return result.ExitCode == 0;
        }
        catch { return false; }
    }

    private static bool ContainsHealthy(string output, string service) =>
        output.Contains(service, StringComparison.OrdinalIgnoreCase) && output.Contains("healthy", StringComparison.OrdinalIgnoreCase);

    private static async Task<bool> ProbeEnvironmentAsync(string frontend, string api, CancellationToken cancellationToken)
    {
        try
        {
            using var frontendResponse = await Http.GetAsync(frontend, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            using var apiResponse = await Http.GetAsync(api, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            return frontendResponse.IsSuccessStatusCode && apiResponse.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    private static string ResolveRepoRoot()
    {
        const string preferred = @"G:\ZADAK\prompt-draft";
        if (File.Exists(Path.Combine(preferred, "package.json")) && File.Exists(Path.Combine(preferred, "compose.yaml"))) return preferred;

        var cursor = AppContext.BaseDirectory;
        for (var i = 0; i < 8; i++)
        {
            if (File.Exists(Path.Combine(cursor, "package.json")) && File.Exists(Path.Combine(cursor, "compose.yaml"))) return cursor;
            var parent = Directory.GetParent(cursor);
            if (parent is null) break;
            cursor = parent.FullName;
        }

        throw new DirectoryNotFoundException("Prompt Draft repository could not be located. Configure the repository path before using server actions.");
    }
}
