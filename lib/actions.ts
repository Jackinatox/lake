"use server"

import { prisma } from "@/prisma";

export async function fetchPerformanceGroups() {
  const data = await prisma.location.findMany({ 
    include: {
      cpu: true,
      ram: true, 
    },
    where: {
      enabled: true
    },
    orderBy: {
      id: 'asc'
    }

  })

  return data;
}

export async function fetchGames(gameId: number){
  return await prisma.gameData.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      name: true,
      data: true
    }
  });
}

