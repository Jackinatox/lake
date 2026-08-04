# Lake

Next.js 15 (App Router) game-server hosting platform. Prisma 7 + PostgreSQL
(client generated into `app/client/generated`), Better Auth, next-intl
(`messages/en.json` / `messages/de.json`), shadcn/ui + Tailwind, Pterodactyl
panel API, external provisioning worker (separate repo).

## Documentation system — read this first

To keep context/token usage low, detailed feature knowledge lives in dedicated
markdown files under `docs/`, NOT in this file. How to use it:

1. **Before exploring the codebase** for a task, check the index below. If a
   doc covers your topic, read that file — it replaces a codebase exploration
   and names the exact files involved.
2. **Only read the docs relevant to your task.** Never read all of them
   preemptively; the whole point is saving tokens.
3. **Keep docs truthful.** If you change behavior that a doc describes
   (file paths, key names, data contracts, flows), update that doc in the same
   change. A stale doc is worse than none.
4. **Add new docs** for any feature complex enough that the next agent would
   otherwise need multi-file exploration to understand it. One topic per file,
   kebab-case filename, and add one index line below. Lead the doc with a
   2–3 sentence summary, then concrete file paths and data flow. Do not
   duplicate what a quick read of a single file would reveal.
5. This file stays lean: project one-liner + index only. Detailed content
   belongs in `docs/`.

## Docs index (`docs/`)

- `modpack-feedback-and-beta.md` — Modpack beta feedback feature (Feedback
  table, dashboard survey card, server actions) and the KeyValue-based
  modpack kill switch. Read when touching feedback, the beta status, or the
  modpack tab's visibility.
- `worker-modpack-provisioning.md` — Data contract between `lake` and the
  external provisioning worker for Modrinth modpack installs
  (`gameConfig.modpack`, egg variables). Read when changing the minecraft
  `gameConfig` shape or provisioning.
