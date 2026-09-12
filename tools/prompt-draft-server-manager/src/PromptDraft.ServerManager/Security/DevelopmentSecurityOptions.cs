namespace PromptDraft.ServerManager.Security;

/// <summary>
/// Temporary development-only switches. Keep the real OwnerAuthService intact so
/// production hardening can be restored by changing this single flag to false.
/// </summary>
public static class DevelopmentSecurityOptions
{
    public static readonly bool BypassOwnerAccess = true;
}
