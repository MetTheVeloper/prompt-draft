# Public Actions Contract

This document defines the transport-neutral Actions API boundary intended for external agent/model hosts.

The contract is provider-neutral. OpenAI tool schemas, Gemini function declarations, MCP tools, REST endpoints, internal Wizards, or other consumers should adapt this public contract instead of importing domain implementations directly.

## Contract version

`prompt-draft.actions.v1`

The public contract is exposed from `app/actions/public.ts` and re-exported by `app/actions/index.ts`.

Public action IDs and the meaning of the invocation/result envelope are compatibility surfaces.

## Public registry

`createPublicActionRegistry()` assembles every public Action into one canonical registry.

Current public surface: **99 Actions**.

Internal helpers are deliberately excluded, including semantic assignment scope primitives and domain services that are not registered public Actions.

Consumers should not manually assemble domain registries.

## Discovery manifest

`exportPublicActionManifest()` returns JSON-safe discovery data:

```json
{
  "contract": "prompt-draft.actions.v1",
  "actions": [
    {
      "id": "module.activate",
      "description": "...",
      "effect": "mutation",
      "inputSchema": {
        "type": "object",
        "required": ["moduleKey"],
        "additionalProperties": false,
        "properties": {
          "moduleKey": {
            "type": "string",
            "minLength": 1
          }
        }
      }
    }
  ]
}
```

### Effect metadata

Each descriptor exposes:

- `read` — currently `prompt.validate` and `prompt.compile`;
- `mutation` — all state-changing Actions.

This metadata is public and should be used by hosts instead of inferring behavior from naming conventions.

## Schema mapping

Internal Action schemas remain owned by the repository validator.

The public manifest maps them into a JSON-Schema-compatible subset without changing internal validation behavior:

- internal `min` → public `minimum`;
- internal `max` → public `maximum`;
- internal `type: "unknown"` → unconstrained JSON Schema `{}`;
- nested arrays/objects are recursively mapped;
- `enum`, `minLength`, `minItems`, `maxItems`, `required`, and `additionalProperties` are preserved.

Actions without an internal input schema export an empty closed object schema.

Provider-specific schema adapters may transform this public JSON schema further if a provider requires a narrower dialect.

## Invocation envelope

Model/agent-owned input is deliberately small:

```json
{
  "actionId": "module.activate",
  "input": {
    "moduleKey": "style"
  }
}
```

The model does **not** own or provide:

- `draft`;
- module registry;
- `ActionEnvironment`;
- `ActionIdFactory`;
- Vue/application runtime state.

Those values are supplied separately by the trusted host as `ActionContext`.

`invokePublicAction(request, context)` rejects extra request-envelope fields so host-owned state cannot be smuggled through model input.

Missing `input` is normalized to `{}`.

## Result contract

The bridge returns the existing structured `ActionExecutionResult` contract.

Success:

```json
{
  "ok": true,
  "draft": {},
  "data": {},
  "warnings": []
}
```

Failure:

```json
{
  "ok": false,
  "draft": {},
  "issues": [
    {
      "code": "module_not_found"
    }
  ]
}
```

Runtime/action failures retain existing atomic semantics: the original caller Draft is returned on failure.

Malformed public invocation envelopes return `public_action_request_invalid`.

Unknown Action IDs retain the registry-level `action_not_found` failure.

## Provider adapters

Provider adapters must stay outside domain/action implementations.

Expected shape:

```text
Prompt Draft Public Actions Contract
              |
      +-------+-------+
      |               |
 OpenAI adapter   Gemini adapter
      |               |
 tool schema      function schema
```

An adapter may rename transport fields or reshape the public JSON schema to satisfy provider syntax, but it must not change Action IDs, domain semantics, stable-reference rules, mutation behavior, or result meaning.

## Compatibility rules

For `prompt-draft.actions.v1`:

1. public Action IDs are frozen compatibility identifiers;
2. `prompt-draft.actions.v1` remains stable for compatible manifest/envelope changes;
3. removing, renaming, or semantically repurposing a public Action requires an explicit compatibility/version decision;
4. adding a public Action requires deliberate fixture/docs review rather than silently changing discovery;
5. registry ordering is not part of the compatibility contract; Action identity is;
6. provider-specific behavior must not leak into domains;
7. host-owned context remains separate from model-owned invocation data;
8. internal helpers remain non-public unless deliberately promoted through the registry.

`scripts/actions-public-ids.test.ts` pins the exact v1 set of all **99 public Action IDs**. This is a compatibility fixture, not generated discovery data.

## Accepted validation

Public contract checkpoint on 2026-08-27:

- `pnpm test:actions-api` => **167/167**;
- production build => successful;
- registry => 99 unique public Actions;
- manifest => deterministic and JSON-safe;
- invocation bridge => write/read/failure/host-boundary behavior validated.

The final readiness audit adds the exact public-ID compatibility fixture as one additional Actions test. Final expected Actions API total: **168**.

## Test coverage

`scripts/actions-public-contract.test.ts` covers:

- complete 99-Action public assembly;
- duplicate/internal Action exclusion;
- JSON-safe deterministic manifest export;
- read/mutation effect metadata;
- recursive schema conversion;
- write invocation + caller isolation;
- read invocation through the same bridge;
- rejection of host-owned envelope fields;
- structured unknown-Action failure.

`scripts/actions-public-ids.test.ts` covers:

- exact v1 Action-ID compatibility set;
- contract name lock to `prompt-draft.actions.v1`.

Both suites are included in `pnpm test:actions-api`.
