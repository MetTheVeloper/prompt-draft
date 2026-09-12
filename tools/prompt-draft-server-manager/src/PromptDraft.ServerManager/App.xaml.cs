using System.Threading;
using System.Windows;

namespace PromptDraft.ServerManager;

public partial class App : Application
{
    private const string MutexName = "Local\\PromptDraft.ServerManager.SingleInstance";
    private Mutex? _mutex;

    protected override void OnStartup(StartupEventArgs e)
    {
        _mutex = new Mutex(initiallyOwned: true, MutexName, out var createdNew);
        if (!createdNew)
        {
            MessageBox.Show("Prompt Draft Server Manager is already running.", "Prompt Draft Server Manager", MessageBoxButton.OK, MessageBoxImage.Information);
            Shutdown();
            return;
        }

        base.OnStartup(e);
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _mutex?.ReleaseMutex();
        _mutex?.Dispose();
        base.OnExit(e);
    }
}
