# Admin job status UI (`/admin/jobStatus`)

The admin job dashboard shows one card per job the external provisioning worker exposes,
plus the run history Lake stores itself. Neither side hardcodes a job list: cards come from
whatever the worker reports, run history comes from the `JobRun` / `WorkerLog` tables, and a
new worker job appears and can be triggered without touching Lake.

## Where the data comes from

Two independent sources, joined in the UI by job name:

- **The worker** (`WORKER_IP`), proxied by admin-only routes that add nothing but auth:
  `app/api/jobs/status/route.ts` (`{ jobs: { <JobName>: { isRunning } } }`),
  `app/api/jobs/trigger/[jobName]/route.ts`, `app/api/jobs/version/route.ts`.
- **The database**, read directly from `JobRun`: `app/api/jobs/runs/route.ts` returns the
  latest run per `jobType` (`distinct`, minus `errorStack`/`metadata`), and
  `app/api/jobs/runs/[id]/route.ts` returns one run with its `WorkerLog` rows plus the
  related game server / user.

Both DB routes return Prisma rows as-is — `NextResponse.json` serializes `DateTime` columns
to ISO strings. Do not reintroduce a manual field-by-field mapping: that is what let the
response types drift from the schema.

`hooks/useJobsApi.ts` polls all of this (status 15s, runs 30s, run details 5s while the run
is `RUNNING`).

## Types: Prisma is the source of truth

`types/jobs.ts` derives every DB-backed shape from the generated client
(`@/app/client/generated/browser`) via a local `Serialized<T>` helper that maps `Date` to
`string`: `JobRunSummary`, `JobRunDetails`, `JobRunLog`. The enums `WorkerJobType`,
`JobRunStatus` and `LogLevel` are imported from the generated client directly — never
re-declare them as string unions. Only the worker's own envelopes (`JobStatusResponse`,
`TriggerJobResponse`) are hand-written, because no table backs them.

Components use the enum members (`JobRunStatus.FAILED`, `LogLevel.WARN`), including as
`Record<>` keys, so a new schema value fails the build instead of silently going unstyled.

## Job names vs. `WorkerJobType`

The worker names jobs in PascalCase (`ExpireServers`); the DB enum is CONSTANT_CASE
(`EXPIRE_SERVERS`). `lib/jobs/workerJobs.ts` bridges the two:

- `workerJobNameToJobType()` converts by case, with an override table for names that do not
  line up (`GenerateExpiryEmails` → `GENERATE_EMAILS`). An unknown name yields `undefined`,
  which only means the card shows no last-run info.
- `isValidWorkerJobName()` is the trigger route's only gate — it checks the name is a bare
  identifier so it cannot escape the worker URL path. The worker itself decides which jobs
  exist and its error is passed back through.

## Adding a job

Add the value to `WorkerJobType` in `prisma/schema.prisma`, migrate, and run
`prisma generate`. If the worker's PascalCase name is the exact case-conversion of the enum
value, nothing else is needed. Otherwise add one line to `JOB_NAME_TO_TYPE_OVERRIDES`.
