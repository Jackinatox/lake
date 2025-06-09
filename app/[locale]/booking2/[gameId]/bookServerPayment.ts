"use server"

import { ServerConfig } from "./page";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";

export async function bookServerPayment(intendId: string): Promise<string> {
    const origin = (await headers()).get('origin')
    const userSesh = await auth();

    if (!userSesh.user)
        return '';

    const intend = await prisma.serverIntend.findUnique({
        where: {
            id: parseInt(intendId)
        }
    })

    const session = await stripe.checkout.sessions.create({
        line_items: [{
            price_data: {
                currency: 'eur',
                product_data: {
                    name: 'Custom GameServer',
                },
                unit_amount: intend.price,
            },
            quantity: 1,
        }],
        metadata: {
            serverIntend: intend.id,
            user: userSesh.user.id
        },
        customer_email: userSesh.user.email,
        mode: 'payment',
        ui_mode: 'embedded',
        return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
    });

    return session.client_secret;


    // const paymentIntent = await stripe.paymentIntents.create({
    //     amount: intend.price,
    //     currency: 'eur',
    //     automatic_payment_methods: {
    //         enabled: true,
    //     },
    // });

    // return paymentIntent.client_secret;
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
            gameData: { connect: { id: serverConfig.gameConfig.gameId } },
            price: (pfGroup.cpu.pricePerCore * serverConfig.hardwareConfig.cpuCores +
                pfGroup.ram.pricePerGb * serverConfig.hardwareConfig.ramGb) * 100
        }
    });

    // console.log(
    //     created
    // )




    return created.id.toString();
}