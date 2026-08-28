# Public Actions Contract

This document defines the provider-neutral Actions API boundary used by internal Wizards and external agent/model hosts.

## Contract version

`prompt-draft.actions.v1`

The contract is exposed from `app/actions/public.ts` and re-exported by `app/actions/index.ts`.

Public Action IDs and invocation/result meaning are compatibility surfaces.

## Public registry

`createPublicActionRegistry()` assembles the canonical public registry.

Current public surface: **101 Actions**.

The previously accepted 2026-08-27 baseline contained 99 Actions. Phase 10 deliberately adds two compatible mutation IDs:

- `prompt.settings.update`
- `prompt.outputFormat.set`

No existing public ID was removed, renamed, or repurposed.

Internal helpers and domain services remain excluded unless deliberately promoted as public Actions.

## Discovery manifest

`exportPublicActionManifest()` returns JSON-safe discovery data containing:

- contract name;
- Action ID;
- description;
- `effect: read | mutation`;
- JSON-Schema-compatible input schema.

`prompt.validate` and `prompt.compile` are reads. All state-changing Actions, including the two Phase 10 Actions, are mutations.

## Schema mapping

The repository-owned Action schema remains authoritative. Public discovery maps that subset to JSON-Schema-compatible data while preserving:

- enums;
- string length constraints;
- numeric minimum/maximum;
- arrays and item constraints;
- nested object properties;
- required fields;
- `additionalProperties` closure.

Internal `type: "unknown"` is exported as unconstrained `{}`.

Provider-specific adapters may narrow the schema dialect for their transport, but may not change Action semantics.

## Invocation envelope

Model/consumer-owned invocation stays deliberately small:

```json
{
  "actionId": "module.activate",
  "input": {
    "moduleKey": "style"
  }
}
```

Trusted host state remains outside the request:

- `draft`;
- module registry;
- `ActionEnvironment`;
- `ActionIdFactory`;
- Vue/application runtime state.

`invokePublicAction(request, context)` rejects extra envelope fields. Missing `input` is normalized to `{}`.

## Result contract

Success and failure retain the existing `ActionExecutionResult` contract. Runtime/action failure returns the original caller Draft, preserving atomic single-Action semantics.

Malformed public invocation envelopes return `public_action_request_invalid`; unknown Action IDs retain `action_not_found`.

## Prompt state mutations

### `prompt.settings.update`

Purpose: mutate the canonical persisted Setup aggregate without exposing an arbitrary Draft/path patch.

Accepted top-level fields are exactly:

- `mode` — `text_to_image | image_to_image`;
- `idea` — string;
- `subject` — string;
- `subjectType` — canonical Prompt subject-type enum;
- `aspectRatio` — canonical value from `ASPECT_RATIO_GROUPS`;
- `globalRules` — string;
- `imageToImage` — closed typed partial object.

Accepted `imageToImage` properties are exactly:

- `referenceUsage` — `strict | balanced | loose`;
- `transformationStrength` — `subtle | balanced | strong | extreme`;
- `preserveMainSubject`;
- `preserveIdentity`;
- `preservePose`;
- `preserveOutfit`;
- `preserveComposition`;
- `preserveColors`;
- `preserveMaterials`;
- `preserveLighting`.

Nested updates are partial merges. Unknown properties are rejected by the Action schema. The domain operation also explicitly assigns known fields rather than spreading arbitrary input.

An empty known patch is rejected as `prompt_settings_update_empty`. Empty string values for authored text fields are valid because the current Setup editor/reset behavior intentionally uses them.

Cross-field completeness/semantic validity is not forced during mutation; canonical `prompt.validate` remains the validation gate, matching current editor semantics.

### `prompt.outputFormat.set`

Purpose: persist the canonical output selection in `PromptDraftState.outputFormat`.

Input:

```json
{
  "format": "modular"
}
```

Allowed values: `modular | natural | json`.

`prompt.compile` uses the persisted output format when its optional read-only `format` override is absent.

## Provider adapters

OpenAI, Gemini, MCP, REST, internal Wizard, or other consumers adapt this contract instead of importing domain implementations directly. Provider behavior must not leak into domains.

## Compatibility rules

For `prompt-draft.actions.v1`:

1. existing public Action IDs are frozen compatibility identifiers;
2. removing, renaming, or semantically repurposing an existing ID requires an explicit compatibility/version decision;
3. adding an Action requires deliberate fixture/docs review;
4. registry ordering is not compatibility-significant;
5. Action identity and semantics are compatibility-significant;
6. trusted host context stays separate from consumer invocation data;
7. internal helpers stay non-public unless deliberately promoted.

`scripts/actions-public-ids.test.ts` now pins the exact v1 set of **101 public Action IDs**.

Keeping the contract at v1 for Phase 10 is deliberate: this is an additive reviewed expansion and does not invalidate existing v1 invocations.

## Validation history

Accepted pre-Phase-10 public-contract checkpoint on 2026-08-27:

- `pnpm test:actions-api` => **167/167** at the public-contract checkpoint;
- final exact-ID fixture gate => **168/168**;
- production build => successful;
- registry => 99 public Actions.

Phase 10 implementation on 2026-08-28:

- public registry/manifest fixture updated to **101 Actions**;
- exact v1 Action-ID fixture updated to **101 IDs**;
- eight focused Setup/Output mutation tests added;
- expected full Actions suite after the extension: **176 tests**;
- TypeScript syntax/transpile checks: passed;
- real-checkout test/build gate: **pending**.

## Test coverage

`scripts/actions-prompt-settings.test.ts` covers:

- complete typed Setup aggregate update and caller isolation;
- nested partial merge;
- intentional empty-string reset semantics;
- empty update rejection;
- enum and unknown-property rejection;
- persisted Output mutation;
- invalid Output rejection;
- consumption of mutated state by `prompt.validate` and `prompt.compile`.

`scripts/actions-public-contract.test.ts` covers the **101-Action** assembly, deterministic manifest, schema mapping, effect metadata, invocation boundary, and structured failures.

`scripts/actions-public-ids.test.ts` covers the exact v1 ID set and contract-name lock.

All are included in `pnpm test:actions-api`.
