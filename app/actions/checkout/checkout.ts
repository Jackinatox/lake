'use server';

import { PAID_UPGRADE_DISABLED } from '@/lib/paidUpgrade';
import { auth } from '@/auth';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import { formatMBToGiB } from '@/lib/GlobalFunctions/ptResourceLogic';
import { JobId, provisionServerWithWorker } from '@/lib/Pterodactyl/createServers/provisionServer';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { checkFreeServerEligibility, notifyFreeServerCreated } from '@/lib/freeServer';
import { getKeyValueBooleanFresh, getKeyValueNumber } from '@/lib/keyValue';
import { refuseIfSuspended, SERVER_SUSPENDED_MESSAGE } from '@/lib/gameserver/requireUnsuspended';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import {
    checkoutParamsSchema,
    checkoutUpgradeParamsSchema,
    gameConfigSchema,
} from '@/lib/validation/order';
import { stripe } from '@/lib/stripe';
import { GameConfig, HardwareConfig, ServerConfig } from '@/models/config';
import { loadUpgradeContext } from '@/lib/upgrade/loadUpgradeContext';
import { fetchServerUsage } from '@/lib/upgrade/serverUsage';
import { tierBlockers } from '@/lib/upgrade/tierEligibility';
import {
    extendedExpiry,
    isValidHardware,
    quoteServerChange,
    type ServerSpec,
} from '@/lib/upgrade/pricing';
import type { UPGRADE_DURATIONS } from '@/lib/validation/common';
import type { z } from 'zod';
import { headers } from 'next/headers';
import {
    FREE_SERVER_CREATION_ENABLED,
    FREE_SERVERS_LOCATION_ID,
    LEGAL_GRACE_PERIOD_MS,
} from '../../GlobalConstants';

type LineItem = {
    name: string;
    description?: string;
    amountCents: number;
};

type CreateCheckoutSessionParams = {
    lineItems: LineItem[];
    orderId: string;
    stripeUserId: string;
    locale?: 'de' | 'en';
    startDate: Date;
    endDate: Date;
    /** When the Stripe session stops accepting payment (Stripe default: 24 h, minimum 30 min) */
    expiresAt?: Date;
};

async function createCheckoutSession(params: CreateCheckoutSessionParams) {
    const { lineItems, orderId, stripeUserId, locale, startDate, endDate, expiresAt } = params;

    const formatDate = (d: Date) =>
        d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const item = lineItems[0];

    return stripe.checkout.sessions.create({
        locale: 'auto',
        mode: 'payment',
        ui_mode: 'custom',
        billing_address_collection: item.amountCents >= 5000 ? 'required' : 'auto',
        invoice_creation: {
            enabled: true,
            invoice_data: {
                custom_fields: [
                    {
                        name: 'Leistungsdatum',
                        value: `${formatDate(startDate)} - ${formatDate(endDate)}`,
                    },
                ],
                rendering_options: {
                    amount_tax_display: 'include_inclusive_tax',
                },
            },
        },
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    tax_behavior: 'unspecified',
                    unit_amount: item.amountCents,
                    product_data: {
                        name: item.name,
                        ...(item.description && { description: item.description }),
                    },
                },
                quantity: 1,
            },
        ],
        metadata: { orderId },
        tax_id_collection: { enabled: false },
        automatic_tax: { enabled: false },
        customer: stripeUserId,
        ...(expiresAt && { expires_at: Math.floor(expiresAt.getTime() / 1000) }),
    });
}

/**
 * Resolves a gameSlug to a gameData ID. Falls back to gameId for backward compat
 * with configs that were persisted before the slug migration.
 */
async function resolveGameDataId(gameConfig: GameConfig): Promise<number> {
    const data = await resolveGameData(gameConfig);
    return data.id;
}

async function resolveGameData(gameConfig: GameConfig): Promise<{ id: number; name: string }> {
    if (gameConfig.gameSlug) {
        const gameData = await prisma.gameData.findUnique({
            where: { slug: gameConfig.gameSlug },
            select: { id: true, name: true },
        });
        if (!gameData) throw new Error(`Game not found for slug: ${gameConfig.gameSlug}`);
        return gameData;
    }
    throw new Error('GameConfig must have gameSlug or gameId');
}

// locale is to put the right agb text in stripe checkout
export type CheckoutParams =
    | {
          type: 'CONFIGURED';
          locale: 'de' | 'en';
          creationServerConfig: ServerConfig;
          resourceTierId: number;
      }
    | {
          type: 'UPGRADE';
          locale: 'de' | 'en';
          ptServerId: string;
          resourceTierId: number;
          cpuPercent: number;
          ramMb: number;
          extendDays: (typeof UPGRADE_DURATIONS)[number];
      }
    | {
          type: 'TO_PAYED';
          locale: 'de' | 'en';
          ptServerId: string;
          hardwareConfig: HardwareConfig;
      };

