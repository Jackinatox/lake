import { calcBackups, calcDiskSize } from "@/lib/GlobalFunctions/ptResourceLogic";
import { prisma } from "@/prisma";
import { NewServerOptions, Server } from "@avionrx/pterodactyl-js";
import { env } from 'next-runtime-env';
import { createPtClient } from "@/lib/Pterodactyl/ptAdminClient";
import { GameServerOrder } from "@prisma/client";
import { SatisfactoryConfig } from "@/models/gameSpecificConfig/SatisfactoryConfig";
import { buildMC_ENVs_and_startup } from "../buildMinecraftENVs";
import { MinecraftGameId, SatisfactoryGameId } from "@/app/GlobalConstants";

export async function provisionServer(order: GameServerOrder) {
    const panelUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const serverOrder = await prisma.gameServerOrder.findUnique({ where: { id: order.id }, include: { user: true, creationGameData: true, creationLocation: true } });
    const pt = createPtClient();

    if (!serverOrder || !serverOrder.creationGameData || !serverOrder.creationLocation) throw new Error(`No Server found for serverOrder: ${order.id}`)

    console.log('user id: ', serverOrder.user.ptUserId)
    const gameConfig = serverOrder.gameConfig as any;
    // console.log("GameConfig: ", gameConfig);

    let options: NewServerOptions;
    let preOptions = {
        user: serverOrder.user.ptUserId,
        limits: {
            cpu: serverOrder.cpuPercent,
            disk: calcDiskSize(serverOrder.cpuPercent, serverOrder.ramMB),
            memory: serverOrder.ramMB,
            io: 500,
            swap: 512
        },
        egg: gameConfig.eggId,
        startWhenInstalled: true,
        outOfMemoryKiller: false,
        featureLimits: {
            allocations: 2,
            backups: calcBackups(serverOrder.cpuPercent, serverOrder.ramMB),
            databases: 0,
            split_limit: 0
        },
        deploy: {
            dedicatedIp: false,
            locations: [serverOrder.creationLocation.ptLocationId],
            portRange: []
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
            console.log(satisfactoryConfig)
            startAndVars = {
                startup: './Engine/Binaries/Linux/*-Linux-Shipping FactoryGame ?listen -Port={{SERVER_PORT}} -ReliablePort={{RELIABLE_PORT}}',
                environment: {
                    SRCDS_BETAID: satisfactoryConfig.version === "experimental" ? "experimental" : "public",
                    MAX_PLAYERS: satisfactoryConfig.max_players,
                    NUM_AUTOSAVES: satisfactoryConfig.num_autosaves,
                    UPLOAD_CRASH_REPORT: satisfactoryConfig.upload_crash_report.toString(),
                    AUTOSAVE_INTERVAL : satisfactoryConfig.autosave_interval,
                    // HardCoded: 
                    RELIABLE_PORT: 8888,    // Will be replaced by 
                    SRCDS_APPID: 1690800,
                }
            }
            break;
        default:
            throw new Error('No Handler for this GameServer')
    }

    const serverName = serverOrder.creationGameData.name + " Gameserver";
    options = {
        name: serverName,
        ...preOptions,
        ...startAndVars
    } as NewServerOptions;

    const dbNewServer = await prisma.gameServer.create({
        data: {
            status: "CREATED",
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
        }
    });


    let newServer: Server;
    try {
        console.log(options)
        newServer = await pt.createServer(options);
        
        
    } catch (err) {
        const errorText = err instanceof Error ? err.stack || err.message : JSON.stringify(err);
        const updated = await prisma.gameServer.update({
            where: { id: dbNewServer.id },
            data: {
                status: "CREATION_FAILED",
                errorText,
            },
        });

        throw { message: updated.errorText ?? errorText, dbNewServerId: dbNewServer.id };
    }

    const dbUpdatedServer = await prisma.gameServer.update({
        where: { id: dbNewServer.id },
        data: {
            ptServerId: newServer.identifier,
            ptAdminId: newServer.id
        }
    });

    await prisma.gameServerOrder.update({
        where: {
            id: serverOrder.id,
        },
        data: {
            gameServerId: dbNewServer.id
        }
    })
}