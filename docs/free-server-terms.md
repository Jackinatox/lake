# Free server terms of use

Free game servers have their own terms of use ("Nutzungsbedingungen für kostenlose
Gameserver") that apply in addition to the AGB; paid servers only use the AGB. A notice
right at the create button and at the extend button says that the click accepts both
documents in their current version.

## Text and page

- KeyValue keys `legal_free_terms_de` / `legal_free_terms_en` (constants
  `LEGAL_FREE_TERMS_DE/EN` in `app/GlobalConstants.ts`), HTML pasted in at `/admin/keyvalue`
  like the other legal texts.
- Both keys are in `REQUIRED_DB_CONSTANTS` (`lib/startup.ts`), so the app refuses to boot
  without them. Migration `20261119120000_free_server_terms_keys` creates them with an empty
  `<div></div>` if they are missing (`ON CONFLICT DO NOTHING`, so rows created beforehand keep
  their text). `prisma/seed.ts` does the same for a fresh database.
- Page: legal topic `free-terms` → `/legal/free-terms`, rendered by
  `app/[locale]/legal/[topic]/LegalPageTemplate.tsx`. Listed on `/legal` and in the footer.
  Titles in `legalOverview.topics.free-terms`, footer label `footer.freeTerms`.

## Notice at the buttons

`components/order/free/FreeTermsNotice.tsx` renders the notice with both links (new tab, so
the form state is kept). Texts: `freeServer.termsNotice.create` / `.extend`.

| Where                                                                                             | Button |
| ------------------------------------------------------------------------------------------------- | ------ |
| `app/[locale]/order/free/[gameSlug]/FreeGameBookingSlug.tsx`, sticky bottom bar                   | create |
| `app/[locale]/gameserver/[server_id]/upgrade/freeServer/FreeServerUpgradeClient.tsx`, extend card | extend |

No checkbox: a clear notice before the button is enough for the terms to apply, so the
buttons are not blocked by it. Nothing is stored about the acceptance: the version valid
at the creation or the last extension applies, and `GameServer.createdAt` /
`lastExtended` record when that was. Any new create or extend button for free servers
needs this notice too.
