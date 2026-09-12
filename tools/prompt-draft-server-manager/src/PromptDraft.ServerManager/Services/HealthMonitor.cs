using PromptDraft.ServerManager.Models;

namespace PromptDraft.ServerManager.Services;

public sealed class HealthMonitor : IAsyncDisposable
{
    private readonly LocalServerTarget _target;
    private readonly ManagerSettings _settings;
    private readonly LoggingService _logger;
    private readonly IncidentTracker _incidents;
    private readonly CancellationTokenSource _cts = new();
    private readonly object _sync = new();
    private LocalRuntimeStatus? _local;
    private PublicRuntimeStatus? _public;
    private Task? _localTask;
    private Task? _publicTask;

    public event EventHandler<ServerStatusSnapshot>? SnapshotUpdated;
    public event EventHandler<IncidentChange>? IncidentChanged;

    public HealthMonitor(LocalServerTarget target, ManagerSettings settings, LoggingService logger, IncidentTracker incidents)
    {
        _target = target;
        _settings = settings;
        _logger = logger;
        _incidents = incidents;
    }

    public void Start()
    {
        if (_localTask is not null) return;
        _localTask = Task.Run(() => LocalLoopAsync(_cts.Token));
        _publicTask = Task.Run(() => PublicLoopAsync(_cts.Token));
    }

    private async Task LocalLoopAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var local = await _target.GetLocalStatusAsync(cancellationToken);
                lock (_sync) _local = local;
                PublishIfReady();
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                await _logger.WriteAsync("ERROR", "Monitor", $"Local health check failed: {ex.Message}");
            }

            await DelayAsync(_settings.LocalPollSeconds, cancellationToken);
        }
    }

    private async Task PublicLoopAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var publicStatus = await _target.GetPublicStatusAsync(cancellationToken);
                lock (_sync) _public = publicStatus;
                PublishIfReady();
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                await _logger.WriteAsync("ERROR", "Monitor", $"Public health check failed: {ex.Message}");
            }

            await DelayAsync(_settings.PublicPollSeconds, cancellationToken);
        }
    }

    private void PublishIfReady()
    {
        ServerStatusSnapshot? snapshot;
        lock (_sync)
        {
            if (_local is null || _public is null) return;
            snapshot = new(
                _local.DockerReady,
                _local.StackHealthy,
                _local.TunnelRunning,
                _public.Staging,
                _public.Production,
                DateTimeOffset.Now);
        }

        SnapshotUpdated?.Invoke(this, snapshot);
        foreach (var change in _incidents.Evaluate(snapshot))
        {
            _ = _logger.WriteAsync(change.Opened ? "WARN" : "INFO", "Incident", change.Message);
            IncidentChanged?.Invoke(this, change);
        }
    }

    private static async Task DelayAsync(int seconds, CancellationToken cancellationToken)
    {
        try { await Task.Delay(TimeSpan.FromSeconds(Math.Max(5, seconds)), cancellationToken); }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { }
    }

    public async ValueTask DisposeAsync()
    {
        _cts.Cancel();
        var tasks = new[] { _localTask, _publicTask }.Where(task => task is not null).Cast<Task>().ToArray();
        if (tasks.Length > 0)
        {
            try { await Task.WhenAll(tasks); }
            catch (OperationCanceledException) { }
        }
        _cts.Dispose();
    }
}
