# Prompt Draft Server Manager

Windows operations console for the founder-hosted Prompt Draft Docker + Cloudflare Tunnel runtime.

## Current architecture

- .NET 8 WPF desktop application
- Material Design 3 via `MaterialDesignThemes` 5.3.2
- English/LTR and Persian/RTL runtime language switching
- Light/Dark runtime theme switching
- single-instance named mutex
- owner lock independent from Prompt Draft account login
- Argon2id owner verifier stored under `%LOCALAPPDATA%\PromptDraftServerManager\owner.auth`
- semantic command registry and local execution target
- Docker readiness probe uses `docker info`, not process existence
- Docker Desktop auto-start from the standard Program Files path when Engine is unavailable
- routine Cloudflare stack startup uses non-build `docker compose ... up -d`
- status checks cover Docker, compose health/tunnel presence, staging frontend+API and production frontend+API
- no automatic `git pull`
- no DNS/Tunnel route/Worker/indexability mutation

The execution boundary is intentionally target-oriented so a future `RemoteSshTarget` can execute the same semantic operations against a real VPS without rewriting the WPF UI.

## Prerequisites

On the Windows founder machine:

- Docker Desktop
- Git working copy of `MetTheVeloper/prompt-draft`
- pnpm (for the existing project scripts)
- .NET 8 SDK only when building from source

Default repo path is `G:\ZADAK\prompt-draft`. The app also searches parent directories when launched from a publish directory inside the repo. Configurable repo-path UI is a remaining V1 hardening item.

## Build

```powershell
cd G:\ZADAK\prompt-draft\tools\prompt-draft-server-manager
dotnet restore .\PromptDraftServerManager.sln
dotnet build .\PromptDraftServerManager.sln -c Release
dotnet publish .\src\PromptDraft.ServerManager\PromptDraft.ServerManager.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o .\dist
```

Expected executable:

```text
tools\prompt-draft-server-manager\dist\PromptDraft.ServerManager.exe
```

Generated `dist`, `bin`, `obj`, owner credentials and logs must not be committed.

## Owner access

On first run, the first non-empty password submitted to the Owner Access panel initializes the local owner credential. The password itself is never stored. The app derives a 32-byte Argon2id verifier using a random salt and constant-time comparison on future unlock attempts.

The credential is machine-local in V1. A portable encrypted owner credential and optional trusted-device enrollment can be added after the local security flow is founder-verified.

## Startup task

After publishing:

```powershell
cd G:\ZADAK\prompt-draft\tools\prompt-draft-server-manager
.\scripts\Install-Startup.ps1
```

Remove it with:

```powershell
.\scripts\Remove-Startup.ps1
```

The task runs interactively at current-user logon and uses `IgnoreNew` in addition to the app's named mutex.

## Normal startup behavior

The intended V1 flow is:

```text
launch manager
-> acquire single-instance mutex
-> owner unlock for management actions
-> docker info readiness probe
-> start Docker Desktop when needed
-> wait up to five minutes for Engine readiness
-> docker compose -f compose.yaml -f compose.cloudflare.yaml up -d (no build)
-> inspect compose health/tunnel state
-> check staging frontend + API
-> check production frontend + API
```

## Current implementation checkpoint

Implemented in the first skeleton:

- WPF/Material 3 shell
- Light/Dark switching
- EN/FA + LTR/RTL switching
- single-instance guard
- Argon2id owner lock
- safe `ProcessStartInfo.ArgumentList` command runner
- central command registry
- local target boundary ready for future remote target
- Docker Engine readiness/startup
- non-build full-stack ensure command
- local/public one-shot status checks
- startup install/remove scripts

Still required before V1 acceptance:

- persisted settings and repo-path picker
- explicit state-machine model + per-service status model
- continuous monitoring/debounce/recovery incidents
- Windows toast notifications
- tray icon/menu/minimize behavior
- streaming/file logs + retention
- dedicated long-running Docker log viewer/cancellation
- full safe operation controls for stack/frontend/API
- structured compose parsing instead of the first-pass textual health summary
- unit tests and founder-local integration tests A-H
- first-run owner-password confirmation/reset/recovery UX
- final Material 3 polish and bilingual copy pass

Nothing in this checkpoint is production-cutover authorization.
