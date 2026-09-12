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
- local monitoring covers Docker, compose service health and cloudflared state
- public monitoring covers staging and production frontend/API independently
- incident debounce requires two consecutive failures before opening an incident
- one notification on incident open and one on recovery
- system tray with Open / Ensure / Restart / Stop / Exit
- daily file logs under `%LOCALAPPDATA%\PromptDraftServerManager\logs`
- persisted non-secret settings under `%LOCALAPPDATA%\PromptDraftServerManager\settings.json`
- no automatic `git pull`
- no DNS/Tunnel route/Worker/indexability mutation

The execution boundary is intentionally target-oriented so a future `RemoteSshTarget` can execute the same semantic operations against a real VPS without rewriting the WPF UI.

## Prerequisites

On the Windows founder machine:

- Docker Desktop
- Git working copy of `MetTheVeloper/prompt-draft`
- pnpm (for the existing project scripts)
- .NET 8 SDK only when building from source

Default repo path is `G:\ZADAK\prompt-draft`. The current V1 settings model already persists the repo path, but the graphical browse/change flow is still a remaining hardening item.

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

On first run, the first password submitted to the Owner Access panel initializes the local owner credential. V1 requires at least eight characters. The password itself is never stored. The app derives a 32-byte Argon2id verifier using a random salt and uses constant-time comparison on future unlock attempts.

The credential is machine-local in the current implementation. Portable encrypted owner credentials and optional trusted-device enrollment remain future hardening work.

Management actions and in-app activity logs stay locked until owner authentication succeeds. Read-only health monitoring starts without unlocking so runtime status remains observable without granting control.

## Monitoring

Default polling:

```text
local Docker/container state -> every 10 seconds
public endpoints             -> every 15 seconds
```

The monitor distinguishes Docker Engine failure, unhealthy local services, Tunnel failure, likely external-connectivity failure, staging-only failure, and production-only failure.

A single transient failure does not open an incident. Two consecutive failures do. Continuing incidents do not spam notifications; a recovered incident emits one recovery notification.

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

## Safe startup behavior

Opening the GUI for development/runtime verification is read-only by default:

```text
launch manager
-> acquire single-instance mutex
-> load settings
-> start local/public monitoring
-> show current status
-> require owner unlock before management operations
```

The app does **not** start, stop or restart the stack merely because the UI was opened.

When the founder explicitly selects `Ensure Server Running` after unlocking:

```text
docker info readiness probe
-> start Docker Desktop when needed
-> wait for Engine readiness
-> docker compose -f compose.yaml -f compose.cloudflare.yaml up -d (no build)
-> inspect compose health/tunnel state
-> check public endpoints
```

This split is intentional so the manager can be tested alongside another active Prompt Draft worktree without automatically mutating the shared Docker runtime.

## Logs and settings

```text
%LOCALAPPDATA%\PromptDraftServerManager\logs\YYYY-MM-DD.log
%LOCALAPPDATA%\PromptDraftServerManager\settings.json
%LOCALAPPDATA%\PromptDraftServerManager\owner.auth
```

Log retention defaults to 14 days. Secrets and environment values must never be written to these logs or settings.

## Verification ledger

### 2026-09-12 — Release build

Founder-local verification:

```text
.NET SDK 8.0.425
configuration: Release
Build succeeded.
0 Warning(s)
0 Error(s)
```

Status: `FOUNDER-LOCAL BUILD VERIFIED`

Runtime/UI behavior is not considered verified by this build alone.

## Current implementation checkpoint

Implemented:

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
- explicit non-build stack restart and stop commands
- machine-readable Compose status inspection
- local/public continuous monitoring
- incident debounce and recovery tracking
- system tray and minimize-to-tray behavior
- incident/recovery desktop notifications
- daily disk logs and retention
- persisted non-secret settings
- startup install/remove scripts
- founder-local Release build verification

Still required before V1 acceptance:

- first full founder runtime/UI pass
- configurable repo-path browse/change UI
- first-run owner-password confirmation/reset/recovery UX
- dedicated long-running Docker log viewer/cancellation
- full safe stack/frontend/API operation surface
- unit tests for state transitions, debounce, recovery, command registry, settings and endpoint aggregation
- founder-local integration tests A-H
- final Material 3 polish and bilingual copy pass
- self-contained single-file publish verification
- scheduled-task startup-after-login verification

Nothing in this checkpoint is production-cutover authorization.
