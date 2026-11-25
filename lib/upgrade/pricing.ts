import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import type { PerformanceGroup } from '@/models/prisma';

/**
 * Price of changing (up- or downgrading) and/or extending a paid server. Pure, so the
 * configurator and `checkoutAction` compute the exact same number. See `docs/server-upgrade.md`.
 *
 *   adjustment = (new daily rate − current daily rate) × remaining time   (signed)
 *   extension  = full price of the NEW config for the extension days      (with the
 *                usual duration discount / short-term surcharge of `calculateNew`)
 *   total      = adjustment + extension
 *
 * A downgrade makes the adjustment negative: that credit is only ever netted against the
 * extension, never paid out. When it covers the whole extension the change cannot be bought
 * (status `CREDIT_EXCEEDS`) and the user has to extend for longer.
 */

/** Stripe needs a minimum charge; we use 1 € like the rest of the shop. */
export const UPGRADE_MIN_CHARGE_CENTS = 100;

export const DAY_MS = 24 * 60 * 60 * 1000;

export type ServerSpec = {
    cpuPercent: number;
    ramMb: number;
    tierId: number | null;
    /** Monthly flat fee of the resource tier */
    tierPriceCents: number;
};

export type ServerChangeStatus =
    /** Nothing changes and nothing is extended */
    | 'NO_CHANGE'
    /** The server has already expired: any change needs an extension */
    | 'EXTENSION_REQUIRED'
    /** The downgrade credit is as large as (or larger than) the extension price */
    | 'CREDIT_EXCEEDS'
    /** Positive, but under `UPGRADE_MIN_CHARGE_CENTS` */
    | 'BELOW_MINIMUM'
    | 'OK';

export type ServerChangeQuote = {
    remainingMs: number;
    /** Signed: positive = upgrade surcharge for the remaining time, negative = downgrade credit */
    adjustmentCents: number;
    extension: {
        days: number;
        /** Before the duration modifier */
        subtotalCents: number;
        /** Signed like `calculateNew`: positive = discount, negative = surcharge */
        modifierCents: number;
        modifierPercent: number;
        totalCents: number;
    };
    /** adjustment + extension, signed */
    netCents: number;
    /** What the user pays: never negative */
    totalCents: number;
    specChanged: boolean;
    status: ServerChangeStatus;
};

/** Daily price of a spec in (fractional) cents, at today's prices of the location. */
export function dailyRateCents(pf: PerformanceGroup, spec: ServerSpec): number {
    const monthly =
        (pf.cpu.pricePerCore * spec.cpuPercent) / 100 +
        (pf.ram.pricePerGb * spec.ramMb) / 1024 +
        spec.tierPriceCents;
    return monthly / 30;
}

export function quoteServerChange(params: {
    pf: PerformanceGroup;
    current: ServerSpec;
    target: ServerSpec;
    /** Time until the server's current expiry; negative values count as 0 (already expired) */
    remainingMs: number;
    extendDays: number;
}): ServerChangeQuote {
    const { pf, current, target, extendDays } = params;
    const remainingMs = Math.max(0, params.remainingMs);

    const specChanged =
        current.cpuPercent !== target.cpuPercent ||
        current.ramMb !== target.ramMb ||
        current.tierId !== target.tierId;

    const rateDelta = dailyRateCents(pf, target) - dailyRateCents(pf, current);
    const adjustmentCents = specChanged ? Math.round(rateDelta * (remainingMs / DAY_MS)) : 0;

    const ext =
        extendDays > 0
            ? calculateNew(pf, target.cpuPercent, target.ramMb, extendDays, target.tierPriceCents)
            : null;
    const extension = {
        days: extendDays,
        subtotalCents: ext ? ext.totalCents + ext.discount.cents : 0,
        modifierCents: ext?.discount.cents ?? 0,
        modifierPercent: ext?.discount.percent ?? 0,
        totalCents: ext?.totalCents ?? 0,
    };

    const netCents = adjustmentCents + extension.totalCents;
    const totalCents = Math.max(0, netCents);

    let status: ServerChangeStatus;
    if (!specChanged && extendDays === 0) status = 'NO_CHANGE';
    else if (remainingMs === 0 && extendDays === 0) status = 'EXTENSION_REQUIRED';
    else if (netCents <= 0) status = 'CREDIT_EXCEEDS';
    else if (netCents < UPGRADE_MIN_CHARGE_CENTS) status = 'BELOW_MINIMUM';
    else status = 'OK';

    return { remainingMs, adjustmentCents, extension, netCents, totalCents, specChanged, status };
}

/** New expiry after paying: extension starts at the current expiry, or now if already expired. */
export function extendedExpiry(currentExpires: Date, extendDays: number, now = new Date()): Date {
    const base = Math.max(currentExpires.getTime(), now.getTime());
    return new Date(base + extendDays * DAY_MS);
}

/** CPU/RAM range the configurator offers for a location (whole vCores, 0.5 GiB RAM steps). */
export function hardwareBounds(location: PerformanceGroup) {
    return {
        cpuMinPercent: location.cpu.minThreads * 100,
        cpuMaxPercent: location.cpu.maxThreads * 100,
        ramMinMb: Math.round(location.ram.minGb * 1024),
        ramMaxMb: Math.round(location.ram.maxGb * 1024),
    };
}

/**
 * Whether a CPU/RAM pick is valid for the location. The server's current values are always
 * allowed, even if the location's range changed since it was bought.
 */
export function isValidHardware(
    location: PerformanceGroup,
    current: Pick<ServerSpec, 'cpuPercent' | 'ramMb'>,
    target: Pick<ServerSpec, 'cpuPercent' | 'ramMb'>,
): boolean {
    const b = hardwareBounds(location);
    const cpuOk =
        target.cpuPercent === current.cpuPercent ||
        (target.cpuPercent % 100 === 0 &&
            target.cpuPercent >= b.cpuMinPercent &&
            target.cpuPercent <= b.cpuMaxPercent);
    const ramOk =
        target.ramMb === current.ramMb ||
        (target.ramMb % 512 === 0 && target.ramMb >= b.ramMinMb && target.ramMb <= b.ramMaxMb);
    return cpuOk && ramOk;
}
