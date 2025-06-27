import { calcBackups, calcDiskSize } from "@/lib/globalFunctions";
import { prisma } from "@/prisma";
import { NewServerOptions } from "@avionrx/pterodactyl-js";
import { createPtClient } from "@/lib/Pterodactyl/ptAdminClient";

const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

import { ServerOrder } from "@prisma/client";

export async function provisionServer(order: ServerOrder) {
    const intentDb = await prisma.serverOrder.findUnique({ where: { id: order.id }, include: { user: true, gameData: true, location: true } });
    const pt = createPtClient();

    const ptUser = await fetch(`${panelUrl}/api/client/account`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${intentDb.user.ptKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
        .then((data) => data.json())
        .then((data) => parseInt(data.attributes.id));

    console.log('user id: ', ptUser)
    const gameConfig = intentDb.gameConfig as any;
    console.log(intentDb.gameData.id, ' ', parseInt(gameConfig.flavorId));

    let options: NewServerOptions;
    let preOptions = {
        user: ptUser,
        limits: {
            cpu: intentDb.cpuPercent,
            disk: calcDiskSize(intentDb.cpuPercent, intentDb.ramMB),
            memory: intentDb.ramMB,
            io: 500,
            swap: 0
        },
        egg: gameConfig.eggId,
        startWhenInstalled: false,
        outOfMemoryKiller: false,
        featureLimits: {
            allocations: 1,
            backups: calcBackups(intentDb.cpuPercent, intentDb.ramMB),
            databases: 0,
            split_limit: 0
        },
        deploy: {
            dedicatedIp: false,
            locations: [intentDb.location.ptLocationId],
            portRange: []
        }
    };


    let startAndVars;
    switch (intentDb.gameData.id) {
        case 1: //Minecraft
            switch (parseInt(gameConfig.eggId)) {
                case 1: // Vanilla
                    startAndVars = {
                        environment: {
                            MINECRAFT_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar'
                        },
                        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}'
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
                name: 'Minecraft-Server',
                ...preOptions,
                ...startAndVars
            };

            const newServer = await pt.createServer(options);
            await prisma.serverOrder.update({
                where: {
                    id: order.id,
                },
                data: {
                    serverId: newServer.identifier,
                    status: "CREATED"
                }
            })

            break;
        default:
            throw new Error('No Handler for this GameServer')

    }

}