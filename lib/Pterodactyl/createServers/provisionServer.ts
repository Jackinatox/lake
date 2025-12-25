import { MinecraftGameId, SatisfactoryGameId } from '@/app/GlobalConstants';
import { calcBackups, calcDiskSize } from '@/lib/GlobalFunctions/ptResourceLogic';
import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { SatisfactoryConfig } from '@/models/gameSpecificConfig/SatisfactoryConfig';
import prisma from '@/lib/prisma';

import { NewServerOptions, Server } from '@avionrx/pterodactyl-js';
import { buildMC_ENVs_and_startup } from './buildMinecraftENVs';
import { logger } from '@/lib/logger';
import { GameServerOrder, GameServerType, OrderType } from '@/app/client/generated/browser';
import { correctPortsForGame } from '../PortHandeling/MultiPortGames';
import { reinstallPTServerOnly } from '@/lib/Pterodactyl/Functions/ReinstallPTServerOnly';
import { enableServerInstallScripts } from '@/components/gameserver/settings/serverSettingsActions';
import createSatisStartup from './createSatisENVs';

export async function provisionServer(order: GameServerOrder): Promise<string> {
    const serverOrder = await prisma.gameServerOrder.findUnique({
        where: { id: order.id },
        include: { user: true, creationGameData: true, creationLocation: true },
    });
    const pt = createPtClient();

    if (!serverOrder || !serverOrder.creationGameData || !serverOrder.creationLocation || !serverOrder.user.ptKey)
        throw new Error(`No Server found for serverOrder: ${order.id}`);

    console.log('user id: ', serverOrder.user.ptUserId);
    const gameConfig = serverOrder.gameConfig as any;

    let options: NewServerOptions;
    let preOptions = {
        user: serverOrder.user.ptUserId,
        limits: {
            cpu: serverOrder.cpuPercent,
            disk: calcDiskSize(serverOrder.cpuPercent, serverOrder.ramMB),
            memory: serverOrder.ramMB,
            io: 500,
            swap: 512,
        },
        egg: gameConfig.eggId,
        startWhenInstalled: false,
        outOfMemoryKiller: false,
        featureLimits: {
            allocations: 2,
            backups: calcBackups(serverOrder.cpuPercent, serverOrder.ramMB),
            databases: 0,
            split_limit: 0,
        },
        deploy: {
            dedicatedIp: false,
            locations: [serverOrder.creationLocation.ptLocationId],
            portRange: [],
        },
        image: gameConfig.dockerImage,
    };

    let startAndVars;
    switch (serverOrder.creationGameData.id) {
        case MinecraftGameId:
            startAndVars = buildMC_ENVs_and_startup(parseInt(gameConfig.eggId), gameConfig.version);
            break;
        case SatisfactoryGameId:
            startAndVars = createSatisStartup(gameConfig.gameSpecificConfig) // has type SatisfactoryConfig
            break;
        default:
            throw new Error('No Handler for this GameServer');
    }

    const serverName = serverOrder.creationGameData.name + ' Gameserver';
    options = {
        name: serverName,
        ...preOptions,
        ...startAndVars,
    } as NewServerOptions;

    const enumMap: Record<OrderType, GameServerType> = {
        [OrderType.DOWNGRADE]: GameServerType.CUSTOM,
        [OrderType.FREE_SERVER]: GameServerType.FREE,
        [OrderType.NEW]: GameServerType.CUSTOM,
        [OrderType.RENEW]: GameServerType.CUSTOM,
        [OrderType.TO_PAYED]: GameServerType.CUSTOM,
        [OrderType.UPGRADE]: GameServerType.CUSTOM,
        [OrderType.PACKAGE]: GameServerType.PACKAGE,
    };

    const dbNewServer = await prisma.gameServer.create({
        data: {
            status: 'CREATED',
            backupCount: preOptions.featureLimits.backups,
            cpuPercent: preOptions.limits.cpu,
            diskMB: preOptions.limits.disk,
            price: serverOrder.price,
            ramMB: preOptions.limits.memory,
            expires: serverOrder.expiresAt,
            userId: serverOrder.user.id,
            gameDataId: serverOrder.creationGameData.id,
            locationId: serverOrder.creationLocation.ptLocationId,
            gameConfig: serverOrder.gameConfig || undefined,
            name: serverName,
            type: enumMap[serverOrder.type]
        },
    });

    let newServer: Server | null = null;
    try {
        logger.info(`Creating Pterodactyl server for order ${order.id}`, 'GAME_SERVER', {
            userId: serverOrder.user.id,
            gameServerId: dbNewServer.id,
            details: { options }
        });


        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                newServer = await pt.createServer({ ...options, skipScripts: true });
                logger.info(`Pterodactyl server creation succeeded on attempt ${attempt}`, 'GAME_SERVER', {
                    userId: serverOrder.user.id,
                    gameServerId: dbNewServer.id,
                    details: { attempt },
                });
                break;
            } catch (error) {
                const errText = error instanceof Error ? (error.stack || error.message) : JSON.stringify(error);
                logger.error(`Pterodactyl server creation failed on attempt ${attempt}`, 'GAME_SERVER', {
                    userId: serverOrder.user.id,
                    gameServerId: dbNewServer.id,
                    details: { attempt, error: errText },
                });
                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                } else {
                    throw new Error(`Failed to create Pterodactyl server after ${maxRetries} attempts: ${errText}. Server details: name=${serverName}, gameDataId=${serverOrder.creationGameData.id}, locationId=${serverOrder.creationLocation.ptLocationId}, userId=${serverOrder.user.id}, dbServerId=${dbNewServer.id}`);
                }
            }
        }

        if (newServer === null || newServer === undefined) {
            throw new Error('Pterodactyl server creation returned null. This exception should never throw.');
        }

        logger.info(`Pterodactyl server created: ${newServer.identifier}`, 'GAME_SERVER', {
            userId: serverOrder.user.id,
            gameServerId: dbNewServer.id,
            details: { ptServerId: newServer.identifier, ptAdminId: newServer.id }
        });

        await prisma.gameServer.update({
            where: { id: dbNewServer.id },
            data: {
                ptServerId: newServer.identifier,
                ptAdminId: newServer.id,
            },
        });

        // Wait for server to be fully initialized before port corrections
        await new Promise(resolve => setTimeout(resolve, 2000));

        await correctPortsForGame(newServer.identifier, serverOrder.creationGameData.id, serverOrder.user.ptKey);

        // Wait for port corrections to apply
        await new Promise(resolve => setTimeout(resolve, 500));

        const scriptsEnabled = await enableServerInstallScripts(
            newServer.id,   // Is Admin Id
        );

        if (!scriptsEnabled) {
            throw new Error('Failed to enable install scripts');
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        logger.info(`Triggering install script for server ${newServer.identifier}`, 'GAME_SERVER', {
            userId: serverOrder.user.id,
            gameServerId: dbNewServer.id
        });

        await reinstallPTServerOnly(
            newServer.identifier,
            serverOrder.user.ptKey,
            false,
        );

        logger.info(`Server provisioning completed for ${newServer.identifier}`, 'GAME_SERVER', {
            userId: serverOrder.user.id,
            gameServerId: dbNewServer.id
        });

        return newServer.identifier;
    } catch (err) {
        const errorText = err instanceof Error ? err.stack || err.message : JSON.stringify(err);
        const updated = await prisma.gameServer.update({
            where: { id: dbNewServer.id },
            data: {
                status: 'CREATION_FAILED',
                errorText,
            },
        });

        // logger.fatal(`Failed to create Pterodactyl server for orderId: ${serverOrder.id}`, 'GAME_SERVER', { gameServerId: dbNewServer.id, userId: serverOrder.user.id, details: { errorText } });
        throw err;
    } finally {
        await prisma.gameServerOrder.update({
            where: {
                id: serverOrder.id,
            },
            data: {
                gameServerId: dbNewServer.id,

            },
        });
    }

}
