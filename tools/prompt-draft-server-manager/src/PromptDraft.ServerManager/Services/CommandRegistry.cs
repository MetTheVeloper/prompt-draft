namespace PromptDraft.ServerManager.Services;

public sealed record CommandDefinition(string FileName, string[] Arguments, TimeSpan Timeout);

public static class CommandRegistry
{
    public static readonly IReadOnlyDictionary<string, CommandDefinition> Commands = new Dictionary<string, CommandDefinition>(StringComparer.OrdinalIgnoreCase)
    {
        ["DockerInfo"] = new("docker.exe", ["info"], TimeSpan.FromSeconds(20)),
        // Routine startup is intentionally non-build. Existing pnpm stack:cloudflare includes --build.
        ["EnsureCloudflareStack"] = new("docker.exe", ["compose", "-f", "compose.yaml", "-f", "compose.cloudflare.yaml", "up", "-d"], TimeSpan.FromMinutes(3)),
        ["RestartCloudflareStack"] = new("docker.exe", ["compose", "-f", "compose.yaml", "-f", "compose.cloudflare.yaml", "restart"], TimeSpan.FromMinutes(3)),
        ["CloudflareStatusJson"] = new("docker.exe", ["compose", "-f", "compose.yaml", "-f", "compose.cloudflare.yaml", "ps", "--format", "json"], TimeSpan.FromSeconds(30)),
        ["CloudflareStatus"] = new("pnpm.cmd", ["stack:cloudflare:status"], TimeSpan.FromSeconds(30)),
        ["FrontendBuild"] = new("pnpm.cmd", ["frontend"], TimeSpan.FromMinutes(15)),
        ["FrontendRestart"] = new("pnpm.cmd", ["frontend:restart"], TimeSpan.FromMinutes(15)),
        ["FrontendStop"] = new("pnpm.cmd", ["frontend:stop"], TimeSpan.FromMinutes(2)),
        ["ApiBuild"] = new("pnpm.cmd", ["api"], TimeSpan.FromMinutes(15)),
        ["ApiRestart"] = new("pnpm.cmd", ["api:restart"], TimeSpan.FromMinutes(15)),
        ["ApiStop"] = new("pnpm.cmd", ["api:stop"], TimeSpan.FromMinutes(2)),
        ["StopCloudflareStack"] = new("pnpm.cmd", ["stack:cloudflare:stop"], TimeSpan.FromMinutes(3))
    };
}
