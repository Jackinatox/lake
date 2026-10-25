# Where information goes: lake pages, FAQ, docs

Rules for placing user-facing information so it stays correct and readable for people, search
engines and AI answers. Decided with the owner in 2026-10 while working on SEO.

## Lake pages

Information lake has (database, KeyValue config, code) is provided by lake itself, rendered from
that source on the page, server-side, so crawlers without JS read it too. Examples: games,
prices, performance groups and CPUs, resource packages, duration surcharges/discounts, free tier
specs, runtime and deletion period. Prefer showing it where the user needs it anyway (e.g. every
performance group's and resource package's price on the `/pricing` selection cards) over a separate
table that repeats it.
Never copy such information into FAQ entries, docs or blog posts by hand; link to the page.
Exceptions, decided with the owner per case: a value that rarely changes and that the page does not show
may be written into a FAQ answer when the answer is useless without it (currently the free server's 30-day
runtime and the 90 days until an expired server is deleted). Whoever changes such a value updates those FAQ
entries in the admin too.

## FAQ (`FAQ` table, `components/faq/FaqSection.tsx`)

Short answers (about 2 to 4 sentences) to questions that come up on a specific page, shown on
that page via its category. Also for legal topics people keep asking about, even though the legal
texts already contain them: hardly anyone reads those. Redundancy with legal texts is a
trade-off, decided per topic. Answers must not hard-code lake information (see above); refer to
the page or link to a docs article for more. Links survive on the page but not in the `FAQPage`
markup; when answers start linking, see `docs/seo.md` (Structured data).

## Docs (`Scyed/lake-docs`, Starlight, https://scyed.com/docs/)

Only for users who want to go deeper into Scyed or game servers, and for tutorials that need more
than about three sentences (e.g. installing a modpack, restoring a backup, uploading files,
switching games, what a performance group is). Same rule: no hard-coded lake information, link to
the lake page instead.

Links from the docs to lake pages have no language prefix (`https://scyed.com/pricing`, not
`/de/pricing`), decided with the owner: lake then picks the language (locale cookie, then
`Accept-Language`, then `de`), and links need no change if the docs get an English version. The
307 this costs crawlers is accepted; inside lake, links keep the prefix (`docs/seo.md`).

## Not at all

When the page itself already explains it in plain text, do not repeat it in FAQ or docs.
