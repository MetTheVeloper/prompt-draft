using System.IO;
using System.Net.Http;
using System.Text.Json;
using PromptDraft.ServerManager.Models;

namespace PromptDraft.ServerManager.Services;

public sealed class LocalServerTarget
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(8) };
    private readonly CommandRunner _runner = new();
    private readonly string _repoRoot;
    private readonly TimeSpan _startupTimeout;

    public LocalServerTarget(string configuredRepoPath, TimeSpan startupTimeout)
    {
        _repoRoot = ResolveRepoRoot(configuredRepoPath);
        _startupTimeout = startupTimeout;
    }

    public string RepoRoot => _repoRoot;

    public async Task<CommandResult> EnsureRunningAsync(CancellationToken cancellationToken)
    {
        await EnsureDockerReadyAsync(cancellationToken);
        return await RunRegisteredCommandAsync("EnsureCloudflareStack", cancellationToken);
    }

    public Task<CommandResult> RunRegisteredCommandAsync(string commandName, CancellationToken cancellationToken)
    {
        var command = CommandRegistry.Commands[commandName];
        return _runner.RunAsync(command.FileName, command.Arguments, _repoRoot, command.Timeout, cancellationToken);
    }

    public async Task<LocalRuntimeStatus> GetLocalStatusAsync(CancellationToken cancellationToken)
    {
        if (!await ProbeDockerAsync(cancellationToken))
            return new(false, false, false, DateTimeOffset.Now);

        var status = await RunRegisteredCommandAsync("CloudflareStatusJson", cancellationToken);
        if (status.ExitCode != 0)
            return new(true, false, false, DateTimeOffset.Now);

        var services = ParseComposeStatus(status.StdOut);
        var stackHealthy = IsHealthy(services, "frontend") && IsHealthy(services, "api") && IsHealthy(services, "db") && IsHealthy(services, "translator");
        var tunnelRunning = IsRunning(services, "cloudflared");
        return new(true, stackHealthy, tunnelRunning, DateTimeOffset.Now);
    }

    public async Task<PublicRuntimeStatus> GetPublicStatusAsync(CancellationToken cancellationToken)
    {
        var stagingFrontend = ProbeEndpointAsync("https://grassic.ir/", cancellationToken);
        var stagingApi = ProbeEndpointAsync("https://api.grassic.ir/api/db-check", cancellationToken);
        var productionFrontend = ProbeEndpointAsync("https://prompt-draft.ir/", cancellationToken);
        var productionApi = ProbeEndpointAsync("https://api.prompt-draft.ir/api/db-check", cancellationToken);
        await Task.WhenAll(stagingFrontend, stagingApi, productionFrontend, productionApi);

        return new(
            new(await stagingFrontend, await stagingApi),
            new(await productionFrontend, await productionApi),
            DateTimeOffset.Now);
    }

    public async Task<ServerStatusSnapshot> GetStatusAsync(CancellationToken cancellationToken)
    {
        var localTask = GetLocalStatusAsync(cancellationToken);
        var publicTask = GetPublicStatusAsync(cancellationToken);
        await Task.WhenAll(localTask, publicTask);
        var local = await localTask;
        var publicStatus = await publicTask;
        return new(local.DockerReady, local.StackHealthy, local.TunnelRunning, publicStatus.Staging, publicStatus.Production, DateTimeOffset.Now);
    }

    private async Task EnsureDockerReadyAsync(CancellationToken cancellationToken)
    {
        if (await ProbeDockerAsync(cancellationToken)) return;

        var dockerDesktop = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Docker", "Docker", "Docker Desktop.exe");
        if (!File.Exists(dockerDesktop)) throw new FileNotFoundException("Docker Desktop could not be located.", dockerDesktop);

        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(dockerDesktop) { UseShellExecute = true });
        var deadline = DateTime.UtcNow.Add(_startupTimeout);
        while (DateTime.UtcNow < deadline)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
            if (await ProbeDockerAsync(cancellationToken)) return;
        }

        throw new TimeoutException($"Docker Engine did not become ready within {_startupTimeout.TotalSeconds:0} seconds.");
    }

    private async Task<bool> ProbeDockerAsync(CancellationToken cancellationToken)
    {
        try
        {
            var result = await RunRegisteredCommandAsync("DockerInfo", cancellationToken);
            return result.ExitCode == 0;
        }
        catch { return false; }
    }

    private static async Task<bool> ProbeEndpointAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await Http.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch { return false; }
    }

    private static Dictionary<string, (string State, string Health)> ParseComposeStatus(string json)
    {
        var result = new Dictionary<string, (string State, string Health)>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(json)) return result;

        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var element in document.RootElement.EnumerateArray()) AddService(element, result);
            }
            else if (document.RootElement.ValueKind == JsonValueKind.Object)
            {
                AddService(document.RootElement, result);
            }
            return result;
        }
        catch (JsonException)
        {
            foreach (var line in json.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                try
                {
                    using var document = JsonDocument.Parse(line);
                    AddService(document.RootElement, result);
                }
                catch (JsonException) { }
            }
            return result;
        }
    }

    private static void AddService(JsonElement element, Dictionary<string, (string State, string Health)> result)
    {
        if (!element.TryGetProperty("Service", out var serviceProperty)) return;
        var service = serviceProperty.GetString();
        if (string.IsNullOrWhiteSpace(service)) return;
        var state = element.TryGetProperty("State", out var stateProperty) ? stateProperty.GetString() ?? string.Empty : string.Empty;
        var health = element.TryGetProperty("Health", out var healthProperty) ? healthProperty.GetString() ?? string.Empty : string.Empty;
        result[service] = (state, health);
    }

    private static bool IsHealthy(IReadOnlyDictionary<string, (string State, string Health)> services, string service) =>
        services.TryGetValue(service, out var status) &&
        status.State.Equals("running", StringComparison.OrdinalIgnoreCase) &&
        status.Health.Equals("healthy", StringComparison.OrdinalIgnoreCase);

    private static bool IsRunning(IReadOnlyDictionary<string, (string State, string Health)> services, string service) =>
        services.TryGetValue(service, out var status) && status.State.Equals("running", StringComparison.OrdinalIgnoreCase);

    private static string ResolveRepoRoot(string configuredRepoPath)
    {
        if (IsRepoRoot(configuredRepoPath)) return configuredRepoPath;

        const string preferred = @"G:\ZADAK\prompt-draft";
        if (IsRepoRoot(preferred)) return preferred;

        var cursor = AppContext.BaseDirectory;
        for (var i = 0; i < 12; i++)
        {
            if (IsRepoRoot(cursor)) return cursor;
            var parent = Directory.GetParent(cursor);
            if (parent is null) break;
            cursor = parent.FullName;
        }

        throw new DirectoryNotFoundException("Prompt Draft repository could not be located. Configure the repository path before using server actions.");
    }

    private static bool IsRepoRoot(string? path) =>
        !string.IsNullOrWhiteSpace(path) && File.Exists(Path.Combine(path, "package.json")) && File.Exists(Path.Combine(path, "compose.yaml"));
}
