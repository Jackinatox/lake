import { calcBackups, calcDiskSize } from "@/lib/GlobalFunctions/ptResourceLogic";
import { prisma } from "@/prisma";
import { NewServerOptions } from "@avionrx/pterodactyl-js";
import { createPtClient } from "@/lib/Pterodactyl/ptAdminClient";

const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

import { auth } from "@/auth";
import { GameServerOrder } from "@prisma/client";

export async function provisionServer(orderr: GameServerOrder) {
    const session = await auth();
    
    const serverOrder = await prisma.gameServerOrder.findUnique({ where: { id: orderr.id }, include: { user: true, creationGameData: true, creationLocation: true } });
    const pt = createPtClient();

    const ptUser = await fetch(`${panelUrl}/api/client/account`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${serverOrder.user.ptKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
        .then((data) => data.json())
        .then((data) => parseInt(data.attributes.id));

    console.log('user id: ', ptUser)
    const gameConfig = JSON.parse(serverOrder.gameConfig as any);
    console.log("GameeConfig: ", gameConfig);

    let options: NewServerOptions;
    let preOptions = {
        user: ptUser,
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
            allocations: 1,
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
                case 1: // Vanilla
                    startAndVars = {
                        environment: {
                            MINECRAFT_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar'
                        },
                        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}',
                    };
                    break;
                case 2: // Forge
                    startAndVars = {
                        environment: {
                            MINECRAFT_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar',
                            BUILD_TYPE: 'recommended'
                        },
                        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true $( [[  ! -f unix_args.txt ]] && printf %s "-jar {{SERVER_JARFILE}}" || printf %s "@unix_args.txt" )'
                        
                    };
                    break;
                case 3: // Paper
                    startAndVars = {
                        environment: {
                            MINECRAFT_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar',
                            BUILD_NUMBER: 'latest'
                        },
                        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}'
                    };
                    break;

                case 15: // Fabric
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
            options = {
                name: serverOrder.creationGameData.name + " Gameserver",
                ...preOptions,
                ...startAndVars
            };

            try {
                const newServer = await pt.createServer(options);
                const dbNewServer = await prisma.gameServer.create({
                    data: {
                        ptServerId: newServer.identifier,
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
            } catch (error) {
                await prisma.gameServer.update({
                    where: {
                        id: serverOrder.gameServerId,
                    },
                    data: {
                        status: "CREATION_FAILED",
                        errorText: error instanceof Error ? error.stack || error.message : JSON.stringify(error)
                    }
                });

                throw error;
            }

            break;
        default:
            throw new Error('No Handler for this GameServer')

    }

}