"use server";

import { auth } from "@/auth";
import { calcBackups, calcDiskSize } from "@/lib/globalFunctions";
import { waitForServerInstallation } from "@/lib/Pterodactyl/checkServerReady";
import { ServerConf } from "@/models/cookies";
import { prisma } from "@/prisma";
import { Builder, Server } from "@avionrx/pterodactyl-js";
import { redirect } from "next/navigation";

export async function bookServer(serverData: any) {
  const cpuCores = serverData.hardwareConfig.cpuCores;
  const ramSize = serverData.hardwareConfig.ramGb;
  const selectedPlan = serverData.hardwareConfig.pfGroupId;
  const eggId = serverData.gameConfig.eggId;
  console.log(serverData)

  let server: Server;

  try {
    const ptAdmin = new Builder()
      .setURL(process.env.NEXT_PUBLIC_PTERODACTYL_URL)
      .setAPIKey(process.env.PTERODACTYL_API_KEY)
      .asAdmin();

    const user = await auth();

    

    const ptUser = await prisma.user.findUnique({
      where: {id: user.user.id}
    })

    if (user && ptUser) {
      const serverConfig: ServerConf = {
        CPU: cpuCores * 100,
        RAM: ramSize * 1024,
        Backups: calcBackups(cpuCores * 100, ramSize * 1024),
        Disk: calcDiskSize(cpuCores * 100, ramSize * 1024),
        pGroup: selectedPlan,
        Allocations: 2,
        EggId: eggId,
      };

      // const test = await ptAdmin.getNodes();
      // console.log(serverConfig);
      // return;
  

      server = await ptAdmin.createServer({
        name: "serverino",
        user: ptUser.ptUser,
        limits: {
          cpu: serverConfig.CPU,
          disk: serverConfig.Disk,
          io: 500,
          memory: serverConfig.RAM,
          swap: 500,
        },
        egg: serverConfig.EggId,
        environment: {
          MC_VERSION: serverData.gameConfig.version,
          SERVER_JARFILE: "server.jar",
        },
        startWhenInstalled: true,
        featureLimits: {
          allocations: serverConfig.Allocations,
          backups: serverConfig.Backups,
          databases: 0,
          split_limit: 0,
        },
        startup: "java -Xms128M -XX:MaxRAMPercentage=99.0 -jar {{SERVER_JARFILE}} nogui",
        image: "ghcr.io/pterodactyl/yolks:java_21",
        deploy: { dedicatedIp: false, locations: [3, 5], portRange: [] },
      });
      // console.log('server:', server);
      await waitForServerInstallation(server.identifier);

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

  redirect(`/gameserver/${server.identifier}`);
}