type CheckoutSuccess = { client_secret: string | null; orderId: string; sessionId: string };
/** Expected refusals the UI explains itself; returned, because Next.js masks thrown messages. */
export type CheckoutRefusal = { error: 'PREVIOUS_UPGRADE_PENDING' | 'PREVIOUS_UPGRADE_FAILED' };
export type CheckoutResult = CheckoutSuccess | CheckoutRefusal;

export async function checkoutAction(
    params: CheckoutParams,
): Promise<CheckoutResult> {
    // Destructure inside each switch branch so TypeScript can narrow the discriminated union correctly

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error('Not authenticated');
    const user = session.user;
    const validatedParams = checkoutParamsSchema.parse(params);

    // const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    let stripeUserId = session.user.stripeUserId;

    if (!stripeUserId) {
        const newCustomer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: {
                userId: user.id,
            },
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { stripeUserId: newCustomer.id },
        });

        stripeUserId = newCustomer.id;
    }

    switch (validatedParams.type) {
        case 'CONFIGURED': {
            const { creationServerConfig, resourceTierId } = validatedParams;
            if (!creationServerConfig) throw new Error('No Serverconfigration given');

            // Look up the resource tier to get its flat-fee price
            const tier = await prisma.resourceTier.findUnique({
                where: { id: resourceTierId },
            });
            if (!tier?.enabled) throw new Error(`ResourceTier not found: ${resourceTierId}`);

            const location = await prisma.location.findFirstOrThrow({
                where: { id: creationServerConfig.hardwareConfig.pfGroupId },
                include: { cpu: true, ram: true },
            });
            const hardwareConfig = creationServerConfig.hardwareConfig;
            const cpuPercent = hardwareConfig.cpuPercent;
            const ramMB = hardwareConfig.ramMb;
            const diskMB = tier.diskMB;
            const backupCount = tier.backups;
            const duration = hardwareConfig.durationsDays;
            const allocations = tier.ports;

            const price = calculateNew(location, cpuPercent, ramMB, duration, tier.priceCents);

            const gameData = await resolveGameData(creationServerConfig.gameConfig);
            const creationGameDataId = gameData.id;

            const order = await prisma.gameServerOrder.create({
                data: {
                    type: 'CONFIGURED',
                    gameServerId: null,
                    userId: user.id,
                    ramMB,
                    cpuPercent,
                    diskMB,
                    backupCount,
                    allocations,
                    price: price.totalCents,
                    expiresAt: new Date(
                        Date.now() + duration * 24 * 60 * 60 * 1000 + LEGAL_GRACE_PERIOD_MS,
                    ),
                    status: 'PENDING',
                    creationGameDataId,
                    creationLocationId: creationServerConfig.hardwareConfig.pfGroupId,
                    resourceTierId: tier.id,
                    gameConfig: creationServerConfig.gameConfig as any,
                },
            });

            const stripeSession = await createCheckoutSession({
                lineItems: [
                    {
                        name: `${gameData.name} Gameserver: ${location.name}, ${formatVCoresFromPercent(cpuPercent)}, ${formatMBToGiB(ramMB)} RAM, ${formatMBToGiB(diskMB)} Speicher, ${backupCount} Backups, ${allocations} Ports, ${duration} Tage`,
                        amountCents: price.totalCents,
                    },
                ],
                orderId: String(order.id),
                stripeUserId,
                locale: params.locale,
                startDate: new Date(),
                endDate: order.expiresAt,
            });

            const client_secret = stripeSession.client_secret;
            await prisma.gameServerOrder.update({
                where: { id: order.id },
                data: { stripeSessionId: stripeSession.id, stripeClientSecret: client_secret },
            });

            return { client_secret, orderId: order.id, sessionId: stripeSession.id };
        }
        case 'UPGRADE': {
            if (PAID_UPGRADE_DISABLED) {
                throw new Error('Upgrade und Verlängerung sind vorübergehend nicht verfügbar.');
            }
            return checkoutServerChange(validatedParams, user.id, user.ptKey, stripeUserId);
        }
        case 'TO_PAYED': {
            throw new Error('Feature not implemented yet.');
            // const client_secret = await upgradeToPayed(params, dbUser);
            // return { client_secret: client_secret };
        }
    }
}

/** How long an upgrade checkout can be paid: short, because the price depends on the time left. */
// Stripe requires at least 30 min; one extra minute absorbs clock skew.
const UPGRADE_SESSION_TTL_MS = 31 * 60 * 1000;

