using System.Windows.Threading;
using PromptDraft.ServerManager.Services;

namespace PromptDraft.ServerManager;

public partial class MainWindow
{
    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        WindowThemeService.Apply(this, _dark);
        ThemeButton.Click += (_, _) =>
            Dispatcher.BeginInvoke(
                DispatcherPriority.Background,
                new Action(() => WindowThemeService.Apply(this, _dark)));
    }
}
