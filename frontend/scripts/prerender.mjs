#!/usr/bin/env node
/**
 * Prerender the public pages into static HTML, after `vite build`.
 *
 * Why this exists: the client is a single-page app, so the HTML Cloudflare Pages
 * serves is just `<div id="root"></div>`. Google can execute JavaScript (slowly,
 * and not always), but GPTBot, Perplexity, and most other answer engines fetch
 * the raw HTML and never run JS — to them the site is blank, which is why an
 * assistant could not describe or recommend ChurchPress.
 *
 * What it does, for each public route:
 *   1. renders the real component tree to HTML with react-dom/server
 *   2. injects that HTML into the built `dist/index.html` shell, so the hashed
 *      asset URLs and CSS links stay exactly as Vite emitted them
 *   3. rewrites the per-page head — title, description, canonical, Open Graph,
 *      Twitter card — and gives each page its own JSON-LD graph instead of
 *      shipping the homepage's FAQ/HowTo markup on the terms page
 *   4. writes `dist/<route>.html`, which Cloudflare Pages serves at `/<route>`
 *
 * The client is untouched: main.tsx still calls createRoot().render(), which
 * discards this markup on load and renders normally. This is a snapshot for
 * machines, not a react hydration contract.
 *
 * Deliberately forgiving: if the SSR bundle or a single page fails to render,
 * it warns and leaves that page as the plain SPA. A prerender problem must
 * never break a deploy.
 */
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const SSR_ENTRY = path.join(ROOT, 'dist-ssr', 'entry-server.js')
const SITE = 'https://churchbulletin.in'

/**
 * The public, indexable routes. Anything behind auth is intentionally absent —
 * robots.txt disallows those and they have nothing to rank.
 *
 * `keepHead` means "the shell's head is already correct for this route".
 */
const PAGES = [
  {
    url: '/',
    out: 'index.html',
    keepHead: true,
  },
  {
    url: '/pricing',
    out: 'pricing.html',
    breadcrumb: 'Pricing',
    title: 'Pricing — $15/month for unlimited church bulletins | ChurchPress',
    description:
      'Three complete church bulletins free, no card required. Then $15 per month or $130 per year for unlimited bulletins, announcement slides, social posts and email newsletters. Cancel anytime.',
  },
  {
    url: '/terms',
    out: 'terms.html',
    breadcrumb: 'Terms of Service',
    title: 'Terms of Service | ChurchPress',
    description:
      'The terms governing your use of ChurchPress, including the free trial, subscriptions billed by Paddle, acceptable use, and the ownership of everything you create.',
  },
  {
    url: '/privacy',
    out: 'privacy.html',
    breadcrumb: 'Privacy Policy',
    title: 'Privacy Policy | ChurchPress',
    description:
      "What ChurchPress collects, why, how long it is kept, and the choices you have. Your church's details are never sold, shared, or used to train third-party models.",
  },
  {
    url: '/refund-policy',
    out: 'refund-policy.html',
    breadcrumb: 'Refund Policy',
    title: 'Refund & Cancellation Policy | ChurchPress',
    description:
      'How to cancel a ChurchPress subscription and how to get a refund within 14 days. Billing is handled by Paddle, the merchant of record, and refunds go back to your original payment method.',
  },
]

/** Escape a value for use inside an HTML attribute. */
function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Replace the first match, using a function so `$&`-style sequences inside the
 * replacement text are never interpreted. Warns (rather than silently passing)
 * when a pattern no longer matches the built shell, because a missed match
 * means a page would ship with the wrong title.
 */
function replaceOnce(html, pattern, replacement, label, missed) {
  if (!pattern.test(html)) {
    missed.push(label)
    return html
  }
  return html.replace(pattern, () => replacement)
}

/** A per-page JSON-LD graph, referencing the Organisation/WebSite on the home page. */
function jsonLdFor(page) {
  const url = `${SITE}${page.url}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: page.title,
        description: page.description,
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': `${SITE}/#software` },
        publisher: { '@id': `${SITE}/#organization` },
        inLanguage: 'en',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ChurchPress', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: page.breadcrumb, item: url },
        ],
      },
    ],
  }
}

function applyHead(shell, page, missed) {
  if (page.keepHead) return shell

  const url = `${SITE}${page.url}`
  const title = esc(page.title)
  const description = esc(page.description)
  let html = shell

  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, 'title', missed)
  html = replaceOnce(
    html,
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${description}" />`,
    'meta description',
    missed,
  )
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${url}" />`,
    'canonical',
    missed,
  )
  html = replaceOnce(
    html,
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${url}" />`,
    'og:url',
    missed,
  )
  html = replaceOnce(
    html,
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:title" content="${title}" />`,
    'og:title',
    missed,
  )
  html = replaceOnce(
    html,
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:description" content="${description}" />`,
    'og:description',
    missed,
  )
  html = replaceOnce(
    html,
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="twitter:title" content="${title}" />`,
    'twitter:title',
    missed,
  )
  html = replaceOnce(
    html,
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="twitter:description" content="${description}" />`,
    'twitter:description',
    missed,
  )
  // Swap the homepage's HowTo/FAQPage markup for this page's own graph.
  html = replaceOnce(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n${JSON.stringify(jsonLdFor(page), null, 2)}\n    </script>`,
    'json-ld',
    missed,
  )

  return html
}

async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.warn('[prerender] no dist/index.html — did the client build run? Skipping.')
    return
  }
  if (!existsSync(SSR_ENTRY)) {
    console.warn(`[prerender] no SSR bundle at ${path.relative(ROOT, SSR_ENTRY)}. Skipping.`)
    return
  }

  // supabase-js picks a storage adapter based on what is available; give it one
  // rather than depending on which Node version decides it is a browser.
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map()
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
      key: (i) => [...store.keys()][i] ?? null,
      get length() {
        return store.size
      },
    }
  }

  let render
  try {
    ;({ render } = await import(pathToFileURL(SSR_ENTRY).href))
  } catch (error) {
    console.warn('[prerender] SSR bundle failed to load, leaving the site client-rendered.')
    console.warn(`[prerender] ${error?.stack ?? error}`)
    return
  }

  const shell = await readFile(path.join(DIST, 'index.html'), 'utf8')
  const missed = []
  let written = 0

  for (const page of PAGES) {
    let body
    try {
      body = render(page.url)
    } catch (error) {
      console.warn(`[prerender] ${page.url} failed to render — left as client-rendered.`)
      console.warn(`[prerender] ${error?.message ?? error}`)
      continue
    }

    if (!body || body.length < 500) {
      console.warn(`[prerender] ${page.url} rendered suspiciously little (${body?.length ?? 0} chars). Skipping.`)
      continue
    }

    let html = applyHead(shell, page, missed)
    if (!html.includes('<div id="root"></div>')) {
      console.warn(`[prerender] ${page.url}: could not find the root element in the shell. Skipping.`)
      continue
    }
    html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)

    await writeFile(path.join(DIST, page.out), html, 'utf8')
    written += 1
    const kb = Math.round(Buffer.byteLength(html) / 1024)
    console.log(`[prerender] ${page.url} → dist/${page.out} (${kb} KB)`)
  }

  if (missed.length) {
    console.warn(`[prerender] WARNING: these head patterns no longer matched: ${[...new Set(missed)].join(', ')}`)
    console.warn('[prerender] Check frontend/index.html — a page may ship with the wrong title.')
  }
  console.log(`[prerender] done — ${written}/${PAGES.length} pages baked into static HTML.`)
}

await main()
