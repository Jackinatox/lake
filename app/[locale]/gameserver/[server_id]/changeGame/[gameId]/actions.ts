"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma"
import { headers } from "next/headers"
import type { GameConfig } from "@/models/config"

interface SubmitGameChangeInput {
    serverId: string
    gameId: number
    gameConfig: GameConfig
}

export async function submitGameChangeRequest({
    serverId,
    gameId,
    gameConfig,
}: SubmitGameChangeInput) {
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new Error("Not authenticated")
    }

    const gameServer = await prisma.gameServer.findFirst({
        where: {
            ptServerId: serverId,
            userId: session.user.id,
            status: {
                notIn: ["CREATION_FAILED", "DELETED"],
            },
        },
        include: {
            gameData: {
                select: {
                    name: true,
                },
            },
        },
    })

    if (!gameServer) {
        throw new Error("Server not found")
    }

    console.log(JSON.stringify(gameConfig, null, 2))
    return

    const gameData = await prisma.gameData.findUnique({
        where: { id: gameId },
        select: { name: true },
    })

    // Intentionally keep the action side-effect free for now.
    // We'll rely on downstream automation to pick up the payload.
    console.info("[change-game] request", {
        serverId,
        userId: session.user.id,
        fromGame: gameServer.gameData?.name,
        toGame: gameData?.name,
        config: gameConfig,
    })

    return {
        success: true,
    }
}
