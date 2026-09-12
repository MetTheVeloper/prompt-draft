# Milestone 21.5 — Phase 5.1 External Production Snapshot

Status: **EXTERNAL INFRASTRUCTURE SNAPSHOT COMPLETE / SEARCH CONSOLE + PENDING CLOUDFLARE ZONE + FOUNDER SIGNOFF PENDING**

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

This file records founder-observed, read-only evidence about the currently stable production path and the accepted Cloudflare staging path. It is not authorization to change production DNS, ArvanCloud, Cloudflare zone authority, Tunnel routing, Worker routing, cache rules or production indexability.

---

## 1. Founder-observed public production snapshot

Read-only DNS/HTTP checks were run by the founder on 2026-09-12.

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
this remains the rollback user path until production cutover is explicitly approved
```

### `https://api.prompt-draft.ir/api/db-check`

Observed:

```text
DNS resolution failed
curl: Could not resolve host: api.prompt-draft.ir
```

Interpretation:

```text
there is currently no publicly resolving production API hostname at api.prompt-draft.ir
production API ingress will be a new launch hostname
rollback for this hostname restores the pre-cutover unresolved/non-existent state
```

### `https://www.prompt-draft.ir/`

Observed:

```text
HTTP/1.1 301 Moved Permanently
Location: https://prompt-draft.ir/
Server: ArvanCloud
```

Accepted launch behavior:

```text
www.prompt-draft.ir -> 301 redirect to https://prompt-draft.ir/
```

Preserve apex as canonical. Do not serve an independent application origin on `www` during the initial launch.

---

## 2. Complete current Arvan DNS inventory

Public resolution plus the founder-provided Arvan DNS dashboard close the authoritative-DNS inventory.

Authoritative nameservers:

```text
a.ns.arvancdn.ir
y.ns.arvancdn.ir
```

Therefore:

```text
prompt-draft.ir is currently authoritative on ArvanCloud DNS
Cloudflare is NOT currently authoritative for the production zone
```

Public apex resolution observed:

```text
prompt-draft.ir A -> 185.143.233.238
prompt-draft.ir A -> 185.143.234.238
```

The Arvan dashboard showed exactly five DNS records in the zone, all on one page:

```text
@   ANAME -> prompt-draft.s3-website.ir-thr-at1.arvanstorage.ir.
            Arvan cloud/CDN proxy: ON
            TTL: automatic

www CNAME -> prompt-draft.s3-website.ir-thr-at1.arvanstorage.ir.
            Arvan cloud/CDN proxy: ON
            TTL: automatic

@   MX    -> contact.
            priority: 10
            TTL: 2 minutes

@   NS    -> y.ns.arvancdn.ir.
            TTL: 2 hours

@   NS    -> a.ns.arvancdn.ir.
            TTL: 2 hours
```

Founder read-only DNS verification independently returned:

```text
MX Exchange   -> contact
MX Preference -> 10
MX TTL        -> 120
TXT           -> no TXT answer; authority SOA only
```

The local Windows `Resolve-DnsName` build does not support `-Type CAA`; however the authoritative Arvan dashboard shows the complete five-record zone and contains no CAA record and no TXT record. No paid Arvan DNS export is required for the currently observed inventory.

Important mail-safety note:

```text
the current MX target is literally observed as `contact` / `contact.`
do not silently normalize, repair or reinterpret this record during migration
preserve the current value unless the founder explicitly decides to change mail behavior
```

Current production origin/rollback target:

```text
origin object website -> prompt-draft.s3-website.ir-thr-at1.arvanstorage.ir.
Arvan CDN/proxy        -> enabled for apex + www
current apex behavior  -> stable static/object-storage production
current www behavior   -> public 301 to apex through ArvanCloud
```

Do not delete the Arvan zone or object-storage website during initial launch. It remains the rollback origin until post-launch stability is accepted.

---

## 3. Current Cloudflare account + Tunnel snapshot

Founder-provided Cloudflare dashboard evidence on 2026-09-12 shows:

```text
Cloudflare plan for grassic.ir    -> Free
DNS setup                         -> Full
active domain currently shown     -> grassic.ir
prompt-draft.ir Cloudflare zone   -> not yet present
```

Cloudflare-assigned nameservers shown for the existing staging zone:

```text
justin.ns.cloudflare.com
sharon.ns.cloudflare.com
```

These values belong to `grassic.ir` only. Do not assume `prompt-draft.ir` will receive the same pair when added.

Accepted remote-managed Tunnel:

```text
CLOUDFLARE_TUNNEL_NAME=prompt-draft-production
CLOUDFLARE_TUNNEL_ID=98f97826-f2dd-422a-ba4f-3f5e716b32cb
Tunnel status=Healthy
Active replicas=1
cloudflared version=2026.8.3
Current route count=2
```

Observed current published applications:

```text
grassic.ir
api.grassic.ir
```

Observed staging Tunnel DNS targets:

```text
grassic.ir
  CNAME -> 98f97826-f2dd-422a-ba4f-3f5e716b32cb.cfargotunnel.com
  proxied
  TTL auto

api.grassic.ir
  CNAME -> 98f97826-f2dd-422a-ba4f-3f5e716b32cb.cfargotunnel.com
  proxied
  TTL auto
```

This confirms the accepted Tunnel is healthy and can be reused for production published applications after the production zone is deliberately onboarded to the same Cloudflare account.

