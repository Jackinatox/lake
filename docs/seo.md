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
    to `og:type=article` with published/modified time (blog posts).
  - `createPrivateMetadata({ title })` and `PRIVATE_ROBOTS`: `noindex, nofollow`.
  - `metadataCopy`: per-locale titles/descriptions for pages without their own message keys.
  - `SITE_URL`: absolute origin (`NEXT_PUBLIC_APP_URL`) for sitemap, robots and JSON-LD.
- `app/layout.tsx`: `metadataBase`, which turns the relative canonical/hreflang URLs absolute.
- `app/robots.ts`: `Disallow: /api/, /webhook/` plus the `Sitemap:` line.
- `app/sitemap.ts`: `localeUrls(path, ...)` emits one entry per locale with
  `alternates.languages`. Contains home, pricing, blog, changelog, `/support/tickets`, the order
  pages per enabled game, and blog posts (`published && listed && publishedAt <= now`).
  `dynamic = 'force-dynamic'`: rendered per request, otherwise it is built once at build time.
  Not ISR, because that cache lives per instance and we run several. Legal pages are indexable
  but deliberately not listed.
- `proxy.ts` + `i18n/routing.ts`: the middleware is built from `routing`. `alternateLinks: false`
  turns off next-intl's own hreflang `Link` header, which pointed `x-default` at `/` and
  contradicted the head and sitemap. The matcher must exclude `robots.txt` and `sitemap.xml`,
  otherwise they get redirected to `/<locale>/robots.txt` and 404.
- `lib/markdownExcerpt.ts`: `stripMarkdown` (blog list excerpts) and `markdownExcerpt` (~155 char
  meta description for blog posts).

## Private sections (noindex)

- Layouts exporting `metadata = { robots: PRIVATE_ROBOTS }`: `app/[locale]/admin/layout.tsx`,
  `app/[locale]/profile/layout.tsx`, `app/[locale]/(auth-pages)/layout.tsx`.
- Per page via `createPrivateMetadata`: `/gameserver/*`, `/order/checkout`,
  `/support/tickets/new`, `/support/tickets/[ticketId]`, `/products/wait/[jobId]`, and the legacy
  `/support` form (duplicate of `/support/tickets` until it is removed).
- `/support/tickets` itself is public (the support landing page) and is in the sitemap.

## Structured data (JSON-LD)

- `lib/structuredData.ts` builds the objects, `components/seo/JsonLd.tsx` renders them (escapes
  `<`).
- Homepage: `Organization` (name, logo, email) + `WebSite`. Blog posts: `BlogPosting`.
- Only mark up what is visible on the page. Google can issue a manual action for markup that is
  not, which is why there is no `Product`/`Offer` with a price yet.

## Adding a page

Public: use `createPublicMetadata` in `generateMetadata` and add a `localeUrls(...)` line to the
sitemap. Private: use `createPrivateMetadata`, or put it under one of the noindex layouts. Do not
add it to robots.txt.
