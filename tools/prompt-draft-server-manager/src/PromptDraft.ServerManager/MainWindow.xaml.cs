using System.ComponentModel;
using System.Globalization;
using System.Windows;
using MaterialDesignThemes.Wpf;
using PromptDraft.ServerManager.Models;
using PromptDraft.ServerManager.Security;
using PromptDraft.ServerManager.Services;

namespace PromptDraft.ServerManager;

public partial class MainWindow : Window
{
    private readonly OwnerAuthService _auth = new();
    private readonly SettingsService _settingsService = new();
    private readonly ManagerSettings _settings;
    private readonly LoggingService _logger;
    private readonly LocalServerTarget _target;
    private readonly HealthMonitor _monitor;
    private readonly TrayService _tray;
    private bool _dark;
    private bool _fa;
    private bool _unlocked;
    private bool _exitRequested;

    public MainWindow()
    {
        InitializeComponent();
        _settings = _settingsService.Load();
        _dark = _settings.Theme.Equals("Dark", StringComparison.OrdinalIgnoreCase);
        _fa = _settings.Language.Equals("fa", StringComparison.OrdinalIgnoreCase);
        _logger = new LoggingService(_settings.LogRetentionDays);
        _target = new LocalServerTarget(_settings.RepoPath, TimeSpan.FromSeconds(Math.Max(30, _settings.StartupTimeoutSeconds)));
        _monitor = new HealthMonitor(_target, _settings, _logger, new IncidentTracker());
        _tray = new TrayService();

        _logger.EntryWritten += Logger_EntryWritten;
        _monitor.SnapshotUpdated += Monitor_SnapshotUpdated;
        _monitor.IncidentChanged += Monitor_IncidentChanged;
        ConfigureTray();
        ApplyTheme();
        ApplyLanguage();
        TargetPathText.Text = _target.RepoRoot;
        _monitor.Start();
        _ = _logger.WriteAsync("INFO", "Manager", "Application started; read-only monitoring enabled");
    }

    private async void UnlockButton_Click(object sender, RoutedEventArgs e)
    {
        var password = OwnerPassword.Password;
        if (string.IsNullOrWhiteSpace(password)) return;
        if (!_auth.IsConfigured && password.Length < 8)
        {
            AuthStateText.Text = T("Use at least 8 characters for the owner password.", "رمز مالک باید حداقل ۸ کاراکتر باشد.");
            return;
        }

        bool ok;
        if (!_auth.IsConfigured)
        {
            await _auth.InitializeAsync(password);
            ok = true;
            await _logger.WriteAsync("INFO", "Security", "Owner credential initialized");
        }
        else
        {
            ok = await _auth.VerifyAsync(password);
        }

        OwnerPassword.Clear();
        _unlocked = ok;
        AuthStateText.Text = ok ? T("Unlocked", "باز شد") : T("Invalid password", "رمز نادرست است");
        SetActionButtons(ok);
        LogBox.Visibility = ok ? Visibility.Visible : Visibility.Collapsed;
        ActivityLockedText.Visibility = ok ? Visibility.Collapsed : Visibility.Visible;
        await _logger.WriteAsync(ok ? "INFO" : "WARN", "Security", ok ? "Owner access unlocked" : "Owner authentication failed");
    }

    private async void EnsureButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteActionAsync("Stack", ManagerOperationalState.StartingStack, ct => _target.EnsureRunningAsync(ct));

    private async void RestartButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteActionAsync("Stack", ManagerOperationalState.StartingStack, ct => _target.RunRegisteredCommandAsync("RestartCloudflareStack", ct));

    private async void StopButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteActionAsync("Stack", ManagerOperationalState.Stopping, ct => _target.RunRegisteredCommandAsync("StopCloudflareStack", ct));

    private async void RefreshButton_Click(object sender, RoutedEventArgs e) => await RefreshAsync();

    private async Task ExecuteActionAsync(string subsystem, ManagerOperationalState transientState, Func<CancellationToken, Task<CommandResult>> action)
    {
        if (!_unlocked) return;
        SetActionButtons(false);
        ManagerStateText.Text = LocalizeState(transientState);
        try
        {
            await _logger.WriteAsync("INFO", subsystem, $"Operator action started: {transientState}");
            var result = await action(CancellationToken.None);
            await _logger.WriteAsync(result.ExitCode == 0 ? "INFO" : "ERROR", subsystem, result.Summary);
            await RefreshAsync();
        }
        catch (Exception ex)
        {
            ManagerStateText.Text = LocalizeState(ManagerOperationalState.Error);
            await _logger.WriteAsync("ERROR", subsystem, ex.Message);
            if (_settings.NotificationEnabled) _tray.ShowNotification("Prompt Draft Server Manager", ex.Message, warning: true);
        }
        finally
        {
            SetActionButtons(_unlocked);
        }
    }

