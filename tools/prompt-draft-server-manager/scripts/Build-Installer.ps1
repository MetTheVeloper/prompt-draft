$ErrorActionPreference = "Stop"

$toolRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $toolRoot "..\..")).Path
$appProject = Join-Path $toolRoot "src\PromptDraft.ServerManager\PromptDraft.ServerManager.csproj"
$installerScript = Join-Path $toolRoot "installer\PromptDraftServerManager.nsi"
$iconGenerator = Join-Path $toolRoot "scripts\Generate-AppIcon.ps1"
$sourceIcon = Join-Path $repoRoot "public\pwa-512x512.png"
$publishDir = Join-Path $toolRoot "dist\publish"
$installerDir = Join-Path $toolRoot "dist\installer"
$generatedDir = Join-Path $toolRoot "dist\generated"
$appIcon = Join-Path $generatedDir "PromptDraft.ico"
$appExe = Join-Path $publishDir "PromptDraft.ServerManager.exe"

Write-Host "Prompt Draft Server Manager installer build" -ForegroundColor Cyan
Write-Warning "This development build currently includes DEVELOPMENT OWNER BYPASS. Do not treat it as a secured release."

Remove-Item $publishDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $installerDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $generatedDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $publishDir | Out-Null
New-Item -ItemType Directory -Force -Path $installerDir | Out-Null
New-Item -ItemType Directory -Force -Path $generatedDir | Out-Null

if (-not (Test-Path $sourceIcon)) {
  throw "PWA icon was not found at '$sourceIcon'."
}

& $iconGenerator -SourcePng $sourceIcon -OutputIco $appIcon
if (-not (Test-Path $appIcon)) { throw "Windows application icon generation failed." }

dotnet publish $appProject `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=true `
  -p:IncludeNativeLibrariesForSelfExtract=true `
  "-p:ApplicationIcon=$appIcon" `
  -p:DebugType=None `
  -p:DebugSymbols=false `
  -o $publishDir

if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed." }
if (-not (Test-Path $appExe)) { throw "Published application executable was not found at '$appExe'." }

$publishFiles = @(Get-ChildItem $publishDir -File -Recurse)
$publishSize = ($publishFiles | Measure-Object Length -Sum).Sum
Write-Host ("Publish payload: {0} file(s), {1:N1} MB" -f $publishFiles.Count, ($publishSize / 1MB)) -ForegroundColor DarkGray
$publishFiles | ForEach-Object {
  Write-Host ("  {0}" -f $_.FullName.Substring($publishDir.Length + 1)) -ForegroundColor DarkGray
}

$makensis = $null
$command = Get-Command makensis.exe -ErrorAction SilentlyContinue
if ($command) { $makensis = $command.Source }

if (-not $makensis) {
  $candidates = @(
    @(
      (Join-Path ${env:ProgramFiles(x86)} "NSIS\makensis.exe"),
      (Join-Path $env:ProgramFiles "NSIS\makensis.exe"),
      (Join-Path $env:LOCALAPPDATA "Programs\NSIS\makensis.exe")
    ) | Where-Object { $_ -and (Test-Path $_) }
  )

  if ($candidates.Count -gt 0) { $makensis = $candidates[0] }
}

if (-not $makensis) {
  Write-Host ""
  Write-Host "NSIS is required to build the Windows setup executable." -ForegroundColor Yellow
  Write-Host "Install it once with:" -ForegroundColor Yellow
  Write-Host "  winget install -e --id NSIS.NSIS --source winget" -ForegroundColor White
  Write-Host "Then run this Build-Installer.ps1 script again." -ForegroundColor Yellow
  throw "NSIS makensis.exe was not found."
}

Write-Host "Using NSIS: $makensis" -ForegroundColor DarkGray

& $makensis `
  "/DPublishDir=$publishDir" `
  "/DOutputDir=$installerDir" `
  "/DInstallerIcon=$appIcon" `
  $installerScript

if ($LASTEXITCODE -ne 0) { throw "NSIS installer build failed." }

$setups = @(Get-ChildItem $installerDir -Filter *.exe -Recurse)
if ($setups.Count -eq 0) { throw "Installer build completed but no setup executable was found." }

Write-Host "Installer output:" -ForegroundColor Green
$setups | ForEach-Object { Write-Host $_.FullName }
