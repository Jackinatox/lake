import { logger } from "@/lib/logger";
import { env } from "next-runtime-env";

export default async function deleteServerAdmin(ptAdminId: number) {
    const apiKey = env("PTERODACTYL_API_KEY");
    const baseUrl = env("NEXT_PUBLIC_PTERODACTYL_URL");

    if (!apiKey || !baseUrl) {
        throw new Error("Pterodactyl configuration is missing");
    }

    logger.info(`Deleting server with Pterodactyl Admin ID: ${ptAdminId}`, "GAME_SERVER");

    const response = await fetch(`${baseUrl}/api/application/servers/${ptAdminId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete server: ${errorData.errors ? JSON.stringify(errorData.errors) : response.statusText}`);
    }

    return true;
}