    private async Task RefreshAsync()
    {
        try
        {
            var snapshot = await _target.GetStatusAsync(CancellationToken.None);
            UpdateSnapshot(snapshot);
            await _logger.WriteAsync("INFO", "Health", $"Manual refresh: {snapshot.State}");
        }
        catch (Exception ex)
        {
            await _logger.WriteAsync("ERROR", "Health", ex.Message);
        }
    }

    private void Monitor_SnapshotUpdated(object? sender, ServerStatusSnapshot snapshot) =>
        Dispatcher.InvokeAsync(() => UpdateSnapshot(snapshot));

    private void Monitor_IncidentChanged(object? sender, IncidentChange change)
    {
        Dispatcher.InvokeAsync(() =>
        {
            if (!_settings.NotificationEnabled) return;
            _tray.ShowNotification(
                change.Opened ? T("Server incident", "اختلال سرور") : T("Server recovered", "بازیابی سرور"),
                LocalizeIncident(change),
                warning: change.Opened);
        });
    }

    private void UpdateSnapshot(ServerStatusSnapshot snapshot)
    {
        DockerState.Text = StateText(snapshot.DockerReady);
        StackState.Text = StateText(snapshot.StackHealthy);
        TunnelState.Text = snapshot.TunnelRunning ? T("Running", "در حال اجرا") : T("Offline", "آفلاین");
        StagingState.Text = EndpointStateText(snapshot.Staging);
        ProductionState.Text = EndpointStateText(snapshot.Production);
        StagingDetail.Text = EndpointDetail(snapshot.Staging);
        ProductionDetail.Text = EndpointDetail(snapshot.Production);
        ManagerStateText.Text = LocalizeState(snapshot.State);
        LastCheckedText.Text = T($"Last checked {snapshot.CheckedAt:HH:mm:ss}", $"آخرین بررسی {snapshot.CheckedAt:HH:mm:ss}");
        _tray.UpdateState(snapshot.State);
    }

    private void ThemeButton_Click(object sender, RoutedEventArgs e)
    {
        _dark = !_dark;
        _settings.Theme = _dark ? "Dark" : "Light";
        ApplyTheme();
        _ = _settingsService.SaveAsync(_settings);
    }

    private void ApplyTheme()
    {
        var helper = new PaletteHelper();
        var theme = helper.GetTheme();
        theme.SetBaseTheme(_dark ? BaseTheme.Dark : BaseTheme.Light);
        helper.SetTheme(theme);
        ThemeButton.Content = _dark ? T("Light", "روشن") : T("Dark", "تیره");
    }

    private void LanguageButton_Click(object sender, RoutedEventArgs e)
    {
        _fa = !_fa;
        _settings.Language = _fa ? "fa" : "en";
        ApplyLanguage();
        _ = _settingsService.SaveAsync(_settings);
    }

    private void ApplyLanguage()
    {
        FlowDirection = _fa ? FlowDirection.RightToLeft : FlowDirection.LeftToRight;
        Language = System.Windows.Markup.XmlLanguage.GetLanguage(_fa ? "fa-IR" : CultureInfo.CurrentUICulture.IetfLanguageTag);
        LanguageButton.Content = _fa ? "EN" : "FA";
        SubtitleText.Text = T("Local operations console", "کنسول مدیریت محلی");
        OwnerAccessTitle.Text = T("Owner access", "دسترسی مالک");
        OwnerAccessDescription.Text = T("Unlock before running management actions.", "پیش از اجرای عملیات مدیریتی، برنامه را باز کنید.");
        UnlockButton.Content = T("Unlock", "باز کردن");
        TargetLabel.Text = T("Target", "مقصد");
        EnsureButton.Content = T("Ensure Server Running", "اطمینان از اجرای سرور");
        RestartButton.Content = T("Restart Server", "راه‌اندازی مجدد سرور");
        StopButton.Content = T("Stop Server", "توقف سرور");
        RefreshButton.Content = T("Refresh Status", "به‌روزرسانی وضعیت");
        ActivityTitle.Text = T("Activity", "فعالیت‌ها");
        ActivityLockedText.Text = T("Unlock owner access to view activity logs.", "برای مشاهده گزارش فعالیت‌ها، دسترسی مالک را باز کنید.");
        DockerLabel.Text = T("Docker", "داکر");
        StackLabel.Text = T("Stack", "استک");
        TunnelLabel.Text = T("Tunnel", "تونل");
        StagingLabel.Text = T("Staging", "استیجینگ");
        ProductionLabel.Text = T("Production", "پروداکشن");
        ThemeButton.Content = _dark ? T("Light", "روشن") : T("Dark", "تیره");
        _tray?.UpdateLanguage(_fa);
    }

    private void ConfigureTray()
    {
        _tray.OpenRequested += () => Dispatcher.Invoke(ShowFromTray);
        _tray.EnsureRequested += () => Dispatcher.Invoke(() => RunTrayAction(EnsureButton_Click));
        _tray.RestartRequested += () => Dispatcher.Invoke(() => RunTrayAction(RestartButton_Click));
        _tray.StopRequested += () => Dispatcher.Invoke(() => RunTrayAction(StopButton_Click));
        _tray.ExitRequested += () => Dispatcher.Invoke(() => { _exitRequested = true; Close(); });
    }

