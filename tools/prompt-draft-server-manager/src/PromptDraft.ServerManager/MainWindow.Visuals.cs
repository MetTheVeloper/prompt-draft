using System.Windows;
using System.Windows.Media;
using System.Windows.Threading;
using MaterialDesignThemes.Wpf;
using PromptDraft.ServerManager.Models;
using PromptDraft.ServerManager.Services;
using WpfButton = System.Windows.Controls.Button;
using WpfExpander = System.Windows.Controls.Expander;
using WpfOrientation = System.Windows.Controls.Orientation;
using WpfStackPanel = System.Windows.Controls.StackPanel;
using WpfTextBlock = System.Windows.Controls.TextBlock;

namespace PromptDraft.ServerManager;

public partial class MainWindow
{
    private readonly TypographyService _typography = TypographyService.Instance;
    private bool _visualsInitialized;

    private void Window_Loaded(object sender, RoutedEventArgs e)
    {
        if (_visualsInitialized) return;
        _visualsInitialized = true;

        InitializeStaticIcons();
        ApplyVisualLanguage();
        ApplyVisualTheme();

        _monitor.SnapshotUpdated += Visuals_SnapshotUpdated;

        LanguageButton.Click += (_, _) =>
            Dispatcher.BeginInvoke(DispatcherPriority.Background, new Action(ApplyVisualLanguage));
        ThemeButton.Click += (_, _) =>
            Dispatcher.BeginInvoke(DispatcherPriority.Background, new Action(ApplyVisualTheme));

        _ = InitializeTypographyAsync();
    }

    private async Task InitializeTypographyAsync()
    {
        var cached = await _typography.EnsureCachedFontsAsync();
        await Dispatcher.InvokeAsync(ApplyVisualLanguage);
        await _logger.WriteAsync(
            cached ? "INFO" : "WARN",
            "Typography",
            cached
                ? "DM Sans and Vazirmatn loaded from the local font cache"
                : "Custom font download unavailable; using installed/system font fallbacks");
    }

    private void InitializeStaticIcons()
    {
        SetIcon(LanguageToggleIcon, "Translate");
        SetIcon(CopyActivityIcon, "ContentCopy");
        SetIcon(ClearActivityIcon, "DeleteSweep", "DeleteOutline", "Delete");
        SetIcon(DockerVisualIcon, "Docker", "CubeOutline");
        SetIcon(StackVisualIcon, "ServerNetwork", "Server");
        SetIcon(TunnelVisualIcon, "CloudSyncOutline", "CloudSync", "CloudOutline");
        SetIcon(StagingVisualIcon, "FlaskOutline", "TestTube", "Web");
        SetIcon(ProductionVisualIcon, "Web", "MonitorDashboard", "Monitor");
        SetIcon(ManagerStateVisualIcon, "ProgressClock", "ClockOutline");

        SetNeutral(DockerVisualIcon);
        SetNeutral(StackVisualIcon);
        SetNeutral(TunnelVisualIcon);
        SetNeutral(StagingVisualIcon);
        SetNeutral(ProductionVisualIcon);
        SetNeutral(ManagerStateVisualIcon);
    }

    private void ApplyVisualLanguage()
    {
        FontFamily = _fa ? _typography.PersianFont : _typography.EnglishFont;

        LanguageButton.Content = LanguageToggleIcon;
        LanguageButton.ToolTip = _fa ? "تغییر زبان به انگلیسی" : "Switch to Persian";
        CopyActivityButton.ToolTip = T("Copy activity", "کپی فعالیت‌ها");
        ClearActivityButton.ToolTip = T("Clear activity view", "پاک کردن نمای فعالیت‌ها");

        SetLabeledButton(BrowseRepoButton, "FolderOpen", T("Choose repository folder", "انتخاب پوشه مخزن"));
        SetLabeledButton(EnsureButton, "PlayCircleOutline", T("Ensure Server Running", "اطمینان از اجرای سرور"));
        SetLabeledButton(RestartButton, "Restart", T("Restart Server (no build)", "راه‌اندازی مجدد سرور (بدون بیلد)"));
        SetLabeledButton(StopButton, "StopCircleOutline", T("Stop Server", "توقف سرور"));
        SetLabeledButton(RefreshButton, "Refresh", T("Refresh Status", "به‌روزرسانی وضعیت"));
        SetLabeledButton(StackLogsButton, "ConsoleLine", T("Stack Logs", "لاگ‌های استک"));

        SetExpanderHeader(FrontendExpander, "Web", T("Frontend", "فرانت‌اند"));
        SetExpanderHeader(ApiExpander, "Api", "API");

        SetLabeledButton(FrontendBuildButton, "HammerWrench", T("Build / Start", "بیلد / اجرا"));
        SetLabeledButton(ApiBuildButton, "HammerWrench", T("Build / Start", "بیلد / اجرا"));
        SetLabeledButton(FrontendRestartButton, "Restart", T("Rebuild & Restart", "بیلد مجدد و راه‌اندازی"));
        SetLabeledButton(ApiRestartButton, "Restart", T("Rebuild & Restart", "بیلد مجدد و راه‌اندازی"));
        SetLabeledButton(FrontendStopButton, "StopCircleOutline", T("Stop", "توقف"));
        SetLabeledButton(ApiStopButton, "StopCircleOutline", T("Stop", "توقف"));
        SetLabeledButton(FrontendStatusButton, "InformationOutline", T("Status", "وضعیت"));
        SetLabeledButton(ApiStatusButton, "InformationOutline", T("Status", "وضعیت"));
        SetLabeledButton(FrontendLogsButton, "ConsoleLine", T("Logs", "لاگ‌ها"));
        SetLabeledButton(ApiLogsButton, "ConsoleLine", T("Logs", "لاگ‌ها"));

        ApplyVisualTheme();
    }