---

## 4. Current staging Worker snapshot

Founder-provided Cloudflare Workers evidence shows one staging fallback Worker:

```text
Worker name  -> prompt-draft-staging-fallback
Worker route -> grassic.ir/*
Custom domains -> none
Bindings        -> none
Workers bound   -> none
```

Observed worker route inventory:

```text
grassic.ir/*
```

No evidence shows this Worker attached to `api.grassic.ir` or to any production hostname.

Accepted launch rule remains:

```text
DO NOT attach prompt-draft-staging-fallback unchanged to prompt-draft.ir/*
initial production frontend path -> Tunnel directly
```

---

## 5. Current staging cache-rule snapshot

Founder-provided Cloudflare Cache Rules evidence shows exactly one active Cache Rule for the staging zone:

```text
Rule name -> Bypass Prompt Draft API
Order     -> 1
Status    -> Active
Match     -> Hostname equals api.grassic.ir
Expression -> (http.host eq "api.grassic.ir")
Action    -> Bypass cache
```

No Cache Response Rules were present in the captured view.

Production consequence:

```text
api.prompt-draft.ir must receive an equivalent explicit bypass-cache rule before/at production activation
```

Do not edit the staging rule in place to point at production before the staging topology is intentionally retired. The production zone should receive its own rule so rollback/staging evidence remains clear.

---

## 6. DNS-zone migration strategy resolved at design level

The current Cloudflare account is Free and uses Full DNS setup. The production domain is authoritative on ArvanCloud.

Therefore the accepted initial-launch design is a full authoritative-zone migration rather than a partial-CNAME design:

```text
1. preserve this exact Arvan inventory and screenshots outside the repository
2. add prompt-draft.ir to the same Cloudflare account as a pending Full zone
3. do NOT change registrar/IRNIC nameservers yet
4. record the Cloudflare-assigned nameservers for prompt-draft.ir
5. reproduce the required non-Tunnel DNS behavior in the pending zone
6. preserve the current MX value exactly unless founder explicitly changes it
7. stage production www -> apex redirect behavior
8. stage an API cache-bypass rule for api.prompt-draft.ir
9. stage intended Tunnel published applications for prompt-draft.ir and api.prompt-draft.ir
10. verify all prepared values while Arvan remains authoritative
11. select and record the exact cutover Git SHA
12. only after 5.1D readiness acceptance and explicit founder cutover approval, change authoritative nameservers
```

Adding/preparing a pending Cloudflare zone does not itself authorize the authoritative nameserver switch.

---

## 7. Rollback contract now materially known

Stable rollback direction:

```text
production apex   -> Arvan authoritative DNS + Arvan Storage website path
production www    -> Arvan DNS/origin with public 301 to apex
production API    -> remove/restore api.prompt-draft.ir to unresolved state
local app runtime -> restore staging env with NUXT_PUBLIC_NOINDEX=true
staging ingress   -> restore grassic.ir + api.grassic.ir accepted Tunnel topology
```

If authoritative nameservers have already been changed, rollback requires restoring the Arvan nameserver pair at the registrar/IRNIC layer:

```text
a.ns.arvancdn.ir
y.ns.arvancdn.ir
```

Nameserver rollback is broader and potentially slower than a single-record rollback. Therefore the Cloudflare production zone must be fully staged and checked before the nameserver switch.

---

## 8. Search Console snapshot

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

There is currently no TXT record in the production zone. Creating a Search Console ownership TXT is therefore an additive production-DNS change if done on Arvan before cutover, or a staged pending-zone record if prepared in Cloudflare before the nameserver switch. Either path requires deliberate founder approval before it affects authoritative production DNS.

---

## 9. External infrastructure evidence status

Captured:

```text
production authoritative DNS provider + exact NS values -> COMPLETE
complete visible Arvan DNS record inventory             -> COMPLETE
apex production origin                                  -> COMPLETE
www DNS/origin + public redirect behavior               -> COMPLETE
production API absent                                   -> COMPLETE
current MX value/priority/TTL                           -> COMPLETE
TXT absence                                             -> COMPLETE
Cloudflare plan/setup                                   -> COMPLETE
Tunnel name/id/status/version                           -> COMPLETE
Tunnel staging published applications + DNS targets    -> COMPLETE
staging Worker route                                    -> COMPLETE
staging API cache-bypass rule                           -> COMPLETE
```

No longer required:

```text
paid Arvan DNS export -> NOT REQUIRED for the observed five-record zone
additional CAA shell query -> NOT REQUIRED; complete Arvan dashboard inventory contains no CAA record
```

Still required before 5.1D readiness signoff:

```text
add prompt-draft.ir as a pending Cloudflare Full zone and record its assigned nameservers
stage/record the production API bypass rule design in that pending zone
stage/record the www -> apex redirect policy in that pending zone
resolve/accept exact treatment of the existing MX target `contact`
Search Console Domain-property ownership plan accepted by founder
exact cutover SHA selected
explicit founder readiness acceptance
```

Until explicit authorization changes that state:

```text
prompt-draft.ir production path -> untouched
api.prompt-draft.ir             -> untouched/unresolved
production authoritative NS     -> ArvanCloud
production DNS                  -> untouched
production indexability         -> untouched
staging NUXT_PUBLIC_NOINDEX     -> true
```
