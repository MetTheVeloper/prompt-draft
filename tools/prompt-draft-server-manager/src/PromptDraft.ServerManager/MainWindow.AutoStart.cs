namespace PromptDraft.ServerManager;

public partial class MainWindow
{
    private async Task AutoStartDockerAsync()
    {
        if (!_settings.AutoStartDocker) return;

        try
        {
            await _logger.WriteAsync("INFO", "Docker", "Automatic Docker readiness check started");
            await _target.EnsureDockerReadyAsync(CancellationToken.None);
            await _logger.WriteAsync("INFO", "Docker", "Docker Engine is ready");
        }
        catch (Exception ex)
        {
            await _logger.WriteAsync("ERROR", "Docker", $"Automatic Docker start failed: {ex.Message}");
            if (_settings.NotificationEnabled)
                _tray.ShowNotification("Prompt Draft Server Manager", ex.Message, warning: true);
        }
    }
}
