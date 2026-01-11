import express from 'express';
import { verifyEnvVars } from './lib/startup';
import { CronScheduler } from './lib/cronScheduler';
import { QueueManager } from './lib/queueManager';
import { cronJobs } from './config/cronJobs';
import { queueWorkers } from './config/queueWorkers';
import { redisConnection } from './config/redis';

// ─────────────────────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────────────────────
await verifyEnvVars();

console.log('Worker starting...');
console.log(`Environment: ${process.env.NODE_ENV ?? 'development'}`);

// ─────────────────────────────────────────────────────────────
// Initialize Schedulers
// ─────────────────────────────────────────────────────────────
const cronScheduler = new CronScheduler('Europe/Berlin');
const queueManager = new QueueManager(redisConnection);

// Register cron jobs
cronScheduler.registerAll(cronJobs);
console.log(`Registered ${cronJobs.length} cron jobs`);

// Register queue workers (if any are defined)
if (queueWorkers.length > 0) {
    queueManager.registerAll(queueWorkers);
    console.log(`Registered ${queueWorkers.length} queue workers`);
}

// Run startup jobs after a short delay
setTimeout(async () => {
    console.log('Running startup jobs...');
    await cronScheduler.runStartupJobs(cronJobs);
}, 5000);

// ─────────────────────────────────────────────────────────────
// Express Server (Health Checks & Status)
// ─────────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT ?? 8080;

app.get('/', (_, res) => {
    res.json({ status: 'ok', service: 'lake-worker' });
});

app.get('/status', (_, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        cron: {
            jobs: cronScheduler.getStatus(),
        },
        queues: {
            workers: queueManager.getStatus(),
        },
    });
});

app.get('/health', (_, res) => {
    res.status(200).json({ healthy: true });
});

const server = app.listen(port, () => {
    console.log(`Health API listening on port ${port}`);
});

// ─────────────────────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────────────────────
let isShuttingDown = false;

async function gracefulShutdown(signal: NodeJS.Signals): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    // Stop accepting new requests
    server.close(() => {
        console.log('HTTP server closed');
    });

    // Stop cron jobs
    cronScheduler.stopAll();

    // Close queue workers (waits for active jobs to complete)
    await queueManager.closeAll();

    console.log('Shutdown complete. Bye!');
    process.exit(0);
}

// Force exit if shutdown takes too long
function forceExit(): void {
    setTimeout(() => {
        console.warn('Shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10_000).unref();
}

process.once('SIGINT', (signal) => {
    forceExit();
    gracefulShutdown(signal);
});

process.once('SIGTERM', (signal) => {
    forceExit();
    gracefulShutdown(signal);
});
