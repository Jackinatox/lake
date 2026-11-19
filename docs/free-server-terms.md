# Free server terms of use

Free game servers have their own terms of use ("Nutzungsbedingungen für kostenlose
Gameserver") that apply in addition to the AGB; paid servers only use the AGB. A notice
next to the create button on the free order page says that creating the server accepts
both documents.

## Text and page

- KeyValue keys `legal_free_terms_de` / `legal_free_terms_en` (constants
  `LEGAL_FREE_TERMS_DE/EN` in `app/GlobalConstants.ts`), HTML pasted in at `/admin/keyvalue`
  like the other legal texts.
- Both keys are in `REQUIRED_DB_CONSTANTS` (`lib/startup.ts`), so the app refuses to boot
  without them. Migration `20261119120000_free_server_terms_keys` and `prisma/seed.ts` create
  them with an empty `<div></div>`.
- Page: legal topic `free-terms` → `/legal/free-terms`, rendered by
  `app/[locale]/legal/[topic]/LegalPageTemplate.tsx`. Listed on `/legal` and in the footer.
  Titles in `legalOverview.topics.free-terms`, footer label `footer.freeTerms`.

## Notice on the order page

`app/[locale]/order/free/[gameSlug]/FreeGameBookingSlug.tsx` shows the notice
(`freeServer.termsNotice`, links open in a new tab so the config is kept) in the sticky
bottom bar, left of the create button. No checkbox: a clear notice before the button is
enough for the terms to apply, so the button is not blocked by it.

Nothing is stored about the acceptance: the version that was valid at the server's
creation applies, so the creation date is enough. Extending a free server needs no new
acceptance.
