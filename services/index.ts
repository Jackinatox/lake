import { Cron } from "croner";
import { findExpired } from "./expiredServers/maintenance";
import { workerState } from "./expiredServers/status";

new Cron("*/15 * * * *", async () => {
    console.log("[cron] Running maintenance");
    await findExpired();
});

// @ts-expect-error Bun global is available when running with Bun
Bun.serve({
    port: 4000,
    async fetch(req) {
        const url = new URL(req.url);
        console.log(url.href);

        if (url.pathname === "/run" && req.method === "POST") {
            findExpired();

            return new Response(JSON.stringify(workerState.expiredServers), {
                status: 200,
            }); // 202 = Accepted (processing in background)
        }

        if (req.method === "GET" && url.pathname === "/status") {
            return Response.json({
                workerState,
            });
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log("Maintenance service started on :4000");
