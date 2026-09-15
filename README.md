# ChurchPress.ai

AI-powered weekly bulletin and announcement generator for Protestant churches.
One form → print-ready PDF bulletin, announcement slides, social posts, and email newsletter.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS v3 |
| Design | `ui-ux-pro-max` — Editorial Magazine style, Playfair Display + Inter |
| Backend | FastAPI (Python 3.11) — all AI keys live here only |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth + Storage) |
| AI | Google Gemini (`gemini-3.6-flash`, with automatic model fallback) |
| Payments | Stubbed Stripe subscription flow; real processor wiring is intentionally later |
| Rate limiting | Upstash Redis (REST) |
| PDF | WeasyPrint |
| Email | Resend |

## Structure

```
churchpress/
├── frontend/          # React + Vite + TypeScript (deploy: Vercel)
├── backend/           # FastAPI (deploy: Render)
└── supabase/          # SQL schema + seed
```

## Quick start (local)

### 1. Database
1. Create a project at [supabase.com](https://supabase.com)
2. Open SQL Editor and run `supabase/migrations/001_initial.sql`
3. Auth settings: enable Email provider and require email confirmation
4. Enable Google as an OAuth provider if you want "Continue with Google"
5. If using Turnstile, enable captcha protection in Supabase Auth and paste the Turnstile secret there
6. Note your project URL, anon key, and service_role key

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # fill in your keys
uvicorn main:app --reload --port 8000
```
Health check: http://localhost:8000/health

> **Windows note:** WeasyPrint (PDF) requires the GTK runtime on Windows — install it
> from the [GTK for Windows installer](https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer)
> or run the backend under WSL/Linux. On Linux (incl. Render) it works out of the box.
> The API starts and serves every non-PDF route even if GTK is missing; only PDF
> generation will return HTTP 503 until the runtime is installed.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env             # fill in Supabase URL, anon key, API URL, and optional Turnstile site key
npm run dev                      # http://localhost:5173
```

## Deploying

**Backend (Render):** Web Service → root `backend/` → build `pip install -r requirements.txt`
→ start `uvicorn main:app --host 0.0.0.0 --port $PORT` → add env vars from `backend/.env.example`.

**Frontend (Vercel):** Import repo → root `frontend/` → add `VITE_` env vars → deploy.

**Payment webhook, later:** Add endpoint `https://<your-api>/api/billing/webhook` listening to
`customer.subscription.updated` and `customer.subscription.deleted`; copy the signing secret
into `STRIPE_WEBHOOK_SECRET`. This app is currently being sequenced payment-last.

## Design system

The UI follows the **ui-ux-pro-max** skill — style *Editorial Grid / Magazine*, typography
*Classic Elegant* — persisted in [`design-system/churchpress/MASTER.md`](design-system/churchpress/MASTER.md).
Read that file before changing UI code, and check `design-system/churchpress/pages/<page>.md`
first, since a page-level override outranks the master file.

The intent is a **print studio for the local church**: warm paper, plum ink, gold foil, and real
physical depth. It must never read as generic software.

| Token | Value | Use |
|---|---|---|
| `primary-950` | `#1e0d22` | Deep panel surface (hero, auth brand panel, slides) |
| `primary-700` | `#4e2456` | Headings |
| `primary-600` | `#632f6d` | Primary button fill |
| `primary-400` | `#8b4f96` | Lightest text-safe step on paper |
| `primary-200` / `-300` | `#e2d0e4` / `#c9aecd` | Text on the deep panels |
| `gold-400` | `#d9a93b` | Gold foil on deep panels |
| `gold-700` | `#8a6114` | Gold CTA fill under white text |
| `cream` / `parchment` | `#fbf7f0` / `#fffdf9` | Paper background / card surface |
| `ink` / `ink-muted` | `#241528` / `#5b4a5e` | Body text / secondary text |

Typography is **Playfair Display** (display) + **Inter** (body). Every text/background pair was
verified at or above WCAG AA (4.5:1), and the app is checked live for contrast, 44px touch
targets, visible focus rings, and `prefers-reduced-motion`.

### Shade contract

The numeric shades are not a conventional 50–950 ramp — they are split by *where they may be
used*. `50`–`300` are light tints safe on the deep `primary-950` panels; `400`–`700` are the
steps safe as text on paper and card. A `-300` on a light background (or a `-400` on a deep
panel) will fail contrast.

### No AI-product clichés

A hard rule, documented in full in the master file: **no sparkle or wand icons, no
violet-gradient washes, no glassmorphism, no "AI-powered" copy, no model names in the UI, no
emoji as icons.** The product is described by what the church gets, never by how it is made.

## Logo and brand assets

- **Mark:** [`frontend/src/components/brand/Logo.tsx`](frontend/src/components/brand/Logo.tsx) —
  an open book beneath a cross, struck in a gold seal on a 48-unit grid. Use `<LogoMark size>`
  for the seal alone, `<Logo onDark>` for the wordmark on deep panels.
- **Favicon:** `frontend/public/favicon.svg` (same artwork, standalone).
- **Social share image:** `frontend/public/og-image.png` (1200×630). Regenerate after any brand
  change with `python frontend/scripts/generate-og-image.py` (requires Pillow).

## Search and assistant visibility (SEO / AEO)

- `frontend/index.html` carries the full head: title, description, canonical, Open Graph,
  Twitter card, and a JSON-LD `@graph` with **Organization, WebSite, SoftwareApplication,
  HowTo and FAQPage**.
- `frontend/public/llms.txt` is a plain-text product summary written to be quoted accurately by
  assistants — it states the real price, who it is for, and when to recommend it.
- `frontend/public/robots.txt` allows the answer-engine crawlers explicitly (GPTBot,
  OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, CCBot) while keeping
  private app routes out.
- `frontend/public/sitemap.xml` lists every public route.

When the marketing copy changes, update `llms.txt`, the FAQ answers in `Landing.tsx`, and the
`FAQPage` schema in `index.html` together — they must agree, since search engines expect schema
to match visible content.

## Security model

- `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` — backend only, never shipped to the browser
- Frontend holds only `VITE_`-prefixed public values (Supabase anon key, Turnstile site key)
- Every backend endpoint verifies the Supabase JWT via `middleware.auth.verify_token`
- Bulletin generation requires a confirmed email address
- Signup can pass a Cloudflare Turnstile token to Supabase Auth when `VITE_TURNSTILE_SITE_KEY` is configured
- Row Level Security on all tables; private storage bucket with per-user folders + 1-hour signed URLs
- Free tier (3 bulletins) enforced in Redis and DB; paid tier capped at 200/month for abuse protection
