import { calcBackups, calcDiskSize } from "@/lib/globalFunctions";
import { prisma } from "@/prisma";
import { NewServerOptions } from "@avionrx/pterodactyl-js";
import { createPtClient } from "@/lib/Pterodactyl/ptAdminClient";

const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export async function provisionServer(intent: number) {
    const intentDb = await prisma.serverIntend.findUnique({ where: { id: intent }, include: { user: true, gameData: true, location: true } });
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


    let envVars;
    switch (intentDb.gameData.id) {
        case 1: //Minecraft
            switch (parseInt(gameConfig.eggId)) {
                case 1: // Vanilla
                    envVars = {
                        MINECRAFT_VERSION: gameConfig.version,
                        SERVER_JARFILE: 'server.jar'
                    };
                    break;
                case 2: // Forge
                    envVars = {
                        MINECRAFT_VERSION: gameConfig.version,
                        SERVER_JARFILE: 'server.jar',
                        BUILD_TYPE: 'recommended'
                    };
                    break;
                case 3: // Paper
                    envVars = {
                        MINECRAFT_VERSION: gameConfig.version,
                        SERVER_JARFILE: 'server.jar',
                        BUILD_NUMBER: 'latest'
                    };
                    break;
            }
            options = {
                ...preOptions,
                name: 'Minecraft-Server',
                environment: envVars,
                startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}',
            };

            const newServer = await pt.createServer(options);
            await prisma.serverIntend.update({
                where: {
                    id: intent,
                },
                data: {
                    serverId: newServer.identifier
                }
            })

            // switch (parseInt(gameConfig.eggId)) {
            //     case 3: // Paper

            //         const newServer = await pt.createServer(options);
            //         await prisma.serverIntend.update({
            //             where: {
            //                 id: intent,
            //             },
            //             data: {
            //                 serverId: newServer.identifier
            //             }
            //         })

            //         break;
            // }

            break;
        default:
            throw new Error('No Handler for this GameServer')

    }

}