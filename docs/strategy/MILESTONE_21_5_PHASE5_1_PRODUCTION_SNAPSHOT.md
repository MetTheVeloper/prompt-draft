# Milestone 21.5 — Phase 5.1 External Production Snapshot

Status: **PARTIAL SNAPSHOT CAPTURED / DNS AUTHORITY + TUNNEL EVIDENCE CAPTURED / WORKER + CACHE + EXACT MX EXPORT PENDING**

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
rollback for this hostname means restoring the pre-cutover unresolved/non-existent state unless later evidence proves otherwise
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

Preserve apex as canonical and preserve/replicate the `www -> apex` redirect during cutover rather than serving an independent application origin on `www`.

---

## 2. Authoritative production DNS + Arvan origin evidence

Founder-provided ArvanCloud dashboard evidence and public DNS resolution now close the DNS-authority question.

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

Arvan DNS dashboard records observed:

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
            NOTE: exact MX target must be confirmed from Arvan DNS export before nameserver migration; do not retype it from screenshot alone

@   NS    -> y.ns.arvancdn.ir.
            TTL: 2 hours

@   NS    -> a.ns.arvancdn.ir.
            TTL: 2 hours
```

Current production origin/rollback target is now materially known:

```text
origin object website -> prompt-draft.s3-website.ir-thr-at1.arvanstorage.ir.
Arvan CDN/proxy        -> enabled for apex + www
current apex behavior  -> stable static/object-storage production
current www behavior   -> public 301 to apex through ArvanCloud
```

Before nameserver migration, use Arvan's DNS export/download function and preserve the complete zone file outside the repository. This is especially important for the observed MX record and any records not visible in the dashboard screenshot.

---

## 3. Production rollback implications now known

Current stable rollback direction:

```text
frontend user path -> restore Arvan authoritative nameservers if they were changed
frontend apex DNS  -> restore @ ANAME to prompt-draft.s3-website.ir-thr-at1.arvanstorage.ir. with Arvan proxy enabled
www DNS/origin     -> restore www CNAME to the same Arvan Storage website target and preserve public 301 behavior
production API     -> remove/restore api.prompt-draft.ir to the pre-cutover unresolved/non-existent state
```

Nameserver rollback is slower and broader than a single-record rollback. Therefore the complete Cloudflare zone must be staged and verified before the registrar/IRNIC nameserver switch is executed.

Do not delete the Arvan zone or object-storage website during the initial production cutover. It remains the rollback origin until post-launch stability is accepted.

---

## 4. Cloudflare target-path snapshot captured

Founder-provided Cloudflare dashboard evidence on 2026-09-12 shows:

```text
Cloudflare plan for grassic.ir -> Free
DNS setup                     -> Full
only active domain shown      -> grassic.ir
prompt-draft.ir Cloudflare zone -> not yet present
```

Cloudflare-assigned nameservers for the existing `grassic.ir` zone:

```text
justin.ns.cloudflare.com
sharon.ns.cloudflare.com
```

These are evidence for the staging zone only. Do NOT assume `prompt-draft.ir` will receive the same nameserver pair when it is added to Cloudflare.

### Accepted Tunnel evidence

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

Observed Cloudflare DNS records for staging:

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

This confirms the accepted remote-managed Tunnel remains healthy and can be reused for production published applications if the production zone is onboarded to the same Cloudflare account.

---

## 5. Production DNS-zone strategy now resolved at design level

Cloudflare Tunnel DNS uses a `<UUID>.cfargotunnel.com` target and only proxies a Tunnel hostname through DNS records in the same Cloudflare account.

Current Cloudflare documentation also confirms:

```text
Free / Pro -> primary/full DNS setup only
Business / Enterprise -> CNAME/partial setup available
```

The observed account/zone is Free. Therefore the launch design for the current plan is:

```text
1. export/backup the complete authoritative Arvan DNS zone
2. add prompt-draft.ir to the same Cloudflare account
3. keep the new Cloudflare zone pending; do NOT switch nameservers yet
4. reproduce every required non-production-Tunnel DNS record exactly, including mail/verification records
5. stage the intended production Tunnel DNS/published-application records in Cloudflare
6. stage www -> apex redirect behavior in Cloudflare
7. stage production API cache bypass and required Worker/rule policy
8. record the Cloudflare-assigned nameservers for prompt-draft.ir
9. verify the prepared zone against the Arvan export
10. only after explicit founder approval, change authoritative nameservers at the registrar/IRNIC layer
```

Do not attempt a Free-plan partial-CNAME design that leaves Arvan authoritative while expecting the Tunnel hostname to behave as a normal proxied Cloudflare application.

An upgrade to Business/Enterprise would reopen a partial-zone option, but that is not required by the accepted architecture and should not be introduced unless deliberately chosen.

---

## 6. Search Console snapshot

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

The DNS TXT verification record is a production DNS change. It may be staged in the pending Cloudflare zone before nameserver cutover, but it does not become authoritative until the production zone is switched and must not be treated as verified before then.

---

## 7. Evidence still required before 5.1D readiness signoff

Captured:

```text
production authoritative DNS provider -> ArvanCloud
production authoritative NS values    -> captured
apex production origin                -> captured
www production origin                 -> captured
production API absent                 -> captured
Cloudflare plan/setup                 -> Free / Full
Tunnel name/id/status                 -> captured
Tunnel staging published applications -> captured
Tunnel DNS targets                    -> captured
```

Still required:

```text
complete Arvan DNS export / exact MX target and any hidden records
current Arvan redirect/origin rule evidence explaining www -> apex
Cloudflare Worker routes snapshot
Cloudflare cache rules snapshot
current staging API bypass rule snapshot
production API bypass rule design staged/recorded
Cloudflare-assigned nameservers for prompt-draft.ir after the zone is added (adding a pending zone is not authorization to change authoritative NS)
Search Console Domain-property ownership plan accepted by founder
exact cutover SHA selected
explicit founder readiness acceptance
```

Until those gates are closed:

```text
prompt-draft.ir production path -> untouched
api.prompt-draft.ir             -> untouched/unresolved
production authoritative NS     -> ArvanCloud
production DNS                  -> untouched
production indexability         -> untouched
staging NUXT_PUBLIC_NOINDEX     -> true
```
