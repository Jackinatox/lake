'use server';

import { auth } from '@/auth';
import { calculateNew, calculateUpgradeCost } from '@/lib/GlobalFunctions/paymentLogic';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import { formatMBToGiB } from '@/lib/GlobalFunctions/ptResourceLogic';
import { JobId, provisionServerWithWorker } from '@/lib/Pterodactyl/createServers/provisionServer';
import { getFreeTierConfigCached } from '@/lib/free-tier/config';
import { checkFreeServerEligibility, notifyFreeServerCreated } from '@/lib/freeServer';
import { getKeyValueNumber } from '@/lib/keyValue';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { checkoutParamsSchema, gameConfigSchema } from '@/lib/validation/order';
import { stripe } from '@/lib/stripe';
import { GameConfig, HardwareConfig, ServerConfig } from '@/models/config';
import { env } from 'next-runtime-env';
import { headers } from 'next/headers';
import { FREE_SERVERS_LOCATION_ID, LEGAL_GRACE_PERIOD_MS } from '../../GlobalConstants';

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
};

async function createCheckoutSession(params: CreateCheckoutSessionParams) {
    const { lineItems, orderId, stripeUserId, locale, startDate, endDate } = params;

    const formatDate = (d: Date) =>
        d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const item = lineItems[0];

    return stripe.checkout.sessions.create({
        locale: 'auto',
        mode: 'payment',
        ui_mode: 'embedded',
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
        ...(locale && {
            custom_text: {
                terms_of_service_acceptance: {
                    message: getTermsMessage(locale),
                },
            },
            consent_collection: {
                terms_of_service: 'required',
            },
        }),
        metadata: { orderId },
        tax_id_collection: { enabled: false },
        automatic_tax: { enabled: false },
        customer: stripeUserId,
        return_url: `${env('NEXT_PUBLIC_APP_URL')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
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
          upgradeConfig: HardwareConfig;
          ptServerId: string;
      }
    | {
          type: 'TO_PAYED';
          locale: 'de' | 'en';
          ptServerId: string;
          hardwareConfig: HardwareConfig;
      };

export async function checkoutAction(
    params: CheckoutParams,
): Promise<{ client_secret: string | null; orderId: string }> {
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
                where: { id: resourceTierId, enabled: true },
            });
            if (!tier) throw new Error(`ResourceTier not found: ${resourceTierId}`);

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
                    gameConfig: creationServerConfig.gameConfig as any,
                },
            });

            const stripeSession = await createCheckoutSession({
                lineItems: [
                    {
                        name: `${gameData.name} Gameserver – ${location.name} – ${formatVCoresFromPercent(cpuPercent)}, ${formatMBToGiB(ramMB)} RAM, ${formatMBToGiB(diskMB)} Speicher, ${backupCount} Backups, ${allocations} Ports – ${duration} Tage`,
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

            return { client_secret, orderId: order.id };
        }
        case 'UPGRADE': {
            const { ptServerId, upgradeConfig } = validatedParams;
            const { cpuPercent, ramMb, diskMb, durationsDays, allocations } = upgradeConfig;

            const server = await prisma.gameServer.findFirst({
                where: { ptServerId: ptServerId, userId: user.id },
            });

            if (!server)
                throw new Error(
                    `No Server Found for upgrade. ptServerId: ${ptServerId}, userId: ${user.id}`,
                );

            const performanceGroup = await prisma.location.findUnique({
                where: { id: server.locationId },
                include: { cpu: true, ram: true },
            });

            if (!performanceGroup)
                throw new Error(
                    `No performanceGroup Found for upgrade. ptServerId: ${ptServerId}, userId: ${user.id} pfId: ${server.locationId}`,
                );

            const oldConfig: HardwareConfig = {
                cpuPercent: server.cpuPercent,
                ramMb: server.ramMB,
                diskMb: server.diskMB,
                backupCount: server.backupCount,
                allocations: server.allocations,
                durationsDays: Math.max(
                    0,
                    Math.round(
                        (server.expires.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                    ),
                ),
                pfGroupId: server.locationId,
            };

            const newConfig: HardwareConfig = {
                cpuPercent: cpuPercent - oldConfig.cpuPercent,
                ramMb: ramMb - oldConfig.ramMb,
                diskMb: diskMb - oldConfig.diskMb,
                backupCount: oldConfig.backupCount, // TODO: check this when custom servers allow for disk and backup config. Then the backup count may increase the price and is important here. but then also during inittial buy
                allocations: allocations - oldConfig.allocations,
                durationsDays: durationsDays,
                pfGroupId: server.locationId,
            };

            const price = calculateUpgradeCost(oldConfig, newConfig, performanceGroup);

            const order = await prisma.gameServerOrder.create({
                data: {
                    type: params.type,
                    gameServerId: server.id,
                    userId: user.id,
                    ramMB: ramMb,
                    cpuPercent: cpuPercent,
                    backupCount: server.backupCount,
                    allocations: allocations,
                    diskMB: diskMb,
                    creationLocationId: server.locationId,
                    creationGameDataId: server.gameDataId,
                    price: price.totalCents,
                    expiresAt: new Date(
                        Math.max(server.expires.getTime(), new Date().getTime()) +
                            durationsDays * 24 * 60 * 60 * 1000 +
                            LEGAL_GRACE_PERIOD_MS,
                    ),
                    status: 'PENDING',
                },
            });

            // 2. Create Stripe Checkout Session
            const cpuDiff = cpuPercent - oldConfig.cpuPercent;
            const ramDiffMb = ramMb - oldConfig.ramMb;

            const changeParts: string[] = [];
            if (cpuDiff !== 0) changeParts.push(`+${cpuDiff}% CPU`);
            if (ramDiffMb !== 0) changeParts.push(`+${formatMBToGiB(ramDiffMb)} RAM`);
            const changeStr = changeParts.length > 0 ? `${changeParts.join(', ')} → ` : '';
            const finalStr: string[] = [];
            if (cpuDiff !== 0) finalStr.push(`${cpuPercent}% CPU`);
            if (ramDiffMb !== 0) finalStr.push(`${formatMBToGiB(ramMb)} RAM`);
            const upgradeDescription = `${changeStr}${finalStr.join(', ')}${finalStr.length > 0 ? ', ' : ''}+${durationsDays} Tage`;

            const stripeSession = await createCheckoutSession({
                lineItems: [
                    {
                        name: `Server Upgrade: ${upgradeDescription}`,
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

            // 3. Save Stripe Session ID and Client Secret
            await prisma.gameServerOrder.update({
                where: { id: order.id },
                data: { stripeSessionId: stripeSession.id, stripeClientSecret: client_secret },
            });

            return { client_secret, orderId: order.id };
        }
        case 'TO_PAYED': {
            throw new Error('Feature not implemented yet.');
            // const client_secret = await upgradeToPayed(params, dbUser);
            // return { client_secret: client_secret };
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

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    const freeServerStats = await getFreeTierConfigCached();
    const locationId = await getKeyValueNumber(FREE_SERVERS_LOCATION_ID);

    const userAllowed = await checkFreeServerEligibility(dbUser.id, freeServerStats.maxServers);
    if (!userAllowed) {
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
            await notifyFreeServerCreated(order.id);
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

function getTermsMessage(locale: 'de' | 'en') {
    if (locale === 'de') {
        return "Ich stimme Scyed's [AGB](https://scyed.com/de/legal/tos) und der [Widerrufsbelehrung](https://scyed.com/de/legal/returns) zu.";
    } else {
        return "I agree to Scyed's Terms of Service [ToS](https://scyed.com/en/legal/tos) and [Refund Policy](https://scyed.com/en/legal/returns).";
    }
}
