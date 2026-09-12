using PromptDraft.ServerManager.Models;

namespace PromptDraft.ServerManager.Services;

public enum IncidentKind
{
    DockerEngine,
    ContainerService,
    Tunnel,
    ExternalConnectivity,
    Staging,
    Production
}

public sealed record IncidentChange(IncidentKind Kind, bool Opened, string Message);

public sealed class IncidentTracker
{
    private sealed class State
    {
        public int ConsecutiveFailures { get; set; }
        public bool IsOpen { get; set; }
    }

    private readonly Dictionary<IncidentKind, State> _states = Enum.GetValues<IncidentKind>()
        .ToDictionary(kind => kind, _ => new State());

    public IReadOnlyList<IncidentChange> Evaluate(ServerStatusSnapshot snapshot)
    {
        var activeFailures = DetermineFailures(snapshot);
        var changes = new List<IncidentChange>();

        foreach (var pair in _states)
        {
            var failed = activeFailures.Contains(pair.Key);
            var state = pair.Value;

            if (failed)
            {
                state.ConsecutiveFailures++;
                if (!state.IsOpen && state.ConsecutiveFailures >= 2)
                {
                    state.IsOpen = true;
                    changes.Add(new(pair.Key, true, OpenMessage(pair.Key)));
                }
            }
            else
            {
                state.ConsecutiveFailures = 0;
                if (state.IsOpen)
                {
                    state.IsOpen = false;
                    changes.Add(new(pair.Key, false, RecoveryMessage(pair.Key)));
                }
            }
        }

        return changes;
    }

    private static HashSet<IncidentKind> DetermineFailures(ServerStatusSnapshot snapshot)
    {
        var failures = new HashSet<IncidentKind>();
        if (!snapshot.DockerReady)
        {
            failures.Add(IncidentKind.DockerEngine);
            return failures;
        }

        if (!snapshot.StackHealthy)
        {
            failures.Add(IncidentKind.ContainerService);
            return failures;
        }

        if (!snapshot.TunnelRunning)
        {
            failures.Add(IncidentKind.Tunnel);
            return failures;
        }

        if (!snapshot.Staging.IsKnown || !snapshot.Production.IsKnown) return failures;

        if (!snapshot.Staging.IsHealthy && !snapshot.Production.IsHealthy)
        {
            failures.Add(IncidentKind.ExternalConnectivity);
            return failures;
        }

        if (!snapshot.Staging.IsHealthy) failures.Add(IncidentKind.Staging);
        if (!snapshot.Production.IsHealthy) failures.Add(IncidentKind.Production);
        return failures;
    }

    private static string OpenMessage(IncidentKind kind) => kind switch
    {
        IncidentKind.DockerEngine => "Docker Engine is unavailable after two consecutive checks.",
        IncidentKind.ContainerService => "One or more local containers are unhealthy after two consecutive checks.",
        IncidentKind.Tunnel => "Cloudflare Tunnel is not running after two consecutive checks.",
        IncidentKind.ExternalConnectivity => "Both public environments are unreachable while the local runtime is healthy.",
        IncidentKind.Staging => "Staging is unavailable while production remains reachable.",
        IncidentKind.Production => "Production is unavailable while staging remains reachable.",
        _ => "A server incident was detected."
    };

    private static string RecoveryMessage(IncidentKind kind) => $"{kind} incident recovered.";
}