/**
 * Checkout for changing (up- or downgrading) and/or extending a paid server. All numbers are
 * recomputed here from the DB and live Pterodactyl usage; the client only sends the wish.
 * See docs/server-upgrade.md.
 */
async function checkoutServerChange(
    params: z.infer<typeof checkoutUpgradeParamsSchema>,
    userId: string,
    ptKey: string | null | undefined,
    stripeUserId: string,
): Promise<CheckoutResult> {
    const { ptServerId, resourceTierId, cpuPercent, ramMb, extendDays } = params;

    const ctx = await loadUpgradeContext(ptServerId, userId);
    if (!ctx) {
        throw new Error(
            `No Server Found for upgrade. ptServerId: ${ptServerId}, userId: ${userId}`,
        );
    }
    const { server, location, currentTier, current } = ctx;

    // Never take money for a server the user cannot reach: the unsuspend guard in
    // `upgradeGameServer` would refuse to release it once the payment lands.
    if (await refuseIfSuspended(server.id, 'checkoutUpgrade', userId)) {
        throw new Error(SERVER_SUSPENDED_MESSAGE);
    }

    // A paid upgrade that is not applied yet (webhook still running, or FAILED until an admin
    // retries it) leaves the server row on its old spec/expiry: a new quote would be priced
    // from that and, once applied, overwrite the paid order. See docs/server-upgrade.md.
    const unapplied = await prisma.gameServerOrder.findFirst({
        where: {
            gameServerId: server.id,
            type: 'UPGRADE',
            status: 'PAID',
            provisioningStatus: { not: 'SUBMITTED' },
        },
        select: { id: true, provisioningStatus: true },
    });
    if (unapplied) {
        logger.info('Refused upgrade checkout: previous upgrade not applied yet', 'PAYMENT', {
            userId,
            gameServerId: server.id,
            details: { orderId: unapplied.id, provisioningStatus: unapplied.provisioningStatus },
        });
        return {
            error:
                unapplied.provisioningStatus === 'FAILED'
                    ? 'PREVIOUS_UPGRADE_FAILED'
                    : 'PREVIOUS_UPGRADE_PENDING',
        };
    }

    // Location stays the server's own. A location switch needs a server transfer in
    // Pterodactyl and is being built separately — add it here once that exists.

    if (!isValidHardware(location, current, { cpuPercent, ramMb })) {
        throw new Error('CPU/RAM selection is outside the allowed range');
    }

    const newTier = ctx.tierOptions.find((tier) => tier.id === resourceTierId);
    if (!newTier) throw new Error('Selected resource tier is not available');

    if (newTier.id !== currentTier?.id) {
        const usage = ptKey ? await fetchServerUsage(ptServerId, ptKey) : null;
        const blockers = tierBlockers(newTier, currentTier, usage);
        if (blockers.length > 0) {
            logger.info('Refused upgrade checkout: tier does not fit the server', 'PAYMENT', {
                userId,
                gameServerId: server.id,
                details: { resourceTierId, blockers, usage },
            });
            throw new Error('Selected resource tier does not fit the current server usage');
        }
    }

    const target: ServerSpec = {
        cpuPercent,
        ramMb,
        tierId: newTier.id,
        tierPriceCents: newTier.priceCents,
    };
    const now = new Date();
    const quote = quoteServerChange({
        pf: location,
        current,
        target,
        remainingMs: server.expires.getTime() - now.getTime(),
        extendDays,
    });
    if (quote.status !== 'OK') {
        throw new Error(`Upgrade cannot be checked out: ${quote.status}`);
    }

    const alreadyExpired = server.expires.getTime() <= now.getTime();
    const expiresAt = new Date(
        extendedExpiry(server.expires, extendDays, now).getTime() +
            (alreadyExpired && extendDays > 0 ? LEGAL_GRACE_PERIOD_MS : 0),
    );

    // Only one open upgrade checkout per server: an older one was priced against the
    // config it saw then, so paying it after this one would charge the wrong amount.
    await expireOpenUpgradeCheckouts(server.id, userId);

    const order = await prisma.gameServerOrder.create({
        data: {
            // Downgrades are UPGRADE orders too: refunds revert any UPGRADE to the previous
            // order (lib/refund/undoRefundedOrder.ts), which is what a downgrade needs as well.
            type: 'UPGRADE',
            gameServerId: server.id,
            userId,
            ramMB: ramMb,
            cpuPercent,
            diskMB: newTier.diskMB,
            backupCount: newTier.backups,
            allocations: newTier.ports,
            creationLocationId: location.id,
            creationGameDataId: server.gameDataId,
            resourceTierId: newTier.id,
            price: quote.totalCents,
            expiresAt,
            status: 'PENDING',
        },
    });

    const parts: string[] = [];
    if (quote.specChanged) {
        parts.push(
            `${formatVCoresFromPercent(cpuPercent)}, ${formatMBToGiB(ramMb)} RAM, ${newTier.name?.trim() || formatMBToGiB(newTier.diskMB)} (${formatMBToGiB(newTier.diskMB)} Speicher, ${newTier.backups} Backups, ${newTier.ports} Ports)`,
        );
    }
    if (extendDays > 0) parts.push(`+${extendDays} Tage`);
    const title = quote.specChanged
        ? extendDays > 0
            ? 'Server-Änderung und Verlängerung'
            : 'Server-Änderung'
        : 'Server-Verlängerung';

    const stripeSession = await createCheckoutSession({
        lineItems: [{ name: `${title}: ${parts.join(', ')}`, amountCents: quote.totalCents }],
        orderId: String(order.id),
        stripeUserId,
        locale: params.locale,
        startDate: now,
        endDate: order.expiresAt,
        expiresAt: new Date(now.getTime() + UPGRADE_SESSION_TTL_MS),
    });

    await prisma.gameServerOrder.update({
        where: { id: order.id },
        data: {
            stripeSessionId: stripeSession.id,
            stripeClientSecret: stripeSession.client_secret,
        },
    });

    return {
        client_secret: stripeSession.client_secret,
        orderId: order.id,
        sessionId: stripeSession.id,
    };
}

