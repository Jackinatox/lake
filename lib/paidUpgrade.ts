/**
 * Temporary kill switch for upgrading/extending paid servers. The flow is not
 * finished yet, so the upgrade page shows an explanation instead of the
 * configurator and `checkoutAction` rejects `UPGRADE` checkouts.
 * Flip to `false` once the feature is done.
 */
export const PAID_UPGRADE_DISABLED = true;
