namespace PromptDraft.ServerManager.Models;

public sealed class ManagerSettings
{
    public string RepoPath { get; set; } = @"G:\ZADAK\prompt-draft";
    public int StartupTimeoutSeconds { get; set; } = 300;
    public int LocalPollSeconds { get; set; } = 10;
    public int PublicPollSeconds { get; set; } = 15;
    public bool NotificationEnabled { get; set; } = true;
    public bool MinimizeToTray { get; set; } = true;
    public int LogRetentionDays { get; set; } = 14;
    public string Theme { get; set; } = "Light";
    public string Language { get; set; } = "en";
}
