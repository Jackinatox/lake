"use server";

import { PerformanceGroup, ServerConf } from "@/models/cookies";
import { createClient } from "@/utils/supabase/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Builder } from "pterodactyl.js";

export async function bookServer(prev, formData: FormData): Promise<void> {
  const cpuCores = Number(formData.get("cpuCores"));
  const ramSize = Number(formData.get("ramSize"));
  const selectedPlan = formData.get("performanceGroup") as PerformanceGroup;

  const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
  const apiKey = process.env.PTERODACTYL_API_KEY;

  const supabase = await createClient();
  const ptAdmin = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) {
    const serverConfig: ServerConf = {
      CPU: cpuCores,
      RAM: ramSize,
      Backups: 2,
      Disk: 20480,
      pGroup: selectedPlan,
    };

    ptAdmin.createServer({ name: "", user });

    console.log(serverConfig);
    redirect("/");
  } 
}
