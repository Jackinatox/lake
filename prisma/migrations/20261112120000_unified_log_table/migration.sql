-- One "Log" table for lake (APP) and worker (WORKER) log lines, replacing
-- "ApplicationLog" and "WorkerLog". Existing rows are copied over, oldest
-- first so the new ids stay chronological; indexes and foreign keys are added
-- after the copy because that is much faster than maintaining them per row.

-- CreateEnum
CREATE TYPE "LogSource" AS ENUM ('APP', 'WORKER');

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "source" "LogSource" NOT NULL,
    "level" "LogLevel" NOT NULL,
    "type" "LogType" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "instanceId" TEXT NOT NULL,
    "component" TEXT,
    "method" TEXT,
    "path" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "userId" TEXT,
    "gameServerId" TEXT,
    "jobRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- Copy data. Old worker rows had no category or instance: they become SYSTEM /
-- 'unknown'. Their job type now comes from "JobRun"; when a row had no job run,
-- its job type (and a legacy "jobRun" tag that differs from "jobRunId") is kept
-- in "details" so nothing is lost.
INSERT INTO "Log" (
    "source", "level", "type", "message", "details", "instanceId", "component",
    "method", "path", "userAgent", "ipAddress", "userId", "gameServerId", "jobRunId", "createdAt"
)
SELECT * FROM (
    SELECT
        'APP'::"LogSource", "level", "type", "message", "details", "instanceId", NULL::TEXT,
        "method", "path", "userAgent", "ipAddress", "userId", "gameServerId", NULL::TEXT, "createdAt"
    FROM "ApplicationLog"
    UNION ALL
    SELECT
        'WORKER'::"LogSource", w."level", 'SYSTEM'::"LogType", w."message",
        CASE
            WHEN extra = '{}'::jsonb THEN w."details"
            WHEN w."details" IS NULL THEN extra
            WHEN jsonb_typeof(w."details") = 'object' THEN w."details" || extra
            ELSE jsonb_build_object('value', w."details") || extra
        END,
        'unknown', NULL::TEXT,
        NULL, NULL, NULL, NULL, w."userId", w."gameServerId", w."jobRunId", w."createdAt"
    FROM "WorkerLog" w
    CROSS JOIN LATERAL (
        SELECT jsonb_strip_nulls(jsonb_build_object(
            'jobType', CASE WHEN w."jobRunId" IS NULL THEN w."jobType"::TEXT END,
            'jobRun', CASE WHEN w."jobRun" IS DISTINCT FROM w."jobRunId" THEN w."jobRun" END
        )) AS extra
    ) e
) AS rows ("source", "level", "type", "message", "details", "instanceId", "component",
           "method", "path", "userAgent", "ipAddress", "userId", "gameServerId", "jobRunId", "createdAt")
ORDER BY "createdAt", "source";

-- DropTable
DROP TABLE "WorkerLog";
DROP TABLE "ApplicationLog";

-- CreateIndex
CREATE INDEX "Log_createdAt_idx" ON "Log"("createdAt");
CREATE INDEX "Log_source_createdAt_idx" ON "Log"("source", "createdAt");
CREATE INDEX "Log_level_createdAt_idx" ON "Log"("level", "createdAt");
CREATE INDEX "Log_type_createdAt_idx" ON "Log"("type", "createdAt");
CREATE INDEX "Log_userId_idx" ON "Log"("userId");
CREATE INDEX "Log_gameServerId_idx" ON "Log"("gameServerId");
CREATE INDEX "Log_jobRunId_idx" ON "Log"("jobRunId");
CREATE INDEX "Log_path_method_idx" ON "Log"("path", "method");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Log" ADD CONSTRAINT "Log_gameServerId_fkey" FOREIGN KEY ("gameServerId") REFERENCES "GameServer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Log" ADD CONSTRAINT "Log_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "JobRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
