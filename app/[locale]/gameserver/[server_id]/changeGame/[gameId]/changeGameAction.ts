"use server"

import { auth } from "@/auth"
import { prisma } from "@/prisma"
import { headers } from "next/headers"
import type { GameConfig } from "@/models/config"
import type { GameData, GameServer } from "@prisma/client"
import { MinecraftConfig } from "@/models/gameSpecificConfig/MinecraftConfig"
import { MinecraftGameId, SatisfactoryGameId } from "@/app/GlobalConstants"
import { buildMC_ENVs_and_startup } from "@/lib/Pterodactyl/buildMinecraftENVs"
import { createPtUserClient } from "@/lib/Pterodactyl/ptUserClient"
import PTUserServerPowerAction from "@/lib/Pterodactyl/Functions/StopPTUserServer"
import ReinstallPTUserServer from "@/lib/Pterodactyl/Functions/ReinstallPTUserServer"

const ptUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
const ptAdminKey = process.env.PTERODACTYL_API_KEY;

interface SubmitGameChangeInput {
    serverId: string
    gameId: number
    gameConfig: GameConfig
}

export async function changeGame({
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

    const [gameServer, newGameData] = await Promise.all([
        prisma.gameServer.findFirst({
            where: {
                ptServerId: serverId,
                userId: session.user.id,
                status: {
                    notIn: ["CREATION_FAILED", "DELETED"],
                },
            }
        }),

        prisma.gameData.findUnique({ where: { id: gameId } })
    ]);

    if (!gameServer) {
        throw new Error("Server not found or wrong user")
    }

    if (!newGameData) {
        throw new Error("Selected game not found")
    }

    PTUserServerPowerAction(serverId, session.user.ptKey, 'kill');

    await new Promise(resolve => setTimeout(resolve, 200));    // Wait so the server is really killed

    const response = await fetch(`${ptUrl}/api/application/servers/${gameServer.ptAdminId}/startup`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ptAdminKey}`,
            'Accept': 'application/json',
        },
        body: JSON.stringify(await buildBody(gameConfig, newGameData)),
    }); 

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from Pterodactyl:", errorData);
        throw new Error(`Failed to change game: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    await prisma.gameServer.update({
        where: { id: gameServer.id },
        data: {
            gameDataId: newGameData.id,
            gameConfig: gameConfig as any,
        }
    });
    
    await new Promise(resolve => setTimeout(resolve, 200)); 
    const response2 = await ReinstallPTUserServer(serverId, session.user.ptKey);
    
    if (!response2.ok) {
        const errorData = await response2.json();
        console.error("Error response from Pterodactyl:", errorData);
        throw new Error(`Failed to restart server: ${response2.status} ${JSON.stringify(errorData)}`);
    }
    
    PTUserServerPowerAction(serverId, session.user.ptKey, 'start');
    
    return {
        success: true,
    }
}


async function buildBody(gameConfig: GameConfig, newGameData: GameData) {
    const plainBody = {
        skip_scripts: false,
        egg: gameConfig.eggId,
        image: gameConfig.dockerImage
    }

    let body;
    switch (newGameData.id) {
        case MinecraftGameId:
            body = buildMC_ENVs_and_startup(gameConfig.eggId, gameConfig.version);
            break;
        case SatisfactoryGameId:
            // Build body for game 2
            throw new Error("Not implemented yet");
            break;
        default:
            throw new Error("Unsupported game ID")
    }

    return { ...plainBody, ...body };
}


