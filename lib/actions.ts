"use server"

// import { getServerClient } from "@/lib/supabase"
import type { Game, PerformanceGroup, ServerConfig } from "@/models/config"
import { createClient } from "@/utils/supabase/client"

export async function fetchPerformanceGroups(): Promise<PerformanceGroup[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("Locations").select("*, CPU:CPU_Id (*), RAM:RAM_Id (*)").eq('Enabled', true).order('id');

  if (error) {
    console.error("Error fetching PFGroups:", error)
    throw new Error("Failed to fetch PFGroups")
  }

  return data as PerformanceGroup[]
}

export async function fetchGames(gameId: number): Promise<Game> {
  const supabase = createClient();
  const { data, error } = await supabase.from("GameData").select("*").eq('id', gameId).single();
  // console.log(data)

  // No cath here cause i need to knwo on the clkient if the game exists
  if (error) {
    console.error("Error fetching games:", error)
  }
  
  return data
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

