using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

namespace PromptDraft.ServerManager.Services;

internal static class WindowThemeService
{
    private const int DwmwaUseImmersiveDarkMode = 20;
    private const int DwmwaUseImmersiveDarkModeLegacy = 19;

    public static void Apply(Window window, bool dark)
    {
        var handle = new WindowInteropHelper(window).Handle;
        if (handle == IntPtr.Zero) return;

        var enabled = dark ? 1 : 0;
        var size = Marshal.SizeOf<int>();
        if (DwmSetWindowAttribute(handle, DwmwaUseImmersiveDarkMode, ref enabled, size) != 0)
        {
            DwmSetWindowAttribute(handle, DwmwaUseImmersiveDarkModeLegacy, ref enabled, size);
        }
    }

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int attributeValue, int attributeSize);
}
