namespace PromptDraft.ServerManager.Models;

public enum ManagerOperationalState
{
    Initializing,
    DockerUnavailable,
    StartingDocker,
    StartingStack,
    WaitingForHealth,
    CheckingTunnel,
    CheckingPublicEndpoints,
    Healthy,
    Degraded,
    Offline,
    Stopping,
    Error
}

public sealed record EndpointStatus(bool? FrontendOk, bool? ApiOk)
{
    public static EndpointStatus Unknown { get; } = new(null, null);
    public bool IsKnown => FrontendOk.HasValue && ApiOk.HasValue;
    public bool IsHealthy => FrontendOk == true && ApiOk == true;
}

public sealed record LocalRuntimeStatus(bool DockerReady, bool StackHealthy, bool TunnelRunning, DateTimeOffset CheckedAt);
public sealed record PublicRuntimeStatus(EndpointStatus Staging, EndpointStatus Production, DateTimeOffset CheckedAt);

public sealed record ServerStatusSnapshot(
    bool DockerReady,
    bool StackHealthy,
    bool TunnelRunning,
    EndpointStatus Staging,
    EndpointStatus Production,
    DateTimeOffset CheckedAt)
{
    public ManagerOperationalState State
    {
        get
        {
            if (!DockerReady) return ManagerOperationalState.DockerUnavailable;
            if (!StackHealthy || !TunnelRunning) return ManagerOperationalState.Degraded;
            if (!Staging.IsKnown || !Production.IsKnown) return ManagerOperationalState.CheckingPublicEndpoints;
            return Staging.IsHealthy && Production.IsHealthy
                ? ManagerOperationalState.Healthy
                : ManagerOperationalState.Degraded;
        }
    }
}
