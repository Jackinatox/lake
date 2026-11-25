/**
 * Kill switch for changing/extending paid servers (docs/server-upgrade.md). While `true`, the
 * upgrade page shows an explanation with a support link instead of the configurator and
 * `checkoutAction` rejects `UPGRADE` checkouts.
 */
export const PAID_UPGRADE_DISABLED = false;
