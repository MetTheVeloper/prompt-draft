using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using PromptDraft.ServerManager.Services;

namespace PromptDraft.ServerManager;

public partial class LogViewerWindow : Window
{
    private readonly string _repoRoot;
    private readonly CommandDefinition _command;
    private readonly bool _dark;
    private readonly bool _fa;
    private readonly CancellationTokenSource _cts = new();
    private Process? _process;
    private bool _closing;

    public LogViewerWindow(string title, string repoRoot, CommandDefinition command, bool dark, bool fa)
    {
        InitializeComponent();
        Title = title;
        HeaderText.Text = title;
        _repoRoot = repoRoot;
        _command = command;
        _dark = dark;
        _fa = fa;

        FlowDirection = _fa ? System.Windows.FlowDirection.RightToLeft : System.Windows.FlowDirection.LeftToRight;
        FontFamily = _fa ? TypographyService.Instance.PersianFont : TypographyService.Instance.EnglishFont;
        StatusText.Text = _fa ? "در حال اتصال به جریان لاگ..." : "Connecting to log stream...";
        StopButton.Content = _fa ? "توقف جریان" : "Stop stream";
        SourceInitialized += (_, _) => WindowThemeService.Apply(this, _dark);
        Loaded += async (_, _) => await StartAsync();
    }

    private async Task StartAsync()
    {
        var psi = new ProcessStartInfo(_command.FileName)
        {
            WorkingDirectory = _repoRoot,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };
        foreach (var argument in _command.Arguments) psi.ArgumentList.Add(argument);

        _process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        _process.OutputDataReceived += (_, e) => AppendLine(e.Data, false);
        _process.ErrorDataReceived += (_, e) => AppendLine(e.Data, true);

        try
        {
            if (!_process.Start()) throw new InvalidOperationException("The log process could not be started.");
            _process.BeginOutputReadLine();
            _process.BeginErrorReadLine();
            StatusText.Text = _fa ? "جریان لاگ فعال است" : "Log stream is active";
            await _process.WaitForExitAsync(_cts.Token);
            if (!_closing)
                StatusText.Text = _fa ? $"جریان متوقف شد (کد {_process.ExitCode})" : $"Stream ended (exit {_process.ExitCode})";
        }
        catch (OperationCanceledException)
        {
            if (!_closing) StatusText.Text = _fa ? "جریان متوقف شد" : "Stream stopped";
        }
        catch (Exception ex)
        {
            AppendLine(ex.Message, true);
            StatusText.Text = _fa ? "خطا در اجرای جریان لاگ" : "Log stream failed";
        }
    }

    private void AppendLine(string? line, bool error)
    {
        if (string.IsNullOrWhiteSpace(line)) return;
        Dispatcher.InvokeAsync(() =>
        {
            OutputBox.AppendText($"{DateTime.Now:HH:mm:ss} {(error ? "ERR" : "LOG")} {line}{Environment.NewLine}");
            OutputBox.ScrollToEnd();
        });
    }

    private void StopButton_Click(object sender, RoutedEventArgs e) => StopProcess();

    private void StopProcess()
    {
        if (_cts.IsCancellationRequested) return;
        _cts.Cancel();
        try
        {
            if (_process is { HasExited: false }) _process.Kill(entireProcessTree: true);
        }
        catch { }
    }

    private void Window_Closing(object? sender, CancelEventArgs e)
    {
        _closing = true;
        StopProcess();
        _process?.Dispose();
        _cts.Dispose();
    }
}
