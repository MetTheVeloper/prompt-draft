# Prompt Draft Server Manager — Development Notes

## Temporary Owner Access bypass

Development builds currently bypass Owner Access so the management surface can be tested without repeatedly entering the local owner password.

Source of truth:

```text
src/PromptDraft.ServerManager/Security/DevelopmentSecurityOptions.cs
```

Current value:

```csharp
public const bool BypassOwnerAccess = true;
```

While this flag is `true`:

- the password / confirmation / Unlock / Lock controls are hidden;
- the manager starts with owner access unlocked;
- management controls and Activity are immediately available;
- the real `OwnerAuthService`, Argon2id verifier, and existing `owner.auth` file are left untouched;
- the Activity log records `DEVELOPMENT OWNER BYPASS ACTIVE`.

Before any production/published V1 acceptance, set the flag to `false` and re-run the Owner Access verification flow. Never ship the final manager with this bypass enabled.
