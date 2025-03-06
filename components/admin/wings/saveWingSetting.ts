"use server";

import { checkIfAdmin } from "@/utils/supabase/checkIfUserIsAdmin";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function saveWingAction(previousState, formData: FormData) {
  const pxnode = formData.get("pxnode");
  const wingId = formData.get("wingId");
  const name = formData.get("name");

  if (!pxnode || !wingId || !name) {
    return { status: "fail", message: "Missing required form data" };
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key (⚠️ Only use server-side)
  );

  const supabaseUser = await createClient();

  const user = await supabaseUser.auth.getUser();

  if (user && checkIfAdmin(user.data.user.id)) {
    // validation
    console.log(formData);

    const req = supabase
      .from("ProxmoxNodes")
      .select("*")
      .eq("id", formData.get("pxnode"))
      .single();

    // console.log('pxNode: ', data, error);
    const wing = supabase
      .from("Wings")
      .select("*")
      .eq("PtWingId", formData.get("wingId"))
      .single();

    const { data, error } = await req;
    const { data: wData, error: wError } = await wing;

    console.log("wing: ", wData, wError);
    if (!error && !wError) {
      const { error: updateError } = await supabase
        .from("Wings")
        .update({ NodeId: formData.get("pxnode"), Name: formData.get("name") })
        .eq("PtWingId", formData.get("wingId"));

      console.log("update: ", updateError);
      if (!updateError) {
        revalidatePath("/");
        return { status: "ok", message: "wing updated" };
      }
    }
    return { status: "fail", message: "update to supabase failed" };
  } else {
    return { status: "fail", message: "not authenticated" };
  }
}

export default saveWingAction;
