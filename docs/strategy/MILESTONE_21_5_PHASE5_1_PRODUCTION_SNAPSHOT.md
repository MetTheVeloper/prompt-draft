# Milestone 21.5 — Phase 5.1 External Production Snapshot

Status: **PARTIAL SNAPSHOT CAPTURED / DNS AUTHORITY + DASHBOARD DETAILS PENDING**

Date: 2026-09-12

Branch:

```text
feature/growth-foundation
```

Canonical parent:

```text
docs/strategy/MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md
```

Related cutover runbook:

```text
docs/strategy/MILESTONE_21_5_PHASE5_1C_PRODUCTION_CUTOVER_RUNBOOK.md
```

This file records read-only evidence about the currently stable production path. It is not authorization to change production DNS, ArvanCloud, Cloudflare, Tunnel routing, Worker routing or production indexability.

---

## 1. Founder-observed public production snapshot

Read-only PowerShell/DNS/HTTP checks were run by the founder on 2026-09-12.

### `https://prompt-draft.ir/`

Observed:

```text
HTTP/1.1 200 OK
Server: ArvanCloud
Content-Type: text/html
X-Cache: BYPASS
x-amz-version-id present
x-rgw-object-type: Normal
```

Interpretation:

```text
current stable production frontend is served through ArvanCloud
response metadata is consistent with the existing object-storage/static production path
this is the current rollback user path until the production cutover is explicitly approved
```

Exact DNS record type/value and exact ArvanCloud dashboard origin configuration are not yet recorded and must not be guessed from HTTP headers alone.

### `https://api.prompt-draft.ir/api/db-check`

Observed:

```text
DNS resolution failed
curl: Could not resolve host: api.prompt-draft.ir
```

Interpretation:

```text
there is currently no publicly resolving production API hostname at api.prompt-draft.ir
production API ingress will therefore be a new launch record/path rather than a replacement for a currently working public API hostname
rollback for this hostname is expected to mean removing/restoring the pre-cutover non-existent state unless later dashboard evidence proves otherwise
```

### `https://www.prompt-draft.ir/`

Observed:

```text
HTTP/1.1 301 Moved Permanently
Location: https://prompt-draft.ir/
Server: ArvanCloud
```

Accepted current behavior:

```text
www.prompt-draft.ir -> 301 redirect to https://prompt-draft.ir/
```

This resolves the launch canonical-host policy direction: preserve apex as canonical and preserve/replicate the `www -> apex` redirect during cutover rather than serving an independent application origin on `www`.

---

## 2. Production rollback implications now known

Current stable rollback direction:

```text
frontend user path -> restore existing ArvanCloud-served prompt-draft.ir path
www policy         -> restore/preserve 301 redirect to https://prompt-draft.ir/
production API     -> restore pre-cutover unresolved/non-existent api.prompt-draft.ir state unless contrary dashboard evidence is captured
```

Do not replace the current production frontend DNS/origin until its exact DNS record(s), proxy/CDN state and ArvanCloud origin/storage configuration have been captured from the authoritative dashboard.

---

## 3. Search Console snapshot

The connected Search Console integration inspected on 2026-09-12 exposes:

```text
sc-domain:verta.ir
```

No connected `prompt-draft.ir` property was evidenced.

Launch-readiness plan:

```text
intended scope -> Domain property for prompt-draft.ir
preferred verification -> DNS TXT ownership verification
sitemap submission -> only after production cutover/indexability verification
```

The DNS TXT verification record is a production DNS change and must not be added without explicit founder approval.

---

## 4. Critical DNS-authority question still open

The HTTP response proves the current application is served by ArvanCloud, but it does not by itself prove which provider is authoritative for the `prompt-draft.ir` DNS zone.

Before finalizing the Tunnel cutover mechanics, capture:

```text
prompt-draft.ir authoritative NS records
exact apex DNS record type/value/TTL
exact www DNS/redirect configuration
confirmation that api.prompt-draft.ir is absent in the authoritative DNS dashboard
```

Why this matters:

```text
if prompt-draft.ir is already Cloudflare-authoritative
-> production Tunnel hostname creation is mechanically straightforward

if prompt-draft.ir is authoritative elsewhere (for example ArvanCloud DNS)
-> apex/Tunnel cutover needs an explicit DNS-zone strategy before launch
-> do not discover or improvise that strategy during the maintenance window
```

---

## 5. Cloudflare target-path snapshot still required

The accepted staging target architecture remains:

```text
grassic.ir     -> Cloudflare Worker/Tunnel -> frontend:3000
api.grassic.ir -> Cloudflare Tunnel        -> api:4000
```

Before founder readiness signoff, record read-only dashboard evidence for:

```text
CLOUDFLARE_TUNNEL_NAME
CLOUDFLARE_TUNNEL_ID
CURRENT_TUNNEL_PUBLIC_HOSTNAMES
CURRENT_WORKER_ROUTES
CURRENT_CACHE_RULES
CURRENT_API_BYPASS_RULE
```

Also confirm that production `api.prompt-draft.ir` receives an explicit API cache-bypass rule at cutover; the accepted staging bypass only covers `api.grassic.ir`.

---

## 6. Current Phase 5.1 state

Known:

```text
Phase 5.2 measurement -> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
production apex       -> HTTP 200 through ArvanCloud
production www        -> HTTP 301 to apex through ArvanCloud
production API        -> currently unresolved
Search Console        -> prompt-draft.ir property not evidenced in connected account
www policy            -> preserve redirect to apex
```

Still required before 5.1D readiness signoff:

```text
authoritative production NS evidence
exact current production DNS/origin rollback values
ArvanCloud production origin/dashboard snapshot
Cloudflare Tunnel name/id/public-hostname snapshot
Cloudflare Worker/cache-rule snapshot
explicit production API bypass plan
Search Console Domain-property ownership plan accepted by founder
exact cutover SHA selected
explicit founder readiness acceptance
```

Until those gates are closed:

```text
prompt-draft.ir production path -> untouched
api.prompt-draft.ir             -> untouched/unresolved
production DNS                  -> untouched
production indexability         -> untouched
staging NUXT_PUBLIC_NOINDEX     -> true
```