    private void ApplyVisualTheme()
    {
        ThemeButton.Content = ThemeToggleIcon;
        if (_dark)
        {
            SetIcon(ThemeToggleIcon, "WhiteBalanceSunny", "WeatherSunny", "Brightness7");
            ThemeButton.ToolTip = T("Switch to light theme", "تغییر به تم روشن");
        }
        else
        {
            SetIcon(ThemeToggleIcon, "WeatherNight", "MoonWaningCrescent", "Brightness4");
            ThemeButton.ToolTip = T("Switch to dark theme", "تغییر به تم تیره");
        }
    }

    private void Visuals_SnapshotUpdated(object? sender, ServerStatusSnapshot snapshot) =>
        Dispatcher.InvokeAsync(() => ApplyStatusVisuals(snapshot));

    private void ApplyStatusVisuals(ServerStatusSnapshot snapshot)
    {
        SetBinaryStatus(DockerVisualIcon, snapshot.DockerReady);
        SetBinaryStatus(StackVisualIcon, snapshot.StackHealthy);
        SetBinaryStatus(TunnelVisualIcon, snapshot.TunnelRunning);
        SetEndpointStatus(StagingVisualIcon, snapshot.Staging);
        SetEndpointStatus(ProductionVisualIcon, snapshot.Production);

        switch (snapshot.State)
        {
            case ManagerOperationalState.Healthy:
                SetIcon(ManagerStateVisualIcon, "CheckCircleOutline", "CheckCircle");
                ManagerStateVisualIcon.Foreground = ResourceBrush("ManagerSuccessBrush");
                break;
            case ManagerOperationalState.Degraded:
                SetIcon(ManagerStateVisualIcon, "AlertCircleOutline", "AlertOutline");
                ManagerStateVisualIcon.Foreground = ResourceBrush("ManagerWarningBrush");
                break;
            case ManagerOperationalState.Offline:
            case ManagerOperationalState.DockerUnavailable:
            case ManagerOperationalState.Error:
                SetIcon(ManagerStateVisualIcon, "CloseCircleOutline", "AlertCircleOutline");
                ManagerStateVisualIcon.Foreground = ResourceBrush("ManagerErrorBrush");
                break;
            default:
                SetIcon(ManagerStateVisualIcon, "ProgressClock", "ClockOutline");
                SetNeutral(ManagerStateVisualIcon);
                break;
        }
    }

    private void SetBinaryStatus(PackIcon icon, bool healthy)
    {
        icon.Foreground = ResourceBrush(healthy ? "ManagerSuccessBrush" : "ManagerErrorBrush");
    }

    private void SetEndpointStatus(PackIcon icon, EndpointStatus status)
    {
        if (!status.IsKnown)
            SetNeutral(icon);
        else
            icon.Foreground = ResourceBrush(status.IsHealthy ? "ManagerSuccessBrush" : "ManagerWarningBrush");
    }

    private void SetNeutral(PackIcon icon) => icon.Foreground = ResourceBrush("ManagerNeutralBrush");

    private Brush ResourceBrush(string key) =>
        TryFindResource(key) as Brush ?? Brushes.Gray;

    private static void SetIcon(PackIcon icon, params string[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (!Enum.TryParse<PackIconKind>(candidate, ignoreCase: true, out var parsed)) continue;
            icon.Kind = parsed;
            icon.Visibility = Visibility.Visible;
            return;
        }

        icon.Visibility = Visibility.Collapsed;
    }

    private static void SetLabeledButton(WpfButton button, string iconName, string text)
    {
        var icon = new PackIcon { Width = 18, Height = 18, VerticalAlignment = VerticalAlignment.Center };
        SetIcon(icon, iconName, "CircleOutline");
        var label = new WpfTextBlock { Text = text, VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(8, 0, 0, 0) };
        var content = new WpfStackPanel { Orientation = WpfOrientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Center };
        content.Children.Add(icon);
        content.Children.Add(label);
        button.Content = content;
    }

    private static void SetExpanderHeader(WpfExpander expander, string iconName, string text)
    {
        var icon = new PackIcon { Width = 18, Height = 18, VerticalAlignment = VerticalAlignment.Center };
        SetIcon(icon, iconName, "CircleOutline");
        var label = new WpfTextBlock { Text = text, VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(8, 0, 0, 0) };
        var content = new WpfStackPanel { Orientation = WpfOrientation.Horizontal };
        content.Children.Add(icon);
        content.Children.Add(label);
        expander.Header = content;
    }

    private void CopyActivityButton_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(LogBox.Text)) return;
        System.Windows.Clipboard.SetText(LogBox.Text);
    }

    private void ClearActivityButton_Click(object sender, RoutedEventArgs e) => LogBox.Clear();
}
