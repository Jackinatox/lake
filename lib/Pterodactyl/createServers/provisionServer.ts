import { calcBackups, calcDiskSize } from "@/lib/GlobalFunctions/ptResourceLogic";
import { prisma } from "@/prisma";
import { NewServerOptions, Server } from "@avionrx/pterodactyl-js";
import { createPtClient } from "@/lib/Pterodactyl/ptAdminClient";
import { GameServerOrder } from "@prisma/client";
import { SatisfactoryConfig } from "@/models/gameSpecificConfig/SatisfactoryConfig";

const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export async function provisionServer(order: GameServerOrder) {
    const serverOrder = await prisma.gameServerOrder.findUnique({ where: { id: order.id }, include: { user: true, creationGameData: true, creationLocation: true } });
    const pt = createPtClient();

    console.log('user id: ', serverOrder.user.ptUserId)
    const gameConfig = JSON.parse(serverOrder.gameConfig as any);
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
        case 1: //Minecraft
            switch (parseInt(gameConfig.eggId)) {
                case 2: // Vanilla
                    startAndVars = {
                        environment: {
                            MINECRAFT_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar'
                        },
                        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}',
                    };
                    break;
                case 3: // Forge
                    startAndVars = {
                        environment: {
                            MINECRAFT_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar',
                            BUILD_TYPE: 'recommended'
                        },
                        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true $( [[  ! -f unix_args.txt ]] && printf %s "-jar {{SERVER_JARFILE}}" || printf %s "@unix_args.txt" )'

                    };
                    break;
                case 1: // Paper
                    startAndVars = {
                        environment: {
                            MINECRAFT_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar',
                            BUILD_NUMBER: 'latest'
                        },
                        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}'
                    };
                    break;
                case 16: // Fabric
                    startAndVars = {
                        environment: {
                            MC_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar',
                            FABRIC_VERSION: 'latest',
                            LOADER_VERSION: 'latest'
                        },
                        startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}'
                    };
                    break;
            }
            break;
        case 2: // Satisfactory
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

    options = {
        name: serverOrder.creationGameData.name + " Gameserver",
        ...preOptions,
        ...startAndVars
    };

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
            gameDataId: serverOrder.creationGameDataId,
            locationId: serverOrder.creationLocation.ptLocationId,
            gameConfig: serverOrder.gameConfig,
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