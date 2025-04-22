"use server";

import { PerformanceGroup, PTServerConf } from "@/models/Pterodactyl/ServerModel";
// import { PerformanceGroup, ServerConf } from "@/models/cookies";
import { createClient } from "@/utils/supabase/server";
import { Builder } from "@avionrx/pterodactyl-js";
import { revalidatePath } from "next/cache";

export async function bookServer(prev, formData: FormData): Promise<void> {
  const cpuCores = Number(formData.get("cpuCores"));
  const ramSize = Number(formData.get("ramSize"));
  const selectedPlan = formData.get("performanceGroup") as PerformanceGroup;

  const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

  const supabase = await createClient();
  const ptAdmin = new Builder()
    .setURL(url)
    .setAPIKey(process.env.PTERODACTYL_API_KEY)
    .asAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const ptUser = user?.user_metadata?.ptUser;

  if (user && ptUser) {
    const serverConfig: PTServerConf = {
      cpu: cpuCores,
      ram: ramSize,
      disk: 20480,
      allocations: 5,
      backup: 2,
      performanceGroup: selectedPlan,
    };
    try {
      // const test = await ptAdmin.get();
      // console.log(test);

      
      const server = await ptAdmin.createServer({
        name: "serverino",
        user: ptUser,
        limits: {
          cpu: serverConfig.cpu,
          disk: serverConfig.disk,
          io: 500,
          memory: serverConfig.ram,
          swap: 500,
        },
        egg: 5,
        environment: { VANILLA_VERSION: "1.20.4", SERVER_JARFILE: "server.jar" },
        featureLimits: { allocations: serverConfig.allocations, backups: serverConfig.backup, databases: 0, split_limit: 0 },
        startup: "java",
        image: 'ghcr.io/pterodactyl/yolks:java_21',
        deploy: { dedicatedIp: false, locations: [3, 5], portRange: ['2002'] }
      });
    } catch (e) {
      console.error(e);
    }
    revalidatePath("/");
  }
}
