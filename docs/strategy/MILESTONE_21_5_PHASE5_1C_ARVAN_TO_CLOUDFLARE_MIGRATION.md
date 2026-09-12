# Milestone 21.5 — Phase 5.1C Arvan → Cloudflare DNS Migration Plan

Status: **DESIGN COMPLETE / STAGING PREPARATION IN PROGRESS / EXECUTION NOT AUTHORIZED**

Date: 2026-09-12

Branch:

```text
feature/growth-foundation
```

Canonical companions:

```text
docs/strategy/MILESTONE_21_5_PHASE5_1_PRODUCTION_SNAPSHOT.md
docs/strategy/MILESTONE_21_5_PHASE5_1C_PRODUCTION_CUTOVER_RUNBOOK.md
docs/strategy/MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md
```

This document defines the exact DNS-provider transition required by the accepted Free-plan Cloudflare Tunnel architecture. It is not authorization to change the production domain, authoritative nameservers, Tunnel routes, Worker routes, cache policy or indexability.

---

## 1. Starting state

Authoritative production DNS:

```text
a.ns.arvancdn.ir
y.ns.arvancdn.ir
```

Current production records:

```text
@   ANAME -> prompt-draft.s3-website.ir-thr-at1.arvanstorage.ir.   proxy ON / TTL auto
www CNAME -> prompt-draft.s3-website.ir-thr-at1.arvanstorage.ir.   proxy ON / TTL auto
@   MX    -> contact.                                              priority 10 / TTL 120
@   NS    -> y.ns.arvancdn.ir.                                     TTL 2h
@   NS    -> a.ns.arvancdn.ir.                                     TTL 2h
```

Current public behavior:

```text
https://prompt-draft.ir/ -> ArvanCloud static/object-storage production
https://www.prompt-draft.ir/ -> 301 https://prompt-draft.ir/
api.prompt-draft.ir -> unresolved / does not exist publicly
```

Accepted staging Cloudflare topology:

```text
grassic.ir     -> Tunnel prompt-draft-production -> frontend:3000
api.grassic.ir -> Tunnel prompt-draft-production -> api:4000
```

Tunnel:

```text
name -> prompt-draft-production
id   -> 98f97826-f2dd-422a-ba4f-3f5e716b32cb
status -> Healthy
```

Staging Worker:

```text
prompt-draft-staging-fallback
route -> grassic.ir/*
```

Staging cache rule:

```text
Bypass Prompt Draft API
(http.host eq "api.grassic.ir")
-> Bypass cache
```

---

## 2. Target production topology

After an explicitly approved launch:

```text
prompt-draft.ir
  -> Cloudflare authoritative DNS
  -> Cloudflare Tunnel prompt-draft-production
  -> frontend:3000

api.prompt-draft.ir
  -> Cloudflare authoritative DNS
  -> Cloudflare Tunnel prompt-draft-production
  -> api:4000

www.prompt-draft.ir
  -> Cloudflare edge redirect
  -> 301 https://prompt-draft.ir/
```

Production API cache policy:

```text
(http.host eq "api.prompt-draft.ir")
-> Bypass cache
```

Initial production Worker policy:

```text
no production fallback Worker
DO NOT attach prompt-draft-staging-fallback to production
```

---

## 3. Stage-before-cutover sequence

These tasks prepare the target configuration while Arvan remains authoritative. None of them should change public production traffic until the registrar/IRNIC nameserver switch is explicitly approved.

### S1 — add `prompt-draft.ir` to the existing Cloudflare account as a Full zone

Founder/dashboard evidence captured on 2026-09-12:

```text
zone status before NS switch -> pending / not authoritative
Cloudflare-assigned NS #1    -> justin.ns.cloudflare.com
Cloudflare-assigned NS #2    -> sharon.ns.cloudflare.com
plan                          -> Free
DNS setup                     -> Full
```

Cloudflare Quick Scan initially discovered the two public Arvan edge A records for both apex and `www`, plus the existing MX record. The four imported A records were deliberately removed from the pending Cloudflare zone because they represented the old Arvan edge path, not the target Tunnel topology. The MX record was preserved unchanged.

The authoritative nameservers at the registrar/IRNIC have **not** been changed. Production therefore remains on Arvan.

Do not assume the nameserver pair assigned to `grassic.ir` will be reused; the production pair above is the recorded source of truth for the future cutover.

