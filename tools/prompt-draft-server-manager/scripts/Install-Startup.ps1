param(
  [string]$ExePath = (Join-Path $PSScriptRoot '..\dist\PromptDraft.ServerManager.exe')
)

$ErrorActionPreference = 'Stop'
$taskName = 'Prompt Draft Server Manager'
$resolved = (Resolve-Path $ExePath).Path
$action = New-ScheduledTaskAction -Execute $resolved
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Host "Installed scheduled task '$taskName' for $env:USERNAME"
Write-Host "Executable: $resolved"
