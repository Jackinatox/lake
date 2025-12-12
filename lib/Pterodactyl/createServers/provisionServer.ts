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
            const satisfactoryConfig = gameConfig.gameSpecificConfig as SatisfactoryConfig;
            console.log(satisfactoryConfig);
            startAndVars = {
                startup:
                    './Engine/Binaries/Linux/*-Linux-Shipping FactoryGame ?listen -Port={{SERVER_PORT}} -ReliablePort={{RELIABLE_PORT}}',
                environment: {
                    SRCDS_BETAID:
                        satisfactoryConfig.version === 'experimental' ? 'experimental' : 'public',
                    MAX_PLAYERS: satisfactoryConfig.max_players,
                    NUM_AUTOSAVES: satisfactoryConfig.num_autosaves,
                    UPLOAD_CRASH_REPORT: satisfactoryConfig.upload_crash_report.toString(),
                    AUTOSAVE_INTERVAL: satisfactoryConfig.autosave_interval,
                    // HardCoded:
                    RELIABLE_PORT: 8888, // Will be replaced by
                    SRCDS_APPID: 1690800,
                },
            };
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

    let newServer: Server;
    try {
        logger.info(`Creating Pterodactyl server for order ${order.id}`, 'GAME_SERVER', {
            userId: serverOrder.user.id,
            gameServerId: dbNewServer.id,
            details: { serverName, egg: gameConfig.eggId, options }
        });

        newServer = await pt.createServer({ ...options, skipScripts: true });

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
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(1)
        await correctPortsForGame(newServer.identifier, serverOrder.creationGameData.id, serverOrder.user.ptKey);
        console.log(2)
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(3)

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

        logger.fatal(`Failed to create Pterodactyl server for orderId: ${serverOrder.id}`, 'GAME_SERVER', { gameServerId: dbNewServer.id, userId: serverOrder.user.id, details: { errorText } });
        throw { message: updated.errorText ?? errorText, dbNewServerId: dbNewServer.id };
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