### S2 — preserve the current non-Tunnel DNS contract

The current MX record must be deliberately handled.

Default compatibility choice:

```text
MX @ -> contact
priority 10
```

Do not change it to `contact.prompt-draft.ir`, another mail host, or remove it merely because it appears unusual. If the founder confirms mail is unused and wants cleanup, treat that as a separate approved DNS change.

No TXT or CAA records are present in the captured Arvan zone.

Parent-zone DNSSEC evidence captured on 2026-09-12 returned no DS record for `prompt-draft.ir`; only the `.ir` authority SOA was returned. There is therefore no active parent DS record to remove before the future nameserver cutover.

### S3 — stage production Tunnel published applications

Prepared on 2026-09-12 while Arvan remains authoritative:

```text
prompt-draft.ir     -> http://frontend:3000
api.prompt-draft.ir -> http://api:4000
```

Founder/dashboard evidence confirms both published applications were added to the existing remote-managed Tunnel `prompt-draft-production` with default application settings. Cloudflare created proxied CNAME records in the pending production zone pointing both hostnames to:

```text
98f97826-f2dd-422a-ba4f-3f5e716b32cb.cfargotunnel.com
```

The Tunnel route list now contains all four expected staging/prepared-production mappings:

```text
grassic.ir             -> http://frontend:3000
api.grassic.ir         -> http://api:4000
prompt-draft.ir        -> http://frontend:3000
api.prompt-draft.ir    -> http://api:4000
```

Because `prompt-draft.ir` is still delegated to the Arvan nameservers, these pending Cloudflare DNS records do not yet control public production traffic.

Both production application records must remain proxied through Cloudflare.

### S4 — stage `www -> apex` redirect

Preserve the currently accepted public behavior:

```text
https://www.prompt-draft.ir/<path>
-> 301 https://prompt-draft.ir/<path>
```

The exact Cloudflare redirect mechanism may be a Redirect Rule or equivalent edge rule, but it must be explicit and independently testable. Do not route `www` to the Nuxt frontend as a second canonical application host.

### S5 — stage production API cache bypass

Create a production-zone rule equivalent to the accepted staging rule:

```text
name -> Bypass Prompt Draft API
match -> (http.host eq "api.prompt-draft.ir")
action -> Bypass cache
status -> Active at production activation
```

Do not mutate the staging `api.grassic.ir` rule into the production rule before staging retirement. Keep the two policies independently reversible.

### S6 — Search Console ownership record

Intended property:

```text
sc-domain:prompt-draft.ir
```

Preferred ownership method:

```text
DNS TXT verification
```

If the verification token is added to the pending Cloudflare zone before nameserver cutover, it will not become authoritative until the NS switch. If ownership must be verified before cutover, adding the TXT to Arvan is a production DNS change and requires explicit founder approval.

### S7 — prepared-zone audit

Before any nameserver switch, compare the pending Cloudflare zone against this contract:

```text
production apex Tunnel target present
production API Tunnel target present
production API cache bypass present
www 301 policy prepared
MX treatment explicit
Search Console TXT treatment explicit
no staging Worker attached to production
no wildcard production route introduced accidentally
Cloudflare-assigned production NS pair recorded
```

---

## 4. Runtime preparation immediately before approved cutover

The application runtime must be prepared only inside the approved maintenance window.

Because `NUXT_PUBLIC_NOINDEX` is process-wide, staging frontend ingress must be retired before the same frontend container is made indexable for production.

Required environment contract:

```text
NUXT_PUBLIC_API_BASE=https://api.prompt-draft.ir
NUXT_PUBLIC_SITE_URL=https://prompt-draft.ir
NUXT_PUBLIC_NOINDEX=false
CORS_ORIGINS=https://prompt-draft.ir
FRONTEND_BIND_ADDRESS=127.0.0.1
API_BIND_ADDRESS=127.0.0.1
NUXT_API_BASE_INTERNAL=http://api:4000
```

Environment-only changes use service recreation, not image rebuild:

```powershell
pnpm api:recreate
pnpm api:status
pnpm frontend:recreate
pnpm frontend:status
```

Do not recreate DB, translator or cloudflared unless a concrete failure requires it.

---

## 5. Authoritative cutover sequence

This section is production-changing and requires explicit founder authorization in the execution turn.

