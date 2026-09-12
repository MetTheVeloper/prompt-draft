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
        ConfigureOwnerAccess();
        TargetPathText.Text = _target.RepoRoot;
        _monitor.Start();
        _ = _logger.WriteAsync("INFO", "Manager", "Application started; read-only monitoring enabled");
        if (DevelopmentSecurityOptions.BypassOwnerAccess)
            _ = _logger.WriteAsync("WARN", "Security", "DEVELOPMENT OWNER BYPASS ACTIVE");
    }

    private async void UnlockButton_Click(object sender, RoutedEventArgs e)
    {
        if (DevelopmentSecurityOptions.BypassOwnerAccess)
        {
            ConfigureOwnerAccess();
            return;
        }

        var password = OwnerPassword.Password;
        if (string.IsNullOrWhiteSpace(password)) return;

        var firstRun = !_auth.IsConfigured;
        if (firstRun && password.Length < 8)
        {
            AuthStateText.Text = T("Use at least 8 characters for the owner password.", "رمز مالک باید حداقل ۸ کاراکتر باشد.");
            return;
        }

        if (firstRun && !string.Equals(password, ConfirmOwnerPassword.Password, StringComparison.Ordinal))
        {
            AuthStateText.Text = T("Passwords do not match.", "دو رمز واردشده یکسان نیستند.");
            return;
        }

        bool ok;
        if (firstRun)
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
        ConfirmOwnerPassword.Clear();
        _unlocked = ok;
        AuthStateText.Text = ok ? T("Unlocked", "باز شد") : T("Invalid password", "رمز نادرست است");
        SetActionButtons(ok);
        LockButton.Visibility = ok ? Visibility.Visible : Visibility.Collapsed;
        UnlockButton.IsEnabled = !ok;
        LogBox.Visibility = ok ? Visibility.Visible : Visibility.Collapsed;
        ActivityLockedText.Visibility = ok ? Visibility.Collapsed : Visibility.Visible;
        ConfigureOwnerAccess();
        await _logger.WriteAsync(ok ? "INFO" : "WARN", "Security", ok ? "Owner access unlocked" : "Owner authentication failed");
    }

    private async void LockButton_Click(object sender, RoutedEventArgs e)
    {
        if (DevelopmentSecurityOptions.BypassOwnerAccess)
        {
            ConfigureOwnerAccess();
            return;
        }

        _unlocked = false;
        SetActionButtons(false);
        LockButton.Visibility = Visibility.Collapsed;
        UnlockButton.IsEnabled = true;
        LogBox.Visibility = Visibility.Collapsed;
        ActivityLockedText.Visibility = Visibility.Visible;
        AuthStateText.Text = T("Locked", "قفل است");
        await _logger.WriteAsync("INFO", "Security", "Owner access locked");
    }

    private void ConfigureOwnerAccess()
    {
        if (DevelopmentSecurityOptions.BypassOwnerAccess)
        {
            _unlocked = true;
            FirstRunHint.Visibility = Visibility.Collapsed;
            OwnerPassword.Visibility = Visibility.Collapsed;
            ConfirmOwnerPassword.Visibility = Visibility.Collapsed;
            UnlockButton.Visibility = Visibility.Collapsed;
            LockButton.Visibility = Visibility.Collapsed;
            OwnerAccessDescription.Text = T(
                "Development bypass is active. Owner authentication is temporarily disabled.",
                "حالت توسعه فعال است؛ احراز هویت مالک موقتاً غیرفعال شده است.");
            AuthStateText.Text = T("Development bypass active", "دسترسی توسعه‌ای فعال است");
            SetActionButtons(true);
            LogBox.Visibility = Visibility.Visible;
            ActivityLockedText.Visibility = Visibility.Collapsed;
            return;
        }

        OwnerPassword.Visibility = Visibility.Visible;
        UnlockButton.Visibility = Visibility.Visible;
        var firstRun = !_auth.IsConfigured;
        FirstRunHint.Visibility = firstRun ? Visibility.Visible : Visibility.Collapsed;
        ConfirmOwnerPassword.Visibility = firstRun ? Visibility.Visible : Visibility.Collapsed;
        OwnerAccessDescription.Text = firstRun
            ? T("Create the local owner password before management actions are enabled.", "برای فعال شدن عملیات مدیریتی، رمز مالک محلی را ایجاد کنید.")
            : T("Unlock before running management actions.", "پیش از اجرای عملیات مدیریتی، برنامه را باز کنید.");
        FirstRunHint.Text = T("First run: enter at least 8 characters and confirm the same password.", "اجرای اول: رمزی با حداقل ۸ کاراکتر وارد و همان رمز را تأیید کنید.");
    }

    private async void BrowseRepoButton_Click(object sender, RoutedEventArgs e)
    {
        if (!_unlocked) return;
        using var dialog = new System.Windows.Forms.FolderBrowserDialog
        {
            Description = T("Choose the Prompt Draft repository root", "پوشه ریشه مخزن Prompt Draft را انتخاب کنید"),
            SelectedPath = _settings.RepoPath,
            ShowNewFolderButton = false,
            UseDescriptionForTitle = true
        };

        if (dialog.ShowDialog() != System.Windows.Forms.DialogResult.OK) return;
        if (!LocalServerTarget.IsRepoRoot(dialog.SelectedPath))
        {
            RepoPathNotice.Text = T("That folder does not contain package.json and compose.yaml.", "این پوشه شامل package.json و compose.yaml نیست.");
            return;
        }

        _settings.RepoPath = dialog.SelectedPath;
        await _settingsService.SaveAsync(_settings);
        RepoPathNotice.Text = T(
            "Repository path saved. Restart Server Manager to apply it to monitoring and commands.",
            "مسیر مخزن ذخیره شد. برای اعمال آن در مانیتورینگ و دستورات، Server Manager را دوباره اجرا کنید.");
        await _logger.WriteAsync("INFO", "Settings", "Repository path changed; restart required to apply target");
    }

    private async void EnsureButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteActionAsync("Stack", ManagerOperationalState.StartingStack, ct => _target.EnsureRunningAsync(ct));

    private async void RestartButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteRegisteredActionAsync("Stack", "RestartCloudflareStack", ManagerOperationalState.StartingStack);

    private async void StopButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteRegisteredActionAsync("Stack", "StopCloudflareStack", ManagerOperationalState.Stopping);

    private async void RefreshButton_Click(object sender, RoutedEventArgs e) => await RefreshAsync();

    private async void FrontendBuildButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteRegisteredActionAsync("Frontend", "FrontendBuild", ManagerOperationalState.StartingStack);

    private async void FrontendRestartButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteRegisteredActionAsync("Frontend", "FrontendRestart", ManagerOperationalState.StartingStack);

    private async void FrontendStopButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteRegisteredActionAsync("Frontend", "FrontendStop", ManagerOperationalState.Stopping);

    private async void FrontendStatusButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteStatusCommandAsync("Frontend", "FrontendStatus");

    private async void ApiBuildButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteRegisteredActionAsync("API", "ApiBuild", ManagerOperationalState.StartingStack);

    private async void ApiRestartButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteRegisteredActionAsync("API", "ApiRestart", ManagerOperationalState.StartingStack);

    private async void ApiStopButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteRegisteredActionAsync("API", "ApiStop", ManagerOperationalState.Stopping);

    private async void ApiStatusButton_Click(object sender, RoutedEventArgs e) =>
        await ExecuteStatusCommandAsync("API", "ApiStatus");

    private void StackLogsButton_Click(object sender, RoutedEventArgs e) => OpenLogViewer(T("Stack logs", "لاگ‌های استک"), "CloudflareLogs");
    private void FrontendLogsButton_Click(object sender, RoutedEventArgs e) => OpenLogViewer(T("Frontend logs", "لاگ‌های فرانت‌اند"), "FrontendLogs");
    private void ApiLogsButton_Click(object sender, RoutedEventArgs e) => OpenLogViewer(T("API logs", "لاگ‌های API"), "ApiLogs");

    private void OpenLogViewer(string title, string commandName)
    {
        if (!_unlocked) return;
        var viewer = new LogViewerWindow(title, _target.RepoRoot, CommandRegistry.Commands[commandName], _dark, _fa)
        {
            Owner = this
        };
        viewer.Show();
    }

    private Task ExecuteRegisteredActionAsync(string subsystem, string commandName, ManagerOperationalState state) =>
        ExecuteActionAsync(subsystem, state, ct => _target.RunRegisteredCommandAsync(commandName, ct));

    private async Task ExecuteStatusCommandAsync(string subsystem, string commandName)
    {
        if (!_unlocked) return;
        SetActionButtons(false);
        try
        {
            var result = await _target.RunRegisteredCommandAsync(commandName, CancellationToken.None);
            await _logger.WriteAsync(result.ExitCode == 0 ? "INFO" : "ERROR", subsystem, CompactSummary(result));
        }
        catch (Exception ex)
        {
            await _logger.WriteAsync("ERROR", subsystem, ex.Message);
        }
        finally
        {
            SetActionButtons(_unlocked);
        }
    }

    private async Task ExecuteActionAsync(string subsystem, ManagerOperationalState transientState, Func<CancellationToken, Task<CommandResult>> action)
    {
        if (!_unlocked) return;
        SetActionButtons(false);
        ManagerStateText.Text = LocalizeState(transientState);
        try
        {
            await _logger.WriteAsync("INFO", subsystem, $"Operator action started: {transientState}");
            var result = await action(CancellationToken.None);
            await _logger.WriteAsync(result.ExitCode == 0 ? "INFO" : "ERROR", subsystem, CompactSummary(result));
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

    private static string CompactSummary(CommandResult result)
    {
        var summary = result.Summary.Replace("\r", string.Empty).Trim();
        const int limit = 1600;
        return summary.Length <= limit ? summary : "…" + summary[^limit..];
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
        ConfigureOwnerAccess();
        _ = _settingsService.SaveAsync(_settings);
    }

    private void ApplyLanguage()
    {
        FlowDirection = _fa ? System.Windows.FlowDirection.RightToLeft : System.Windows.FlowDirection.LeftToRight;
        Language = System.Windows.Markup.XmlLanguage.GetLanguage(_fa ? "fa-IR" : CultureInfo.CurrentUICulture.IetfLanguageTag);
        LanguageButton.Content = _fa ? "EN" : "FA";
        SubtitleText.Text = T("Local operations console", "کنسول مدیریت محلی");
        OwnerAccessTitle.Text = T("Owner access", "دسترسی مالک");
        UnlockButton.Content = T("Unlock", "باز کردن");
        LockButton.Content = T("Lock", "قفل کردن");
        TargetLabel.Text = T("Target", "مقصد");
        BrowseRepoButton.Content = T("Choose repository folder", "انتخاب پوشه مخزن");
        StackOperationsLabel.Text = T("Server stack", "استک سرور");
        EnsureButton.Content = T("Ensure Server Running", "اطمینان از اجرای سرور");
        RestartButton.Content = T("Restart Server (no build)", "راه‌اندازی مجدد سرور (بدون بیلد)");
        StopButton.Content = T("Stop Server", "توقف سرور");
        RefreshButton.Content = T("Refresh Status", "به‌روزرسانی وضعیت");
        StackLogsButton.Content = T("Stack Logs", "لاگ‌های استک");
        FrontendExpander.Header = T("Frontend", "فرانت‌اند");
        ApiExpander.Header = "API";
        FrontendBuildButton.Content = ApiBuildButton.Content = T("Build / Start", "بیلد / اجرا");
        FrontendRestartButton.Content = ApiRestartButton.Content = T("Rebuild & Restart", "بیلد مجدد و راه‌اندازی");
        FrontendStopButton.Content = ApiStopButton.Content = T("Stop", "توقف");
        FrontendStatusButton.Content = ApiStatusButton.Content = T("Status", "وضعیت");
        FrontendLogsButton.Content = ApiLogsButton.Content = T("Logs", "لاگ‌ها");
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
        StackLogsButton.IsEnabled = enabled;
        BrowseRepoButton.IsEnabled = enabled;
        FrontendBuildButton.IsEnabled = enabled;
        FrontendRestartButton.IsEnabled = enabled;
        FrontendStopButton.IsEnabled = enabled;
        FrontendStatusButton.IsEnabled = enabled;
        FrontendLogsButton.IsEnabled = enabled;
        ApiBuildButton.IsEnabled = enabled;
        ApiRestartButton.IsEnabled = enabled;
        ApiStopButton.IsEnabled = enabled;
        ApiStatusButton.IsEnabled = enabled;
        ApiLogsButton.IsEnabled = enabled;
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
