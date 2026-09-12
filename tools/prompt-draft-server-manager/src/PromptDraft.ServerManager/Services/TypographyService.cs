using System.IO;
using System.Net.Http;
using WpfFontFamily = System.Windows.Media.FontFamily;
using WpfFonts = System.Windows.Media.Fonts;

namespace PromptDraft.ServerManager.Services;

public sealed class TypographyService
{
    private const string DmSansUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf";
    private const string VazirmatnUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/vazirmatn/Vazirmatn%5Bwght%5D.ttf";
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(30) };

    public static TypographyService Instance { get; } = new();

    public WpfFontFamily EnglishFont { get; private set; } = new("DM Sans, Segoe UI");
    public WpfFontFamily PersianFont { get; private set; } = new("Vazirmatn, Segoe UI");
    public bool IsCached { get; private set; }

    private TypographyService() { }

    public async Task<bool> EnsureCachedFontsAsync(CancellationToken cancellationToken = default)
    {
        var root = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "PromptDraftServerManager",
            "fonts");
        Directory.CreateDirectory(root);

        var dmSansPath = Path.Combine(root, "DMSans.ttf");
        var vazirmatnPath = Path.Combine(root, "Vazirmatn.ttf");

        try
        {
            await DownloadIfMissingAsync(DmSansUrl, dmSansPath, cancellationToken);
            await DownloadIfMissingAsync(VazirmatnUrl, vazirmatnPath, cancellationToken);

            EnglishFont = CreatePrivateFont(root, "DM Sans", EnglishFont);
            PersianFont = CreatePrivateFont(root, "Vazirmatn", PersianFont);
            IsCached = File.Exists(dmSansPath) && File.Exists(vazirmatnPath);
            return IsCached;
        }
        catch
        {
            // Font availability must never prevent the operations console from starting.
            IsCached = false;
            return false;
        }
    }

    private static async Task DownloadIfMissingAsync(string url, string destination, CancellationToken cancellationToken)
    {
        if (File.Exists(destination) && new FileInfo(destination).Length > 32_000) return;

        var temporary = destination + ".download";
        try
        {
            using var response = await Http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            response.EnsureSuccessStatusCode();
            await using var input = await response.Content.ReadAsStreamAsync(cancellationToken);
            await using var output = File.Create(temporary);
            await input.CopyToAsync(output, cancellationToken);
            output.Close();
            File.Move(temporary, destination, overwrite: true);
        }
        finally
        {
            if (File.Exists(temporary)) File.Delete(temporary);
        }
    }

    private static WpfFontFamily CreatePrivateFont(string directory, string expectedFamilyName, WpfFontFamily fallback)
    {
        try
        {
            var directoryUri = new Uri(directory.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar, UriKind.Absolute);
            var family = WpfFonts.GetFontFamilies(directoryUri)
                .FirstOrDefault(candidate => candidate.Source.Contains(expectedFamilyName, StringComparison.OrdinalIgnoreCase));
            return family ?? fallback;
        }
        catch
        {
            return fallback;
        }
    }
}
