using System.IO;
using System.Text.Json;
using PromptDraft.ServerManager.Models;

namespace PromptDraft.ServerManager.Services;

public sealed class SettingsService
{
    private readonly string _path;
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public SettingsService()
    {
        var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PromptDraftServerManager");
        Directory.CreateDirectory(root);
        _path = Path.Combine(root, "settings.json");
    }

    public ManagerSettings Load()
    {
        try
        {
            if (!File.Exists(_path)) return new ManagerSettings();
            return JsonSerializer.Deserialize<ManagerSettings>(File.ReadAllText(_path)) ?? new ManagerSettings();
        }
        catch
        {
            return new ManagerSettings();
        }
    }

    public Task SaveAsync(ManagerSettings settings) =>
        File.WriteAllTextAsync(_path, JsonSerializer.Serialize(settings, JsonOptions));
}