    private void RunTrayAction(RoutedEventHandler handler)
    {
        if (!_unlocked)
        {
            ShowFromTray();
            _tray.ShowNotification("Prompt Draft Server Manager", T("Unlock owner access first.", "ابتدا دسترسی مالک را باز کنید."), warning: true);
            return;
        }
        handler(this, new RoutedEventArgs());
    }

    private void ShowFromTray()
    {
        Show();
        WindowState = WindowState.Normal;
        Activate();
        Topmost = true;
        Topmost = false;
    }

    private void Window_Closing(object? sender, CancelEventArgs e)
    {
        if (!_exitRequested && _settings.MinimizeToTray)
        {
            e.Cancel = true;
            Hide();
            return;
        }
    }

    protected override async void OnClosed(EventArgs e)
    {
        await _monitor.DisposeAsync();
        _tray.Dispose();
        _logger.Dispose();
        base.OnClosed(e);
    }

    private void Logger_EntryWritten(object? sender, LogEntry entry) =>
        Dispatcher.InvokeAsync(() =>
        {
            LogBox.AppendText(entry.Format() + Environment.NewLine);
            LogBox.ScrollToEnd();
        });

    private void SetActionButtons(bool enabled)
    {
        EnsureButton.IsEnabled = enabled;
        RestartButton.IsEnabled = enabled;
        StopButton.IsEnabled = enabled;
        RefreshButton.IsEnabled = enabled;
    }

    private string StateText(bool healthy) => healthy ? T("Healthy", "سالم") : T("Offline", "آفلاین");

    private string EndpointStateText(EndpointStatus status) =>
        !status.IsKnown ? T("Unknown", "نامشخص") : status.IsHealthy ? T("Healthy", "سالم") : T("Degraded", "دچار اختلال");

    private string EndpointDetail(EndpointStatus status) =>
        $"{T("Frontend", "فرانت‌اند")}: {Flag(status.FrontendOk)} / API: {Flag(status.ApiOk)}";

    private string Flag(bool? value) => value switch
    {
        true => T("OK", "سالم"),
        false => T("Fail", "خطا"),
        null => "?"
    };

    private string LocalizeState(ManagerOperationalState state) => state switch
    {
        ManagerOperationalState.Initializing => T("Initializing", "در حال آماده‌سازی"),
        ManagerOperationalState.DockerUnavailable => T("Docker unavailable", "داکر در دسترس نیست"),
        ManagerOperationalState.StartingDocker => T("Starting Docker", "در حال اجرای داکر"),
        ManagerOperationalState.StartingStack => T("Starting stack", "در حال اجرای استک"),
        ManagerOperationalState.WaitingForHealth => T("Waiting for health", "در انتظار سلامت سرویس‌ها"),
        ManagerOperationalState.CheckingTunnel => T("Checking tunnel", "در حال بررسی تونل"),
        ManagerOperationalState.CheckingPublicEndpoints => T("Checking public endpoints", "در حال بررسی آدرس‌های عمومی"),
        ManagerOperationalState.Healthy => T("Healthy", "سالم"),
        ManagerOperationalState.Degraded => T("Degraded", "دچار اختلال"),
        ManagerOperationalState.Offline => T("Offline", "آفلاین"),
        ManagerOperationalState.Stopping => T("Stopping", "در حال توقف"),
        ManagerOperationalState.Error => T("Error", "خطا"),
        _ => state.ToString()
    };

    private string LocalizeIncident(IncidentChange change)
    {
        if (!change.Opened) return T("Service recovered and monitoring is healthy again.", "سرویس بازیابی شد و مانیتورینگ دوباره وضعیت سالم را ثبت کرد.");
        return change.Kind switch
        {
            IncidentKind.DockerEngine => T("Docker Engine is unavailable.", "Docker Engine در دسترس نیست."),
            IncidentKind.ContainerService => T("One or more local containers are unhealthy.", "یک یا چند کانتینر محلی سالم نیستند."),
            IncidentKind.Tunnel => T("Cloudflare Tunnel is not running.", "تونل Cloudflare در حال اجرا نیست."),
            IncidentKind.ExternalConnectivity => T("Both public environments are unreachable while local services are healthy.", "هر دو محیط عمومی در حالی که سرویس‌های محلی سالم‌اند در دسترس نیستند."),
            IncidentKind.Staging => T("Staging is unavailable while production is reachable.", "استیجینگ در دسترس نیست اما پروداکشن قابل دسترس است."),
            IncidentKind.Production => T("Production is unavailable while staging is reachable.", "پروداکشن در دسترس نیست اما استیجینگ قابل دسترس است."),
            _ => change.Message
        };
    }

    private string T(string en, string fa) => _fa ? fa : en;
}
