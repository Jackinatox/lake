"use server"

import { prisma } from "@/prisma";
import { ServerConfig } from "./page";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function bookSerevrPayment(intendId: string) {
    const origin = (await headers()).get('origin')
    const userSesh = await auth();

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        customer_email: userSesh?.user.email,
        submit_type: 'pay',
        line_items: [{
                price_data:{
                    currency: 'eur',
                    product_data: {
                        name: 'Custom Game-Server'
                    },
                },
                quantity: 1
            }],
        mode: 'payment',
        return_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
    })
}

export async function createServerIntend(serverConfig: ServerConfig): Promise<string> {

    const session = await auth();

    if ((!session?.user) || serverConfig.hardwareConfig.cpuCores <= 0 || serverConfig.hardwareConfig.ramGb <= 0)
        return '';

    const pfGroup = await prisma.location.findUnique({
        where: { id: serverConfig.hardwareConfig.pfGroupId },
        include: {
            cpu: true,
            ram: true,
        }
    });

    const created = await prisma.serverIntend.create({
        data: {
            user: { connect: { email: session.user.email } },
            cpu: { connect: { id: pfGroup.cpuId } },
            ram: { connect: { id: pfGroup.ramId } },
            cpuPercent: serverConfig.hardwareConfig.cpuCores * 100,
            ramMB: serverConfig.hardwareConfig.ramGb * 1024,
            gameConfig: JSON.parse(JSON.stringify(serverConfig.gameConfig)),
            gameData: { connect: { id: serverConfig.gameConfig.gameId } }
        }
    });




    return created.id.toString();
}