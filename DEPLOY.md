# Deploy & Paddle Go-Live Runbook

Order matters: **deploy → sandbox test → live application → live flip.**
Paddle's live application includes a domain review — it only passes once the site is live.

## 0. Prerequisites (do these first if not done)

- [ ] **Migration `003_entitlement_hardening.sql` run** in Supabase SQL Editor (paywall-bypass fix).
- [ ] **Paddle sandbox → Account settings → Business profile**: name `Deepak`, website `https://churchbulletin.in`, contact `hello@churchbulletin.in`.
- [ ] Supabase Auth → URL Configuration → Site URL `https://churchbulletin.in`, add `https://churchbulletin.in/**` to Redirect URLs.

## 1. Push to GitHub

```bash
git remote add origin https://github.com/<you>/churchpress.git
git push -u origin master
```

`.env` files are gitignored — verify with `git ls-files | grep -i "\.env$"` (must print nothing).

## 2. Render — backend (free tier)

1. render.com → sign in with GitHub → **New + → Blueprint** → pick the repo (it reads `render.yaml`).
2. Fill the `sync: false` secrets (copy values from `backend/.env`):
   `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PADDLE_API_KEY`,
   `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRICE_MONTHLY`, `PADDLE_PRICE_ANNUAL`,
   `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`.
3. Deploy → note the URL (e.g. `https://churchpress-api.onrender.com`).
4. Verify: open `<url>/health` → `{"status":"ok"}`.

Notes: free tier sleeps after ~15 min idle (first request is slow). If WeasyPrint
logs "unavailable", PDFs fall back to xhtml2pdf — expected on Render.

## 3. Cloudflare Pages — frontend (free tier)

1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
2. Build settings: **root directory** `frontend`, **build command** `npm run build`, **output** `dist`.
3. Environment variables (from `frontend/.env`):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL=https://churchpress-api.onrender.com` (your Render URL)
   - `VITE_PADDLE_ENVIRONMENT=sandbox` + `VITE_PADDLE_CLIENT_TOKEN=test_...` (sandbox token for now)
   - `VITE_TURNSTILE_SITE_KEY` (if configured)
4. Deploy → note the `*.pages.dev` URL.

## 4. Custom domain

1. Pages project → **Custom domains** → add `churchbulletin.in`, then `www`.
   Cloudflare creates the DNS records automatically (zone is already on Cloudflare).
2. Update Render → `ALLOWED_ORIGINS` if you want to include the pages.dev preview URL during testing.

## 5. Wire Paddle to production & test (sandbox)

1. Paddle **sandbox** → Developer tools → Notifications → edit destination:
   URL = `https://churchpress-api.onrender.com/api/billing/webhooks/paddle`
   (**keep the same signing secret** — it's already in Render's env).
2. Sign up on the live site → buy Pro with test card `4242 4242 4242 4242` (any future expiry/CVC).
3. Check: webhook returns 200, `subscriptions` row appears in Supabase, Pro unlocks in the UI.

## 6. Paddle live application

Apply at paddle.com (live account) with: PAN + Aadhaar/passport, individual/sole-trader
declaration, `churchbulletin.in` as the website. The T&Cs already name the seller and
the site is complete — that's what the domain review checks.

## 7. Live flip (after approval — one sitting)

1. In the **live** Paddle account: recreate the 3 products/prices (catalog doesn't
   carry over from sandbox), create a notification destination → copy its signing secret.
2. Render env: `PADDLE_ENVIRONMENT=production`, live API key (`pdl_live_...`),
   live webhook secret, live price IDs.
3. Cloudflare Pages env: `VITE_PADDLE_ENVIRONMENT=production`,
   `VITE_PADDLE_CLIENT_TOKEN=live_...` (Developer tools → Authentication → Client-side tokens).
4. Live webhook destination URL = same `/api/billing/webhooks/paddle` endpoint.
5. Test one real purchase end-to-end.
