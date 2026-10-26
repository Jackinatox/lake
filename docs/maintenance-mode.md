# Maintenance mode

Emergency switch for when the Pterodactyl panels have to be shut down (e.g. a PHP security
vulnerability). With `MAINTENANCE_MODE=true` every page shows a banner, and every gameserver
or order route redirects to a page explaining the outage. It is an env var, not a KeyValue
row, so the proxy can check it without a DB query; flip it and restart the container.

## Files

- `lib/maintenance.ts` — `isMaintenanceMode()` and `MAINTENANCE_BLOCKED_PATH`, the regex of
  blocked paths: `/gameserver/**` and `/order/**`, with or without a `de|en` prefix.
- `proxy.ts` — before next-intl runs, redirects a matching path to `/{locale}/maintenance`
  (or `/maintenance`, which next-intl then prefixes). This also covers server action POSTs,
  because those go to the page's own path.
- `app/[locale]/maintenance/page.tsx` — the explanation page. It redirects to `/` when
  maintenance is off, so links to it do not go stale.
- `components/MaintenanceBanner.tsx` — rendered at the top of the content area in
  `app/layout.tsx`, and links to the page.
- Copy: namespace `Maintenance` in `messages/{en,de}.json`. Update the text there if the
  cause of a future outage is different.

## Not covered

`/api/**` and `/webhook` are outside the proxy matcher and keep running. The Stripe webhook
still processes payments that were already in flight; provisioning for them fails while the
panel is offline, just as it would without this switch.
