import express from 'express';
import { runExpireServers } from './jobs/ExpireServers';
import { runDeleteServers } from './jobs/DeleteServers';
import { runGenerateExpiryEmails } from './jobs/Reminder';
import { runGenerateDeletionEmails } from './jobs/DeletionReminder';
import { runSendEmails } from './jobs/sendEmails';
import { CronJob } from 'cron';
import { checkFactorioNewVersion } from './jobs/checkNewVersions/Factorio/Factorio';
import { verifyEnvVars } from './lib/startup';

await verifyEnvVars()

const app = express();
const port = 8080;

console.log('Worker starting...');
console.log(`Environment: ${process.env.NODE_ENV || 'Node env nicht gefunden'}`);

// Job status tracking
interface JobStatus {
    running: boolean;
    lastRun?: string;
    lastError?: string;
    runCount: number;
}

const jobStatus: Record<string, JobStatus> = {
    ExpireServers: { running: false, runCount: 0 },
    DeleteServers: { running: false, runCount: 0 },
    GenerateExpiryEmails: { running: false, runCount: 0 },
    GenerateDeletionEmails: { running: false, runCount: 0 },
    SendEmails: { running: false, runCount: 0 },
    // Added job status for version checks
    CheckNewVersions: { running: false, runCount: 0 },
};

// Helper to run a job safely
async function runJob(name: string, jobFn: () => Promise<any>) {
    if (jobStatus[name]?.running) {
        console.log(`${name} is already running, skipping...`);
        return;
    }

    jobStatus[name] = jobStatus[name] || { running: false, runCount: 0 };
    jobStatus[name].running = true;

    try {
        console.log(`[${new Date().toISOString()}] Starting ${name}...`);
        await jobFn();
        jobStatus[name].lastRun = new Date().toISOString();
        jobStatus[name].runCount += 1;
        jobStatus[name].lastError = undefined;
        console.log(`[${new Date().toISOString()}] ${name} completed`);
    } catch (error) {
        jobStatus[name].lastError = error instanceof Error ? error.message : JSON.stringify(error);
        console.error(`[${new Date().toISOString()}] ${name} failed:`, JSON.stringify(error));
    } finally {
        jobStatus[name].running = false;
    }
}

// Schedule jobs
const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;

const hourlyCron = CronJob.from({
    cronTime: '0 0 * * * *', // Run at the start of every hour (HH:00:00)
    onTick: async () => {
        await runJob('CheckNewVersions', checkFactorioNewVersion);
    },
    start: true,
    timeZone: 'Europe/Berlin',
});

// Run all jobs once on startup (after a short delay)
setTimeout(async () => {
    console.log('Running initial job execution...');
    await Promise.all([
        runJob('ExpireServers', runExpireServers),
        runJob('DeleteServers', runDeleteServers),
        runJob('GenerateExpiryEmails', runGenerateExpiryEmails),
        runJob('GenerateDeletionEmails', runGenerateDeletionEmails),
        runJob('SendEmails', runSendEmails),
        runJob('CheckNewVersions', checkFactorioNewVersion),
    ]);
    console.log('Initial job execution complete');
}, 5000);

// Schedule recurring jobs
const intervals: NodeJS.Timeout[] = [];

// Every 1 minute
intervals.push(setInterval(() => runJob('ExpireServers', runExpireServers), ONE_MINUTE));
intervals.push(setInterval(() => runJob('DeleteServers', runDeleteServers), ONE_MINUTE));
intervals.push(setInterval(() => runJob('SendEmails', runSendEmails), ONE_MINUTE));

// Every 5 minutes
intervals.push(setInterval(() => runJob('GenerateExpiryEmails', runGenerateExpiryEmails), FIVE_MINUTES));
intervals.push(setInterval(() => runJob('GenerateDeletionEmails', runGenerateDeletionEmails), FIVE_MINUTES));

console.log('Jobs scheduled');

// API endpoints
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/status', (_, res) => {
    const jobs = Object.entries(jobStatus).map(([name, status]) => ({
        name,
        ...status,
    }));

    res.json({
        jobs,
        timestamp: new Date().toISOString(),
    });
});

const server = app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
    console.log('API started');
});

// Graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}. Closing server...`);

    // Clear all intervals
    for (const interval of intervals) {
        clearInterval(interval);
    }

    // Stop the cron job
    try {
        hourlyCron.stop();
    } catch (err) {
        console.warn('Failed to stop hourly cron:', err);
    }

    server.close(() => {
        console.log('Server closed. Bye!');
        process.exit(0);
    });

    // Force exit if shutdown hangs
    setTimeout(() => {
        console.warn('Shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10_000).unref();
};

process.once('SIGINT', gracefulShutdown);
process.once('SIGTERM', gracefulShutdown);