### C1 — record final checkpoint

```powershell
git fetch origin
git checkout feature/growth-foundation
git pull --ff-only
git rev-parse HEAD
git status --short
pnpm stack:cloudflare:status
```

The HEAD must equal the founder-approved cutover SHA.

### C2 — retire staging frontend ingress

Remove/disable the normal `grassic.ir -> frontend:3000` published application before setting the shared frontend runtime to `NUXT_PUBLIC_NOINDEX=false`.

The staging Worker may temporarily provide its noindex fallback response.

### C3 — apply production runtime environment and recreate API/frontend

Use the contract in Section 4 and perform loopback verification before public DNS authority changes.

### C4 — final pending-zone check

Immediately before the nameserver switch verify in Cloudflare:

```text
prompt-draft.ir Tunnel route ready
api.prompt-draft.ir Tunnel route ready
api.prompt-draft.ir cache bypass active/ready
www redirect ready
MX treatment correct
Search Console TXT treatment correct
no production staging-fallback Worker route
```

### C5 — switch authoritative nameservers at registrar/IRNIC

Replace the current Arvan nameservers:

```text
a.ns.arvancdn.ir
y.ns.arvancdn.ir
```

with:

```text
justin.ns.cloudflare.com
sharon.ns.cloudflare.com
```

Do not execute this nameserver change without explicit founder authorization in the cutover turn.
Do not delete the Arvan DNS zone or Arvan Storage origin.

### C6 — verify authority and production endpoints

Require public DNS to begin returning Cloudflare authority and production endpoints to pass:

```text
https://prompt-draft.ir/
https://api.prompt-draft.ir/api/db-check
https://www.prompt-draft.ir/
```

Expected:

```text
apex -> Nuxt/Nitro application HTTP 200
api -> HTTP 200 + production CORS
www -> 301 to apex
production frontend -> no X-Robots-Tag noindex
production API -> bypass-cache policy in effect
```

Then execute the broader SEO/security/measurement smoke from the canonical production cutover runbook.

---

## 6. Rollback sequence

Rollback is production-changing and should be executed promptly if a launch blocker is confirmed.

### R1 — restore Arvan nameserver authority

At registrar/IRNIC restore:

```text
a.ns.arvancdn.ir
y.ns.arvancdn.ir
```

Do not delete the prepared Cloudflare zone during rollback; leaving it pending makes diagnosis easier and does not make it authoritative.

### R2 — verify old production returns

Require:

```text
https://prompt-draft.ir/ -> stable ArvanCloud production path
https://www.prompt-draft.ir/ -> 301 apex
api.prompt-draft.ir -> returns to pre-launch unresolved/non-existent state after DNS convergence
```

The Arvan zone and object-storage origin must have remained intact specifically for this rollback.

### R3 — restore staging runtime environment

Restore the backed-up `.env` contract:

```text
NUXT_PUBLIC_API_BASE=https://api.grassic.ir
NUXT_PUBLIC_SITE_URL=https://grassic.ir
NUXT_PUBLIC_NOINDEX=true
CORS_ORIGINS includes https://grassic.ir
```

Then recreate only API/frontend.

### R4 — restore staging published applications

Restore:

```text
grassic.ir -> frontend:3000
api.grassic.ir -> api:4000
```

Preserve/restore:

```text
Worker route -> grassic.ir/*
cache bypass -> (http.host eq "api.grassic.ir")
```

### R5 — verify staging and old production independently

Do not consider rollback complete until both are true:

```text
old Arvan production is publicly stable again
staging is healthy and X-Robots-Tag noindex is restored
```

---

## 7. Readiness gates remaining

Infrastructure discovery is no longer a blocker. Remaining gates are explicit decisions/preparation steps:

```text
[x] add prompt-draft.ir as pending Cloudflare Full zone
[x] record production Cloudflare-assigned nameservers
[ ] accept exact MX treatment (`contact`, priority 10) or explicitly change mail policy
[ ] stage www -> apex 301 rule
[ ] stage api.prompt-draft.ir bypass-cache rule
[x] stage production Tunnel published applications
[ ] accept Search Console Domain-property/TXT plan
[ ] select exact cutover SHA
[ ] founder 5.1D readiness signoff
[ ] separate explicit founder approval to execute production cutover
```

Until those gates are deliberately advanced, production remains on Arvan and staging remains noindex.
