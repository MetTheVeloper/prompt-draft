$ErrorActionPreference = "Stop"

$toolRoot = Split-Path -Parent $PSScriptRoot
$appProject = Join-Path $toolRoot "src\PromptDraft.ServerManager\PromptDraft.ServerManager.csproj"
$installerProject = Join-Path $toolRoot "installer\PromptDraft.ServerManager.Setup.wixproj"
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

dotnet build $installerProject `
  -c Release `
  -p:PublishDir="$publishDir" `
  -p:OutputPath="$installerDir\"

if ($LASTEXITCODE -ne 0) { throw "WiX installer build failed." }

Write-Host "Installer output:" -ForegroundColor Green
Get-ChildItem $installerDir -Filter *.msi -Recurse | ForEach-Object { Write-Host $_.FullName }
