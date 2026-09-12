using System.Globalization;
using System.Windows;
using System.Windows.Controls;
using MaterialDesignThemes.Wpf;
using PromptDraft.ServerManager.Security;
using PromptDraft.ServerManager.Services;

namespace PromptDraft.ServerManager;

public partial class MainWindow : Window
{
    private readonly OwnerAuthService _auth = new();
    private readonly LocalServerTarget _target = new();
    private bool _dark;
    private bool _fa;

    public MainWindow()
    {
        InitializeComponent();
        AppendLog("INFO", "Manager", "Application started");
    }

    private async void UnlockButton_Click(object sender, RoutedEventArgs e)
    {
        var password = OwnerPassword.Password;
        if (string.IsNullOrWhiteSpace(password)) return;

        bool ok;
        if (!_auth.IsConfigured)
        {
            await _auth.InitializeAsync(password);
            ok = true;
            AppendLog("INFO", "Security", "Owner credential initialized");
        }
        else
        {
            ok = await _auth.VerifyAsync(password);
        }

        OwnerPassword.Clear();
        AuthStateText.Text = ok ? T("Unlocked", "باز شد") : T("Invalid password", "رمز نادرست است");
        EnsureButton.IsEnabled = ok;
        RefreshButton.IsEnabled = ok;
        AppendLog(ok ? "INFO" : "WARN", "Security", ok ? "Owner access unlocked" : "Owner authentication failed");
    }

    private async void EnsureButton_Click(object sender, RoutedEventArgs e)
    {
        EnsureButton.IsEnabled = false;
        try
        {
            AppendLog("INFO", "Stack", "Ensuring Cloudflare-enabled stack is running without rebuild");
            var result = await _target.EnsureRunningAsync(CancellationToken.None);
            AppendLog(result.ExitCode == 0 ? "INFO" : "ERROR", "Stack", result.Summary);
            await RefreshAsync();
        }
        finally { EnsureButton.IsEnabled = true; }
    }

    private async void RefreshButton_Click(object sender, RoutedEventArgs e) => await RefreshAsync();

    private async Task RefreshAsync()
    {
        var snapshot = await _target.GetStatusAsync(CancellationToken.None);
        DockerState.Text = snapshot.Docker;
        StackState.Text = snapshot.Stack;
        TunnelState.Text = snapshot.Tunnel;
        StagingState.Text = snapshot.Staging;
        ProductionState.Text = snapshot.Production;
        AppendLog("INFO", "Health", snapshot.Message);
    }

    private void ThemeButton_Click(object sender, RoutedEventArgs e)
    {
        _dark = !_dark;
        var helper = new PaletteHelper();
        var theme = helper.GetTheme();
        theme.SetBaseTheme(_dark ? BaseTheme.Dark : BaseTheme.Light);
        helper.SetTheme(theme);
        ThemeButton.Content = _dark ? T("Light", "روشن") : T("Dark", "تیره");
    }

    private void LanguageButton_Click(object sender, RoutedEventArgs e)
    {
        _fa = !_fa;
        FlowDirection = _fa ? FlowDirection.RightToLeft : FlowDirection.LeftToRight;
        Language = System.Windows.Markup.XmlLanguage.GetLanguage(_fa ? "fa-IR" : CultureInfo.CurrentUICulture.IetfLanguageTag);
        LanguageButton.Content = _fa ? "EN" : "FA";
        SubtitleText.Text = T("Local operations console", "کنسول مدیریت محلی");
        OwnerAccessTitle.Text = T("Owner access", "دسترسی مالک");
        OwnerAccessDescription.Text = T("Unlock before running management actions.", "پیش از اجرای عملیات مدیریتی، برنامه را باز کنید.");
        UnlockButton.Content = T("Unlock", "باز کردن");
        EnsureButton.Content = T("Ensure Server Running", "اطمینان از اجرای سرور");
        RefreshButton.Content = T("Refresh Status", "به‌روزرسانی وضعیت");
        ActivityTitle.Text = T("Activity", "فعالیت‌ها");
        ThemeButton.Content = _dark ? T("Light", "روشن") : T("Dark", "تیره");
    }

    private string T(string en, string fa) => _fa ? fa : en;

    private void AppendLog(string level, string subsystem, string message)
    {
        LogBox.AppendText($"{DateTime.Now:HH:mm:ss} {level,-5} {subsystem,-10} {message}{Environment.NewLine}");
        LogBox.ScrollToEnd();
    }
}
