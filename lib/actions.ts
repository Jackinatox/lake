"use server"

// import { getServerClient } from "@/lib/supabase"
import { createClient } from "@/utils/supabase/client";
import { prisma } from "@/prisma";

export async function fetchPerformanceGroups() {
  const data = await prisma.location.findMany({ 
    include: {
      cpu: true,
      ram: true,
    },
    where: {
      enabled: true
    }

  })

  return data;
}

export async function fetchGames(gameId: number){
  const data = await prisma.gameData.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      name: true,
      data: true
    }
  });

  if (!data) {
    console.error("Error fetching games: Game not found");
    return null;
  }

  return data;
}

export async function fetchGameFlavors(gameId: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from("game_flavors").select("*").eq("game_id", gameId)

  if (error) {
    console.error("Error fetching game flavors:", error)
    throw new Error("Failed to fetch game flavors")
  }

  return data
}

export async function fetchGameVersions(gameFlavorId: number) {
  const supabase = createClient();
  const { data, error } = await supabase.from("game_versions").select("*").eq("game_flavor_id", gameFlavorId)

  if (error) {
    console.error("Error fetching game versions:", error)
    throw new Error("Failed to fetch game versions")
  }

  return data
}

