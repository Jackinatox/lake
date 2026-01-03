import type { FactorioGameData, FactorioVersion } from "../../../models/Factorio";
import { prisma } from "../../../prisma";
import { compareVersions } from 'compare-versions';
import { logInfo, logError, logFatal, generateJobRunId } from '../../../lib/logger';
import { WorkerJobType } from '../../../client/generated/enums';
import { notifyNewVersion } from '../../../lib/notifications';

export async function checkFactorioNewVersion(): Promise<FactorioVersion | null> {
    const jobRun = generateJobRunId(WorkerJobType.CHECK_NEW_VERSIONS);

    try {
        await logInfo(
            WorkerJobType.CHECK_NEW_VERSIONS,
            `Job started`,
            { jobRun },
            { jobRun },
        );

        const latestOnlineVersion = await getLatestVersion(jobRun);
        const latestLocalVersion = await getLatestFromDB(jobRun);

        if (latestOnlineVersion && latestLocalVersion) {
            const compare = compareVersions(latestOnlineVersion.version, latestLocalVersion.version);
            if (compare != 0) {
                await logInfo(
                    WorkerJobType.CHECK_NEW_VERSIONS,
                    `New version available`,
                    { latestOnlineVersion, latestLocalVersion, jobRun },
                    { jobRun },
                );
                console.log(JSON.stringify(compare >= 0 ? latestOnlineVersion : latestLocalVersion));

                // Send notification about new version
                await notifyNewVersion({
                    gameName: 'Factorio',
                    oldVersion: latestLocalVersion.version,
                    newVersion: latestOnlineVersion.version,
                    branch: latestOnlineVersion.branch,
                });

                return latestOnlineVersion;
            } else {
                await logInfo(
                    WorkerJobType.CHECK_NEW_VERSIONS,
                    `No new version available`,
                    { local: latestLocalVersion.version, online: latestOnlineVersion.version, jobRun },
                    { jobRun },
                );
            }
        } else {
            await logError(
                WorkerJobType.CHECK_NEW_VERSIONS,
                `Failed to fetch a version.`,
                { latestOnlineVersion, latestLocalVersion, jobRun },
                { jobRun },
            );
            return null;
        }
    } catch (error) {
        await logFatal(
            WorkerJobType.CHECK_NEW_VERSIONS,
            `Error checking Factorio versions`,
            {
                error: error instanceof Error ? error.message : JSON.stringify(error),
                stack: error instanceof Error ? error.stack : undefined,
                jobRun,
            },
            { jobRun },
        );
    }

    return null;
}

async function getLatestVersion(jobRun: string): Promise<FactorioVersion | null> {
    try {
        const response = await fetch("https://factorio.com/api/latest-releases");
        const body = await response.json() as any;
        if (body && body.stable && body.stable.headless) {
            const comp = compareVersions(body.stable.headless, body.experimental.headless);
            return {
                branch: comp >= 0 ? "stable" : "experimental",
                version: comp >= 0 ? body.stable.headless : body.experimental.headless,
            };
        } else {
            await logError(
                WorkerJobType.CHECK_NEW_VERSIONS,
                `Failed to fetch latest Factorio version. Unexpected response body.`,
                { body, jobRun },
                { jobRun },
            );
        }
    } catch (error) {
        await logError(
            WorkerJobType.CHECK_NEW_VERSIONS,
            `Failed to fetch latest Factorio version.`,
            { error: error instanceof Error ? error.message : JSON.stringify(error), jobRun },
            { jobRun },
        );
    }
    return null;
}

async function getLatestFromDB(jobRun: string): Promise<FactorioVersion | null> {
    try {
        const db = await prisma.gameData.findFirstOrThrow({
            where: { name: 'Factorio' },
        });

        const gameData = db.data as FactorioGameData;

        if (gameData?.versions && gameData.versions.length > 0) {
            return gameData.versions[0] || null;
        }
    } catch (error) {
        await logError(
            WorkerJobType.CHECK_NEW_VERSIONS,
            `Failed to read Factorio data from DB.`,
            { error: error instanceof Error ? error.message : JSON.stringify(error), jobRun },
            { jobRun },
        );
    }

    return null;
}

