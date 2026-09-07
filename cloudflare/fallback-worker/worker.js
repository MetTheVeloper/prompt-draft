const FALLBACK_STATUSES = new Set([502, 503, 504, 530]);

function wantsHtml(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function fallbackHtml() {
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noarchive" />
  <title>Prompt Draft Cloud is temporarily unavailable</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background:
        radial-gradient(circle at 15% 10%, rgba(0, 0, 0, 0.08), transparent 34%),
        radial-gradient(circle at 85% 90%, rgba(0, 0, 0, 0.06), transparent 30%),
        #f4f4f2;
      color: #111;
    }

    main {
      width: min(100%, 620px);
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 28px;
      padding: clamp(28px, 6vw, 52px);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(16px);
    }

    .brand {
      display: inline-grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: #111;
      color: #fff;
      font-size: 25px;
      font-weight: 900;
      letter-spacing: -0.06em;
      margin-bottom: 28px;
    }

    .eyebrow {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.52;
    }

    h1 {
      margin: 0;
      max-width: 520px;
      font-size: clamp(34px, 7vw, 58px);
      line-height: 0.98;
      letter-spacing: -0.055em;
    }

    .lead {
      margin: 22px 0 0;
      max-width: 520px;
      font-size: 16px;
      line-height: 1.7;
      opacity: 0.68;
    }

    .fa {
      margin-top: 12px;
      direction: rtl;
      text-align: left;
      font-size: 14px;
      line-height: 1.8;
      opacity: 0.56;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 32px;
    }

    a, button {
      min-height: 46px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 18px;
      border-radius: 999px;
      font: inherit;
      font-weight: 750;
      text-decoration: none;
      cursor: pointer;
    }

    a {
      background: #111;
      color: #fff;
      border: 1px solid #111;
    }

    button {
      background: transparent;
      color: inherit;
      border: 1px solid rgba(0, 0, 0, 0.18);
    }

    .note {
      margin: 28px 0 0;
      padding-top: 20px;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      font-size: 12px;
      line-height: 1.6;
      opacity: 0.48;
    }

    @media (prefers-color-scheme: dark) {
      body {
        background:
          radial-gradient(circle at 15% 10%, rgba(255, 255, 255, 0.08), transparent 34%),
          radial-gradient(circle at 85% 90%, rgba(255, 255, 255, 0.06), transparent 30%),
          #0d0d0f;
        color: #f6f6f6;
      }

      main {
        background: rgba(21, 21, 24, 0.9);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
      }

      .brand, a {
        background: #f5f5f5;
        color: #111;
        border-color: #f5f5f5;
      }

      button { border-color: rgba(255, 255, 255, 0.18); }
      .note { border-top-color: rgba(255, 255, 255, 0.08); }
    }
  </style>
</head>
<body>
  <main>
    <div class="brand" aria-hidden="true">G</div>
    <p class="eyebrow">Prompt Draft Cloud</p>
    <h1>Cloud is temporarily unavailable.</h1>
    <p class="lead">
      The experimental cloud version is offline or recovering from a technical issue.
      Your stable Prompt Draft experience is still available.
    </p>
    <p class="fa" lang="fa">
      نسخه آزمایشی کلاد به‌دلیل مشکل فنی موقتاً در دسترس نیست. نسخه پایدار Prompt Draft همچنان قابل استفاده است.
    </p>
    <div class="actions">
      <a href="https://prompt-draft.ir/">Open stable Prompt Draft</a>
      <button type="button" onclick="location.reload()">Try cloud again</button>
    </div>
    <p class="note">This fallback page is served directly from the Cloudflare edge and remains available even when the Prompt Draft host machine is offline.</p>
  </main>
</body>
</html>`;
}

function fallbackResponse(request) {
  const body = request.method === "HEAD" ? null : fallbackHtml();
  return new Response(body, {
    status: 503,
    statusText: "Service Unavailable",
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store, max-age=0",
      "Retry-After": "60",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Prompt-Draft-Fallback": "cloudflare-worker",
    },
  });
}

export default {
  async fetch(request) {
    try {
      // This Worker is deployed as a Worker Route in front of grassic.ir.
      // For Worker Routes, fetch(request) continues to the hostname's configured
      // origin (the Cloudflare Tunnel) rather than recursively invoking the Worker.
      const response = await fetch(request);

      if (FALLBACK_STATUSES.has(response.status) && wantsHtml(request)) {
        return fallbackResponse(request);
      }

      return response;
    } catch (error) {
      if (wantsHtml(request)) {
        return fallbackResponse(request);
      }
      throw error;
    }
  },
};
