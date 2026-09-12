$ErrorActionPreference = "Stop"

$toolRoot = Split-Path -Parent $PSScriptRoot
$appProject = Join-Path $toolRoot "src\PromptDraft.ServerManager\PromptDraft.ServerManager.csproj"
$installerScript = Join-Path $toolRoot "installer\PromptDraftServerManager.nsi"
$publishDir = Join-Path $toolRoot "dist\publish"
$installerDir = Join-Path $toolRoot "dist\installer"

Write-Host "Prompt Draft Server Manager installer build" -ForegroundColor Cyan
Write-Warning "This development build currently includes DEVELOPMENT OWNER BYPASS. Do not treat it as a secured release."

Remove-Item $publishDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $installerDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $publishDir | Out-Null
New-Item -ItemType Directory -Force -Path $installerDir | Out-Null

dotnet publish $appProject `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=true `
  -p:DebugType=None `
  -p:DebugSymbols=false `
  -o $publishDir

if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed." }

$makensis = $null
$command = Get-Command makensis.exe -ErrorAction SilentlyContinue
if ($command) { $makensis = $command.Source }

if (-not $makensis) {
  $candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} "NSIS\makensis.exe"),
    (Join-Path $env:ProgramFiles "NSIS\makensis.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\NSIS\makensis.exe")
  ) | Where-Object { $_ -and (Test-Path $_) }

  if ($candidates.Count -gt 0) { $makensis = $candidates[0] }
}

if (-not $makensis) {
  Write-Host "" 
  Write-Host "NSIS is required to build the Windows setup executable." -ForegroundColor Yellow
  Write-Host "Install it once with:" -ForegroundColor Yellow
  Write-Host "  winget install -e --id NSIS.NSIS" -ForegroundColor White
  Write-Host "Then run this Build-Installer.ps1 script again." -ForegroundColor Yellow
  throw "NSIS makensis.exe was not found."
}

& $makensis `
  "/DPublishDir=$publishDir" `
  "/DOutputDir=$installerDir" `
  $installerScript

if ($LASTEXITCODE -ne 0) { throw "NSIS installer build failed." }

$setups = Get-ChildItem $installerDir -Filter *.exe -Recurse
if (-not $setups) { throw "Installer build completed but no setup executable was found." }

Write-Host "Installer output:" -ForegroundColor Green
$setups | ForEach-Object { Write-Host $_.FullName }
