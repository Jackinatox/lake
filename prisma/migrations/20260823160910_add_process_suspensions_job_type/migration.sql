-- AlterEnum
-- The worker's ProcessSuspensions job records its JobRun/WorkerLog rows under this type,
-- so the lifecycle jobs (EXPIRE_SERVERS / DELETE_SERVERS) stay readable on their own.
ALTER TYPE "WorkerJobType" ADD VALUE 'PROCESS_SUSPENSIONS';
