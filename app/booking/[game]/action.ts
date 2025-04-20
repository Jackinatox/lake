"use server";

import { calcBackups, calcDiskSize, getEggId } from "@/lib/globalFunctions";
import { PerformanceGroup, ServerConf } from "@/models/cookies";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
// import { Builder, Server } from "@avionrx/pterodactyl-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Builder, Server } from "pterodactyl.js";

export async function bookServer(prev, formData: FormData) {
  const gameName = formData.get('game').toString();
  const cpuCores = Number(formData.get("cpuCores"));
  const ramSize = Number(formData.get("ramSize"));
  const selectedPlan = formData.get("performanceGroup") as PerformanceGroup;

  const PTUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

  let server: Server;

  try {
    const supabase = await createClient();
    const ptAdmin = new Builder()
      .setURL(PTUrl)
      .setAPIKey(process.env.PTERODACTYL_API_KEY)
      .asAdmin();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    const ptUser = user?.user_metadata?.ptUser;

    if (user && ptUser) {
      const serverConfig: ServerConf = {
        CPU: cpuCores * 100,
        RAM: ramSize * 1024,
        Backups: calcBackups(cpuCores * 100, ramSize * 1024),
        Disk: calcDiskSize(cpuCores * 100, ramSize * 1024),
        pGroup: selectedPlan,
        Allocations: 2,
        EggId: getEggId(gameName),
      };

      // const test = await ptAdmin.getNodes();
      // console.log(serverConfig);
      // return;

      server = await ptAdmin.createServer({
        name: "serverino",
        user: ptUser,
        limits: {
          cpu: serverConfig.CPU,
          disk: serverConfig.Disk,
          io: 500,
          memory: serverConfig.RAM,
          swap: 500,
        },
        egg: 5,
        environment: {
          VANILLA_VERSION: "1.20.4",
          SERVER_JARFILE: "server.jar",
        },
        startWhenInstalled: true,
        featureLimits: {
          allocations: serverConfig.Allocations,
          backups: 5,
          // backups: serverConfig.Backups,
          databases: 0,
          // split_limit: 0,
        },
        startup: "java -Xms128M -XX:MaxRAMPercentage=99.0 -jar {{SERVER_JARFILE}} nogui",
        image: "ghcr.io/pterodactyl/yolks:java_21",
        deploy: { dedicatedIp: false, locations: [3, 5], portRange: [] },
      });
      // console.log('server:', server);
      const gotten = await ptAdmin.getServer(server.identifier);
      console.log('gotteb: ', gotten);
      // revalidatePath("/");
    } else {
      console.error("User not found or doesnt ");
      return 'An error in our auth-logik occured. We will fix it as fast as possible';
      //TODO: Logtail Log
    }
  } catch (e) {
    console.error('Exception: ', e);
    return 'An Error occured. We will fix it as fast as possible. Try again later';
  }

  encodedRedirect('success', `/gameserver/${server.identifier}`, 'Server created Successfully');
}
