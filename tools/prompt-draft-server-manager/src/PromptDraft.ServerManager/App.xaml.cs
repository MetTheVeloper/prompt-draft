using System.IO;
using System.Threading;
using System.Windows;
using System.Windows.Threading;

namespace PromptDraft.ServerManager;

public partial class App : System.Windows.Application
{
    private const string MutexName = "Local\\PromptDraft.ServerManager.SingleInstance";
    private Mutex? _mutex;
    private bool _ownsMutex;
    private bool _fatalErrorHandled;

    protected override void OnStartup(StartupEventArgs e)
    {
        DispatcherUnhandledException += App_DispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;

        _mutex = new Mutex(initiallyOwned: true, MutexName, out var createdNew);
        _ownsMutex = createdNew;
        if (!createdNew)
        {
            System.Windows.MessageBox.Show(
                "Prompt Draft Server Manager is already running.",
                "Prompt Draft Server Manager",
                System.Windows.MessageBoxButton.OK,
                System.Windows.MessageBoxImage.Information);
            Shutdown();
            return;
        }

        base.OnStartup(e);
        ShutdownMode = System.Windows.ShutdownMode.OnExplicitShutdown;

        try
        {
            var window = new MainWindow();
            MainWindow = window;
            ShutdownMode = System.Windows.ShutdownMode.OnMainWindowClose;
            window.Show();
            window.Activate();
        }
        catch (Exception ex)
        {
            ReportFatalError("Application startup failed", ex);
        }
    }

    private void App_DispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        e.Handled = true;
        ReportFatalError("The Server Manager encountered an unexpected UI error", e.Exception);
    }

    private static void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
    {
        if (e.ExceptionObject is Exception exception)
            WriteStartupError("Unhandled process error", exception);
    }

    private void ReportFatalError(string heading, Exception exception)
    {
        if (_fatalErrorHandled) return;
        _fatalErrorHandled = true;

        var logPath = WriteStartupError(heading, exception);
        try
        {
            System.Windows.MessageBox.Show(
                $"{heading}.\n\n{exception.Message}\n\nDiagnostic log:\n{logPath}",
                "Prompt Draft Server Manager",
                System.Windows.MessageBoxButton.OK,
                System.Windows.MessageBoxImage.Error);
        }
        finally
        {
            Shutdown(-1);
        }
    }

    private static string WriteStartupError(string heading, Exception exception)
    {
        var root = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PromptDraftServerManager");
        Directory.CreateDirectory(root);
        var path = Path.Combine(root, "startup-error.log");
        var record = $"[{DateTimeOffset.Now:O}] {heading}{Environment.NewLine}{exception}{Environment.NewLine}{Environment.NewLine}";

        try
        {
            File.AppendAllText(path, record);
        }
        catch
        {
            // A diagnostic logging failure must not hide the original startup error.
        }

        return path;
    }

    protected override void OnExit(ExitEventArgs e)
    {
        DispatcherUnhandledException -= App_DispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException -= CurrentDomain_UnhandledException;

        if (_ownsMutex)
        {
            try { _mutex?.ReleaseMutex(); }
            catch (ApplicationException) { }
        }

        _mutex?.Dispose();
        base.OnExit(e);
    }
}
