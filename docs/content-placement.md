# Where information goes: lake pages, FAQ, docs

Rules for placing user-facing information so it stays correct and readable for people, search
engines and AI answers. Decided with the owner in 2026-10 while working on SEO.

## Lake pages

Information lake has (database, KeyValue config, code) is provided by lake itself, rendered from
that source on the page, server-side, so crawlers without JS read it too. Examples: games,
prices, performance groups and CPUs, resource packages, duration surcharges/discounts, free tier
specs, runtime and deletion period (`/pricing` price overview, free order page explanation).
Never copy such information into FAQ entries, docs or blog posts by hand; link to the page.
When such a text answers a question, render it as `FaqSection`'s `leadItem` (first entry, open by
default) instead of a separate block; the free order page does this.

## FAQ (`FAQ` table, `components/faq/FaqSection.tsx`)

Short answers (about 2 to 4 sentences) to questions that come up on a specific page, shown on
that page via its category. Also for legal topics people keep asking about, even though the legal
texts already contain them: hardly anyone reads those. Redundancy with legal texts is a
trade-off, decided per topic. Answers must not hard-code lake information (see above); refer to
the page or link to a docs article for more.

## Docs (`Scyed/lake-docs`, Starlight, https://scyed.com/docs/)

Only for users who want to go deeper into Scyed or game servers, and for tutorials that need more
than about three sentences (e.g. installing a modpack, restoring a backup, uploading files,
switching games, what a performance group is). Same rule: no hard-coded lake information, link to
the lake page instead.

## Not at all

When the page itself already explains it in plain text, do not repeat it in FAQ or docs.
