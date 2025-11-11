import Bree from "bree";
import express from "express";
import type { JobStatusMap } from "./workerTypes";
import path from "path";

const app = express();
const port = 8080;

console.log("Worker starting...");
console.log(`Environment: ${process.env.NODE_ENV || "Node env nicht gefunden"}`);
console.log(`Starting Bree`);


const jobStatus: JobStatusMap = {};


const bree = new Bree({
    root: false, // Disable default job directory scanning
    jobs: [
        { name: "ExpireServers", interval: "1m", timeout: 0, path: path.join("jobs", "ExpireServers", "ExpireServers.ts") },
        { name: "GenerateExpiryEmails", interval: "5m", timeout: 0, path: path.join("jobs", "Reminder", "ExpiryEmails.ts") },
        { name: "DeleteServers", interval: "1m", timeout: 0, path: path.join("jobs", "DeleteServers", "DeleteServers.ts") },
        { name: "GenerateDeletionEmails", interval: "5m", timeout: 0, path: path.join("jobs", "DeletionReminder", "DeletionEmails.ts") },
        { name: "SendEmails", interval: "1m", timeout: 0, path: path.join("jobs", "sendEmails", "Emails.ts") },
    ],
    logger: {
        info: () => { },
        warn: console.warn,
        error: console.error
    }
});


bree.on('worker created', (name: string) => {
    jobStatus[name] = jobStatus[name] || { running: false, processed: 0, total: 0 };
    jobStatus[name].running = true;
});

bree.on('worker message', (name: string, message: any) => {
    if (!jobStatus[name]) jobStatus[name] = { running: false, processed: 0, total: 0 };

    if (typeof message.processed === 'number') {
        jobStatus[name].processed += message.processed;
        jobStatus[name].total = message.total;
    }

    console.log(`Job ${name} processed count: ${jobStatus[name].processed}`);
});

bree.on('worker deleted', (name: string) => {
    if (!jobStatus[name]) return;
    jobStatus[name].running = false;
    jobStatus[name].lastRun = new Date().toISOString();
});

bree.start();
console.log("Bree started");

console.log("Starting API");

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get('/status', (_, res) => {
    const jobs = Object.entries(jobStatus).map(([name, status]) => ({
        name,
        ...status
    }));
    
    res.json({
        jobs,
        timestamp: new Date().toISOString()
    });
});

const server = app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
    console.log("API starated");
});

let isShuttingDown = false;

const gracefulShutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}. Closing server...`);

    for (const [name, worker] of bree.workers) {
        worker.postMessage({ type: 'stop' });
    }

    await bree.stop();
    server.close(() => {
        console.log("Server closed. Bye!");
        process.exit(0);
    });
    // Force exit if shutdown hangs
    setTimeout(() => {
        console.warn("Shutdown timed out. Forcing exit.");
        process.exit(1);
    }, 10_000).unref();
};

process.once("SIGINT", gracefulShutdown);
process.once("SIGTERM", gracefulShutdown);
