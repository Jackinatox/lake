"use server"

// import { getServerClient } from "@/lib/supabase"
import type { CpuType, PerformanceGroup, ServerConfig } from "@/models/config"
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

// export async function fetchCPUOptions(): Promise<CpuType[]> {
//   const supabase = createClient();
//   const { data, error } = await supabase.from("CPUs").select("*");

//   console.log('cpu types: ', data)

//   if (error) {
//     console.error("Error fetching CPU types:", error)
//     throw new Error("Failed to fetch CPU types")
//   }

//   return data
// }

// export async function fetchRamOptions() {
//   const supabase = createClient();
//   const { data, error } = await supabase.from("RAMs").select("*")

//   if (error) {
//     console.error("Error fetching RAM options:", error)
//     throw new Error("Failed to fetch RAM options")
//   }

//   return data
// }

export async function fetchDiskOptions() {
  const supabase = createClient();
  const { data, error } = await supabase.from("disk_options").select("*")

  if (error) {
    console.error("Error fetching disk options:", error)
    throw new Error("Failed to fetch disk options")
  }

  return data
}

export async function fetchGames() {
  const supabase = createClient();
  const { data, error } = await supabase.from("Games").select("*")
  console.log(data)
  if (error) {
    console.error("Error fetching games:", error)
    throw new Error("Failed to fetch games")
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

export async function submitServerConfig(config: ServerConfig) {
  const supabase = createClient();

  // In a real application, you would also validate the user's session here
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) throw new Error('Unauthorized');

  // const { hardwareConfig, gameConfig } = config

  // const { data, error } = await supabase
  //   .from("server_configurations")
  //   .insert({
  //     // user_id: user.id,
  //     cpu_type_id: hardwareConfig.cpuTypeId,
  //     cpu_cores: hardwareConfig.cpuCores,
  //     ram_gb: hardwareConfig.ramGb,
  //     disk_gb: hardwareConfig.diskGb,
  //     game_id: gameConfig.gameId,
  //     game_flavor_id: gameConfig.gameFlavorId,
  //     game_version_id: gameConfig.gameVersionId,
  //     additional_config: gameConfig.additionalConfig || {},
  //     total_price: hardwareConfig.totalPrice,
  //   })
  //   .select()
  // //   .single()

  // if (error) {
  //   console.error("Error submitting server configuration:", error)
  //   throw new Error("Failed to submit server configuration")
  // }

  // return data
}
