# Prompt Draft Cloudflare fallback Worker

This Worker sits in front of the staging frontend hostname and serves a self-contained fallback page when the Cloudflare Tunnel or its origin is unavailable.

## Intended staging route

- Worker route: `grassic.ir/*`
- Existing DNS/tunnel origin remains unchanged: `grassic.ir -> Cloudflare Tunnel -> frontend:3000`
- `api.grassic.ir` is intentionally **not** routed through this Worker.

Cloudflare Worker Routes run in front of the existing origin. Inside the Worker, `fetch(request)` continues to the hostname's configured origin, which in this environment is the Tunnel.

## Failure policy

The Worker returns the fallback page only for HTML navigation requests when the origin response status is one of:

- 502
- 503
- 504
- 530 (Cloudflare Tunnel 1033 is surfaced as HTTP 530)

Non-HTML assets and non-navigation requests keep their original error response so an outage does not accidentally return HTML as JavaScript, CSS, images, etc.

The fallback response itself uses HTTP 503 and includes:

- `Cache-Control: no-store`
- `Retry-After: 60`
- `X-Robots-Tag: noindex, nofollow, noarchive`
- `X-Prompt-Draft-Fallback: cloudflare-worker`

It links users to the stable deployment at `https://prompt-draft.ir/` and offers a retry action for the cloud staging version.

## Dashboard deployment

1. Cloudflare Dashboard -> Workers & Pages -> Create application -> Worker.
2. Name it `prompt-draft-staging-fallback`.
3. Replace the generated Worker code with `worker.js` from this directory and deploy.
4. Open the Worker -> Settings / Domains & Routes -> Add route.
5. Select zone `grassic.ir`.
6. Add route pattern `grassic.ir/*`.
7. Do **not** create a Worker Custom Domain for `grassic.ir`; this must be a Worker Route so the existing Tunnel remains the origin.

## Verification

Healthy origin:

```cmd
curl.exe -I https://grassic.ir
```

Expected: normal Nuxt response, not the fallback header.

Outage test:

```cmd
docker compose -f compose.yaml -f compose.cloudflare.yaml stop cloudflared
```

Wait briefly, then:

```cmd
curl.exe -i https://grassic.ir -H "Accept: text/html"
```

Expected:

- HTTP `503 Service Unavailable`
- `X-Prompt-Draft-Fallback: cloudflare-worker`
- fallback HTML body

Restore:

```cmd
docker compose -f compose.yaml -f compose.cloudflare.yaml start cloudflared
```

Then verify the normal application returns again.
