# SEO: robots.txt, sitemap, canonical/hreflang, noindex, JSON-LD

Public pages get canonical + hreflang tags from one helper, are listed in `sitemap.xml` with the
same hreflang set, and robots.txt only blocks non-HTML routes. Private pages are kept out of the
index with a `noindex` meta tag, never with a robots.txt `Disallow` (a disallowed page is not
fetched, so crawlers would never see its noindex and could still index the bare URL).

## Files

- `lib/metadata.ts`
  - `createPublicMetadata({ locale, path, title, description, article? })`: canonical
    `/<locale><path>`, `alternates.languages` for every locale plus `x-default` (= default locale
    `de`), OpenGraph, Twitter. `path` is locale-less (`'/'` for the homepage). `article` switches
    to `og:type=article` with published/modified time (blog posts). `noindex` gives
    `noindex, follow` but keeps title and link preview (order funnel steps). `contentLocale`
    is for content that exists in one language only: canonical, og:url and hreflang then point
    at that locale from every locale's URL. Blog posts use `BLOG_CONTENT_LOCALE` (`de`, since
    `BlogPost` has no language field), and the sitemap lists only their `/de` URL
    (`localeUrls(..., locales)`).
  - `createPrivateMetadata({ title })` and `PRIVATE_ROBOTS`: `noindex, nofollow`.
  - `metadataCopy`: per-locale titles/descriptions for pages without their own message keys.
  - `SITE_URL`: absolute origin (`NEXT_PUBLIC_APP_URL`) for sitemap, robots and JSON-LD.
- `app/layout.tsx`: `metadataBase`, which turns the relative canonical/hreflang URLs absolute.
- `app/robots.ts`: `Disallow: /api/, /webhook/` plus two `Sitemap:` lines: lake's own and the
  docs' (`/docs/sitemap-index.xml`). The docs are a separate Starlight site (`Scyed/lake-docs`)
  that the reverse proxy serves under `/docs/`, outside lake and its locale routing; link to it
  with a plain `<a href="/docs/...">`, not next-intl's `Link`.
- `app/sitemap.ts`: `localeUrls(path, ...)` emits one entry per locale with
  `alternates.languages`. Contains home, pricing, blog, changelog, `/support/tickets`, `/order`,
  `/order/free`, the order page per enabled game, and blog posts (`published && listed && publishedAt <= now`).
  `dynamic = 'force-dynamic'`: rendered per request, otherwise it is built once at build time.
  Not ISR, because that cache lives per instance and we run several. Legal pages are indexable
  but deliberately not listed.
- `proxy.ts` + `i18n/routing.ts`: the middleware is built from `routing`. `alternateLinks: false`
  turns off next-intl's own hreflang `Link` header, which pointed `x-default` at `/` and
  contradicted the head and sitemap. The matcher must exclude `robots.txt` and `sitemap.xml`,
  otherwise they get redirected to `/<locale>/robots.txt` and 404.
- `i18n/navigation.ts`: `Link`, `useRouter`, `redirect`, `usePathname` that know the locale. All
  internal links use this `Link` (not `next/link`) with a locale-less `href` such as
  `/order/free`; it renders `/de/order/free` or `/en/order/free`. An unprefixed link in the HTML
  costs crawlers a 307 to the locale URL. Its `usePathname` returns the path without the locale,
  `next/navigation`'s includes it, so never feed the latter into this `Link`/router (double
  prefix). Server `redirect` takes `{ href, locale }`. Deliberate exception outside lake: lake-docs
  links lake pages without a prefix (`https://scyed.com/pricing`) so lake picks the language
  (next-intl's detection: locale cookie, then `Accept-Language`, then `de`); do not "fix" those,
  see `docs/content-placement.md`.
- `lib/markdownExcerpt.ts`: `stripMarkdown` (blog list excerpts) and `markdownExcerpt` (~155 char
  meta description for blog posts).

## Private sections (noindex)

- Layouts exporting `metadata = { robots: PRIVATE_ROBOTS }`: `app/[locale]/admin/layout.tsx`,
  `app/[locale]/profile/layout.tsx`, `app/[locale]/(auth-pages)/layout.tsx`.
- Per page via `createPrivateMetadata`: `/gameserver/*`, `/order/checkout`,
  `/support/tickets/new`, `/support/tickets/[ticketId]`, `/products/wait/[jobId]`, and the legacy
  `/support` form (duplicate of `/support/tickets` until it is removed).
- Unlisted blog posts (`listed = false`) get `createPublicMetadata({ noindex: true })`: reachable
  by link, but neither in the sitemap nor in search results.
- `/support/tickets` itself is public (the support landing page) and is in the sitemap.
- Order funnel steps `/order/[game]/setup`, `/order/configure`, `/order/configure/games` and
  `/order/free/[game]` use `createPublicMetadata({ noindex: true })` (`noindex, follow`) and are
  not in the sitemap. `/order/configure` is the same hardware-first configurator as `/pricing`,
  which is the page that should rank for prices; link to `/pricing` from content pages.

## Structured data (JSON-LD)

- `lib/structuredData.ts` builds the objects, `components/seo/JsonLd.tsx` renders them (escapes
  `<`).
- Homepage: `Organization` (name, logo, email) + `WebSite`. Blog posts: `BlogPosting`.
- `components/faq/FaqSection.tsx` emits `FAQPage` (answers as plain text via `stripMarkdown`), so
  at most one `FaqSection` per page. Its `AccordionContent` uses `forceMount`: Radix otherwise
  renders closed answers as empty, and crawlers would only see the questions.
  `components/ui/accordion.tsx` collapses force-mounted closed content itself (animated grid row,
  `invisible` when closed), since Radix's height keyframes do not work with it.
  Links in an answer are dropped from the markup (plain text). Fine while answers hardly link
  anywhere; once FAQ answers link to docs articles, reconsider emitting `Answer.text` as simple
  HTML (Google allows `<a>`, `<p>`, lists, `<strong>`). Low priority either way: since 2023 Google
  shows FAQ rich results only for government and health sites, so a Rich Results Test for these
  pages only checks validity.
- Only mark up what is visible on the page. Google can issue a manual action for markup that is
  not, which is why there is no `Product`/`Offer` with a price yet.

## Adding a page

Public: use `createPublicMetadata` in `generateMetadata` and add a `localeUrls(...)` line to the
sitemap. Private: use `createPrivateMetadata`, or put it under one of the noindex layouts. Do not
add it to robots.txt.

Public pages: no page-level `<Suspense>` around the main client component, and none inside
`FaqSection`. A boundary that suspends (e.g. on a server-component slot passed to the client)
streams the whole content into a `<div hidden>` at the end of the HTML; crawlers that do not run
JS (most AI crawlers) read that poorly. Every route renders dynamically (the root layout reads the
locale from the request), so `useSearchParams` works without a boundary. If a page is ever made
static or ISR (e.g. `setRequestLocale` / `generateStaticParams`), that no longer holds:
`useSearchParams` without a boundary then breaks its build. Wrap only the part that reads search
params, not the whole page.