async function expireOpenUpgradeCheckouts(gameServerId: string, userId: string) {
    const open = await prisma.gameServerOrder.findMany({
        where: { gameServerId, type: 'UPGRADE', status: 'PENDING', stripeSessionId: { not: null } },
        select: { id: true, stripeSessionId: true },
    });
    for (const order of open) {
        try {
            // The `checkout.session.expired` webhook then marks the order EXPIRED.
            const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId!);
            if (session.status === 'open') await stripe.checkout.sessions.expire(session.id);
        } catch (error) {
            logger.warn('Could not expire an older upgrade checkout', 'PAYMENT', {
                userId,
                gameServerId,
                details: { orderId: order.id, error },
            });
        }
    }
}

// Create a free GameServer
export async function checkoutFreeGameServer(gameConfig: GameConfig): Promise<JobId> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) throw new Error('Not authenticated');
    const user = session.user;
    const validatedGameConfig = gameConfigSchema.parse(gameConfig) as GameConfig;

    // Kill switch read straight from the DB (no cache) so disabling it takes
    // effect immediately, even while cached pages still offer the form.
    const creationEnabled = await getKeyValueBooleanFresh(FREE_SERVER_CREATION_ENABLED, true);
    if (!creationEnabled) {
        logger.info('Blocked free server creation: creation is disabled', 'GAME_SERVER', {
            userId: user.id,
        });
        throw new Error('Die Erstellung kostenloser Server ist derzeit deaktiviert');
    }

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const freeServerStats = await getFreeTierConfigCached();
    const locationId = await getKeyValueNumber(FREE_SERVERS_LOCATION_ID);

    const userAllowed = await checkFreeServerEligibility(dbUser.id, freeServerStats.maxServers);
    if (!userAllowed.allowed) {
        throw new Error('Maximale Anzahl kostenloser Server erreicht');
    }

    const freeGameDataId = await resolveGameDataId(validatedGameConfig);

    const order = await prisma.gameServerOrder.create({
        data: {
            type: 'FREE_SERVER',
            userId: dbUser.id,
            ramMB: freeServerStats.ram,
            cpuPercent: freeServerStats.cpu,
            diskMB: freeServerStats.storage,
            backupCount: freeServerStats.backupCount,
            allocations: freeServerStats.allocations,
            price: 0,
            expiresAt: new Date(
                Date.now() + freeServerStats.duration * 24 * 60 * 60 * 1000 + LEGAL_GRACE_PERIOD_MS,
            ),
            status: 'PAID',
            creationGameDataId: freeGameDataId,
            gameConfig: validatedGameConfig as any,
            creationLocationId: locationId,
        },
    });

    try {
        const jobId = await provisionServerWithWorker(order);
        // notify via lib helper (handles its own logging/errors)
        try {
            await notifyFreeServerCreated(order.id, user.id);
        } catch (notifyErr) {
            logger.error('Failed to run free server notification helper', 'EMAIL', {
                userId: user.id,
                details: {
                    error: notifyErr instanceof Error ? notifyErr.message : String(notifyErr),
                    orderId: order.id,
                },
            });
        }
        return jobId;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

        logger.fatal('Failed to provision free server', 'GAME_SERVER', {
            userId: dbUser.id,
            details: {
                error: errorMessage,
                orderId: order.id,
            },
        });
        throw new Error('Interner Fehler - Server konnte nicht erstellt werden');
    }
}
