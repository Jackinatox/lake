# Server upgrade / downgrade / extension (paid servers)

`/gameserver/[id]/upgrade/payedServer` lets the owner of a paid server change CPU, RAM and
resource tier in both directions and/or extend it, in one Stripe checkout. Nothing is ever
refunded: a downgrade only creates credit that is netted against the extension in the same
checkout. Free servers use the separate `upgrade/freeServer` flow (not covered here).

## Pricing — `lib/upgrade/pricing.ts`

`quoteServerChange()` is pure and used by both the configurator and `checkoutAction`:

- **adjustment** = (daily rate of new config − daily rate of current config) × time left until
  `GameServer.expires`. Signed; daily rate = (CPU + RAM + tier monthly price) / 30 at today's
  location prices. 0 for an expired server.
- **extension** = `calculateNew()` of the *new* config for the extension days, i.e. full price
  incl. the duration modifiers in `paymentLogic.ts` (7 d surcharge, ≥90 d discount). The
  modifier applies only to the extension, never to the adjustment.
- **total** = adjustment + extension. Statuses: `NO_CHANGE`, `EXTENSION_REQUIRED` (expired server, no extension picked — the configurator hides "don't extend" for expired servers and preselects 30 d), `CREDIT_EXCEEDS` (total ≤ 0 —
  user must extend longer; credit is never paid out), `BELOW_MINIMUM` (< 1 €), `OK`.
  Only `OK` can be checked out.

New expiry = max(expires, now) + extension days (`extendedExpiry`); `LEGAL_GRACE_PERIOD_MS`
is added only when the server had already expired.

## Smaller tiers — `lib/upgrade/tierEligibility.ts`, `lib/upgrade/serverUsage.ts`

`fetchServerUsage()` reads disk usage, backup count and assigned ports from the Pterodactyl
client API with the owner's `ptKey`. `tierBlockers()` blocks a tier if any of those exceed it
(or it is disabled and not the current tier). If usage can't be read, only tiers not smaller
than the current one are allowed and the UI just says downgrading is not available (`upgrade.usage.unknownHint`). The UI explains that backups/files must be deleted and that
the disk usage can lag a few minutes. CPU/RAM bounds come from the location
(`hardwareBounds` / `isValidHardware`).

## Flow

1. `components/gameserver/Upgrade/UpgradeGameServerServer.tsx` → `loadUpgradeContext()`
   (`lib/upgrade/loadUpgradeContext.ts`: server, location, current tier, tier options) +
   usage → client `UpgradeGameServer` / `UpgradeHardwareConfig`. `?extend=7|30|90|180` preselects
   an extension (used by the "extend" links on the card and in settings).
2. `checkoutAction({ type: 'UPGRADE', ptServerId, cpuPercent, ramMb, resourceTierId,
   extendDays })` (`app/actions/checkout/checkout.ts`, `checkoutServerChange`) re-loads
   everything, re-checks bounds + tier usage + suspension, re-quotes, expires older open
   UPGRADE sessions of that server, creates a `GameServerOrder` (type `UPGRADE` also for
   downgrades, so refund revert in `lib/refund/undoRefundedOrder.ts` works) and a Stripe
   session that expires after 30 min (the price depends on the time left).
3. Webhook → `lib/Pterodactyl/upgradeServer/upgradeServer.ts` sets the PT build
   (memory/cpu/disk/backups/allocations), unsuspends, and writes the order's values +
   `expiresAt` to the `GameServer`. The build is set before unsuspending, so a failed PATCH
   never leaves an expired server running.
4. Refund/withdrawal of an `UPGRADE` order: `revertToPreviousOrder` restores the previous
   order's build, expiry, `allocations` and `resourceTierId` (the quote resolves the current tier
   from that id first, so a stale id would credit a refunded tier). `requestUserWithdrawal`
   refuses an order that has a later paid order on the same server. The withdrawal dialog
   (`components/payments/RefundRequestButton.tsx`) mirrors the same `UPGRADE`/`RENEW` split
   and says "upgrade will be undone" instead of "server will be suspended".

**Performance group switch** (DB model `Location`; the UI always says "performance group") is not supported yet (needs a PT server transfer, built separately);
the spots to extend are marked in `checkoutServerChange` and `UpgradeHardwareConfig`.

Kill switch: `PAID_UPGRADE_DISABLED` in `lib/paidUpgrade.ts` shows `UpgradeUnavailable`
and makes `checkoutAction` reject `UPGRADE`.
