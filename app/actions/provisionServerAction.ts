"use server"

import { provisionServer as _provisionServer } from "../webhook/route";

export async function provisionServerAction(intentId: number) {
  try {
    const result = await _provisionServer(intentId);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error?.message || String(error) };
  }
}
