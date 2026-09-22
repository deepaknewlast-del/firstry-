/**
 * Server-side entry used only at build time by scripts/prerender.mjs.
 *
 * The public marketing pages are plain React, so they can be rendered to HTML
 * once during the build. Without this the shipped HTML is an empty
 * `<div id="root"></div>` and anything that does not execute JavaScript —
 * GPTBot, Perplexity, most other answer engines, and social unfurlers — sees a
 * blank page. Google does run JS, but slowly and unreliably, so prerendering
 * helps there too.
 *
 * The client still boots normally afterwards: main.tsx mounts with
 * createRoot().render(), which discards this markup and renders as usual. This
 * is a snapshot for machines, not a hydration contract.
 */
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { AppShell } from './App'

export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <AppShell />
    </StaticRouter>,
  )
}
