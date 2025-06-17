import { calcBackups, calcDiskSize } from "@/lib/globalFunctions";
import { bookPaper } from "@/lib/Pterodactyl/createServers/minecraft";
import { createPtClient } from "@/lib/Pterodactyl/ptAdminClient";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import { NewServerOptions } from "@avionrx/pterodactyl-js";
import { NextRequest } from "next/server";

const endpointSecret = process.env.webhookSecret;
const panelUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export async function POST(req: NextRequest) {
    const body = await req.text()
    let event;


    if (endpointSecret) {
        const signature = req.headers.get('stripe-signature');
        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                endpointSecret
            );
            console.log(`Webhook event: ${event}`)
        }
        catch (error) {
            console.error('Webhook signature failed: ', error);
            return new Response('Webhook signature verification failed', {
                status: 400
            });
        }

        const stripeIntent = event.data.object;

        switch (event.type) {
            case 'payment_intent.succeeded':
                // console.log(`PaymentIntent for`, intent, `successful`);

                // Provision Server

                break;

            case 'checkout.session.completed':
                // console.log(`Session complete: `, intent);

                const serverIntentId = parseInt(stripeIntent.metadata.serverIntend);
                console.log('ServerIntend: ', stripeIntent);

                await prisma.serverIntend.update({
                    where: {
                        id: serverIntentId,
                    },
                    data: {
                        stripeSession: stripeIntent.id
                    }
                })

                provisionServer(serverIntentId)

                break;
            default:
                console.log(`Unhandeld Webhook type: ${event.type}`)
        }
        return new Response('Success', { status: 200 });
    }
}

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
    switch (intentDb.gameData.id) {
        case 1: //Minecraft
            switch (parseInt(gameConfig.eggId)) {
                case 3: // Paper
                    const options: NewServerOptions = {
                        name: 'Minecraft-Server',
                        user: ptUser,
                        limits: {
                            cpu: intentDb.cpuPercent,
                            disk: calcDiskSize(intentDb.cpuPercent, intentDb.ramMB),
                            memory: intentDb.ramMB,
                            io: 500,
                            swap: 0
                        },
                        egg: gameConfig.eggId,
                        environment: {
                            MINECRAFT_VERSION: gameConfig.version,
                            SERVER_JARFILE: 'server.jar',
                            BUILD_NUMBER: 'latest'
                        },
                        startWhenInstalled: false,
                        outOfMemoryKiller: false,
                        image: 'ghcr.io/pterodactyl/yolks:java_17',
                        startup: 'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}',
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
                    console.log(options)
                    const newServer = await pt.createServer(options);
                    await prisma.serverIntend.update({
                        where: {
                            id: intent,
                        },
                        data: {
                            serverId: newServer.identifier
                        }
                    })

                    break;
            }

            break;
        default:
            throw new Error('No Handler for this GameServer')

    }

}