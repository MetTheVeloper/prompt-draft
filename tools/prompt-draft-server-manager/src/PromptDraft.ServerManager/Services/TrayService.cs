using System.Drawing;
using Forms = System.Windows.Forms;
using PromptDraft.ServerManager.Models;

namespace PromptDraft.ServerManager.Services;

public sealed class TrayService : IDisposable
{
    private readonly Forms.NotifyIcon _icon;
    private readonly Forms.ToolStripMenuItem _openItem;
    private readonly Forms.ToolStripMenuItem _ensureItem;
    private readonly Forms.ToolStripMenuItem _restartItem;
    private readonly Forms.ToolStripMenuItem _stopItem;
    private readonly Forms.ToolStripMenuItem _exitItem;

    public event Action? OpenRequested;
    public event Action? EnsureRequested;
    public event Action? RestartRequested;
    public event Action? StopRequested;
    public event Action? ExitRequested;

    public TrayService()
    {
        _openItem = new Forms.ToolStripMenuItem("Open", null, (_, _) => OpenRequested?.Invoke());
        _ensureItem = new Forms.ToolStripMenuItem("Ensure Running", null, (_, _) => EnsureRequested?.Invoke());
        _restartItem = new Forms.ToolStripMenuItem("Restart", null, (_, _) => RestartRequested?.Invoke());
        _stopItem = new Forms.ToolStripMenuItem("Stop", null, (_, _) => StopRequested?.Invoke());
        _exitItem = new Forms.ToolStripMenuItem("Exit", null, (_, _) => ExitRequested?.Invoke());

        var menu = new Forms.ContextMenuStrip();
        menu.Items.AddRange(new Forms.ToolStripItem[] { _openItem, new Forms.ToolStripSeparator(), _ensureItem, _restartItem, _stopItem, new Forms.ToolStripSeparator(), _exitItem });

        _icon = new Forms.NotifyIcon
        {
            Icon = SystemIcons.Application,
            Text = "Prompt Draft Server Manager",
            Visible = true,
            ContextMenuStrip = menu
        };
        _icon.DoubleClick += (_, _) => OpenRequested?.Invoke();
    }

    public void UpdateState(ManagerOperationalState state)
    {
        _icon.Text = $"Prompt Draft Manager - {state}";
    }

    public void UpdateLanguage(bool fa)
    {
        _openItem.Text = fa ? "باز کردن" : "Open";
        _ensureItem.Text = fa ? "اطمینان از اجرا" : "Ensure Running";
        _restartItem.Text = fa ? "راه‌اندازی مجدد" : "Restart";
        _stopItem.Text = fa ? "توقف" : "Stop";
        _exitItem.Text = fa ? "خروج" : "Exit";
    }

    public void ShowNotification(string title, string message, bool warning = false)
    {
        _icon.BalloonTipTitle = title;
        _icon.BalloonTipText = message;
        _icon.BalloonTipIcon = warning ? Forms.ToolTipIcon.Warning : Forms.ToolTipIcon.Info;
        _icon.ShowBalloonTip(5000);
    }

    public void Dispose()
    {
        _icon.Visible = false;
        _icon.Dispose();
    }
}
