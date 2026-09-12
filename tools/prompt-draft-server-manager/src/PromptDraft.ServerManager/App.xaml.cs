using System.Threading;
using System.Windows;

namespace PromptDraft.ServerManager;

public partial class App : System.Windows.Application
{
    private const string MutexName = "Local\\PromptDraft.ServerManager.SingleInstance";
    private Mutex? _mutex;
    private bool _ownsMutex;

    protected override void OnStartup(StartupEventArgs e)
    {
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
    }

    protected override void OnExit(ExitEventArgs e)
    {
        if (_ownsMutex) _mutex?.ReleaseMutex();
        _mutex?.Dispose();
        base.OnExit(e);
    }
}
