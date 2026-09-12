$ErrorActionPreference = 'Stop'
$taskName = 'Prompt Draft Server Manager'

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($null -eq $existing) {
  Write-Host "Scheduled task '$taskName' is not installed."
  exit 0
}

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "Removed scheduled task '$taskName'."
