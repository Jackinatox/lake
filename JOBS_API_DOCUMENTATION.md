# Jobs Module API Documentation

This document provides a comprehensive overview of the Jobs API for implementing a frontend dashboard to monitor and manage background worker jobs.

## Base URL

```
/v1/jobs
```

All endpoints are prefixed with API versioning (`/v1`).

---

## Enums & Types

### WorkerJobType
The types of scheduled jobs in the system:

| Value | Description |
|-------|-------------|
| `EXPIRE_SERVERS` | Suspends game servers that have passed their expiration date |
| `DELETE_SERVERS` | Permanently deletes expired servers after retention period (90 days) |
| `SEND_EMAILS` | Processes and sends emails from the email queue |
| `GENERATE_EMAILS` | Creates expiry reminder emails (1-day and 7-day warnings) |
| `GENERATE_DELETION_EMAILS` | Creates deletion reminder emails for expired servers |
| `CHECK_NEW_VERSIONS` | Checks for new game versions (future feature) |

### JobRunStatus
Status of a job execution:

| Value | Description |
|-------|-------------|
| `RUNNING` | Job is currently executing |
| `COMPLETED` | Job finished successfully |
| `FAILED` | Job encountered an error |
| `CANCELLED` | Job was cancelled (manual intervention) |

### LogLevel
Severity levels for job logs:

| Value | Description |
|-------|-------------|
| `TRACE` | Detailed debugging information |
| `INFO` | General informational messages |
| `WARN` | Warning conditions |
| `ERROR` | Error conditions |
| `FATAL` | Critical errors requiring immediate attention |

---

## Endpoints

### 1. Get Job Status

Returns the current running status of all scheduled jobs.

**Endpoint:** `GET /v1/jobs/status`

**Response:**
```typescript
{
  timestamp: string; // ISO 8601 timestamp
  jobs: {
    ExpireServers: { isRunning: boolean };
    DeleteServers: { isRunning: boolean };
    SendEmails: { isRunning: boolean };
    GenerateExpiryEmails: { isRunning: boolean };
    GenerateDeletionEmails: { isRunning: boolean };
  };
}
```

**Example Response:**
```json
{
  "timestamp": "2026-01-20T15:30:00.000Z",
  "jobs": {
    "ExpireServers": { "isRunning": false },
    "DeleteServers": { "isRunning": false },
    "SendEmails": { "isRunning": true },
    "GenerateExpiryEmails": { "isRunning": false },
    "GenerateDeletionEmails": { "isRunning": false }
  }
}
```

**Use Case:** Display real-time status indicators showing which jobs are currently running.

---

### 2. Get Recent Job Runs

Returns a list of recent job executions with their results.

**Endpoint:** `GET /v1/jobs/runs`

**Response:**
```typescript
{
  timestamp: string;
  runs: Array<{
    id: string;           // Unique job run ID (cuid)
    jobType: WorkerJobType;
    status: JobRunStatus;
    startedAt: string;    // ISO 8601 timestamp
    endedAt: string | null;
    itemsProcessed: number;
    itemsTotal: number;
    itemsFailed: number;
    errorMessage: string | null;
  }>;
}
```

**Example Response:**
```json
{
  "timestamp": "2026-01-20T15:30:00.000Z",
  "runs": [
    {
      "id": "cm5abc123def456",
      "jobType": "SEND_EMAILS",
      "status": "COMPLETED",
      "startedAt": "2026-01-20T15:25:00.000Z",
      "endedAt": "2026-01-20T15:25:12.000Z",
      "itemsProcessed": 15,
      "itemsTotal": 15,
      "itemsFailed": 0,
      "errorMessage": null
    },
    {
      "id": "cm5xyz789ghi012",
      "jobType": "EXPIRE_SERVERS",
      "status": "COMPLETED",
      "startedAt": "2026-01-20T15:00:00.000Z",
      "endedAt": "2026-01-20T15:00:45.000Z",
      "itemsProcessed": 3,
      "itemsTotal": 3,
      "itemsFailed": 0,
      "errorMessage": null
    },
    {
      "id": "cm5fail456err789",
      "jobType": "DELETE_SERVERS",
      "status": "FAILED",
      "startedAt": "2026-01-20T03:00:00.000Z",
      "endedAt": "2026-01-20T03:00:30.000Z",
      "itemsProcessed": 2,
      "itemsTotal": 5,
      "itemsFailed": 3,
      "errorMessage": "Pterodactyl API error: 503 Service Unavailable"
    }
  ]
}
```

**Use Case:** Display a table/list of recent job executions with success/failure indicators.

---

### 3. Get Job Run Details

Returns detailed information about a specific job run including all logs.

**Endpoint:** `GET /v1/jobs/runs/:id`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | The job run ID (cuid) |

**Response (Success):**
```typescript
{
  id: string;
  jobType: WorkerJobType;
  status: JobRunStatus;
  startedAt: string;
  endedAt: string | null;
  itemsProcessed: number;
  itemsTotal: number;
  itemsFailed: number;
  errorMessage: string | null;
  errorStack: string | null;
  metadata: Record<string, unknown> | null;
  logs: Array<{
    id: number;
    jobType: WorkerJobType;
    jobRun: string;
    level: LogLevel;
    message: string;
    details: Record<string, unknown> | null;
    gameServerId: string | null;
    userId: string | null;
    createdAt: string;
    gameServer: {
      id: string;
      name: string;
      status: string;
    } | null;
    user: {
      id: string;
      name: string;
      email: string;
    } | null;
  }>;
}
```

**Response (Not Found):**
```json
{
  "error": "Job run not found"
}
```

**Example Response:**
```json
{
  "id": "cm5abc123def456",
  "jobType": "EXPIRE_SERVERS",
  "status": "COMPLETED",
  "startedAt": "2026-01-20T15:00:00.000Z",
  "endedAt": "2026-01-20T15:00:45.000Z",
  "itemsProcessed": 2,
  "itemsTotal": 2,
  "itemsFailed": 0,
  "errorMessage": null,
  "errorStack": null,
  "metadata": null,
  "logs": [
    {
      "id": 1234,
      "jobType": "EXPIRE_SERVERS",
      "jobRun": "cm5abc123def456",
      "level": "INFO",
      "message": "Job started, processing 2 servers",
      "details": { "totalServers": 2 },
      "gameServerId": null,
      "userId": null,
      "createdAt": "2026-01-20T15:00:00.100Z",
      "gameServer": null,
      "user": null
    },
    {
      "id": 1235,
      "jobType": "EXPIRE_SERVERS",
      "jobRun": "cm5abc123def456",
      "level": "INFO",
      "message": "Starting to handle expired server",
      "details": {
        "serverId": "clxyz123abc",
        "expires": "2026-01-20T14:00:00.000Z",
        "currentStatus": "ACTIVE"
      },
      "gameServerId": "clxyz123abc",
      "userId": "user_abc123",
      "createdAt": "2026-01-20T15:00:01.000Z",
      "gameServer": {
        "id": "clxyz123abc",
        "name": "My Minecraft Server",
        "status": "EXPIRED"
      },
      "user": {
        "id": "user_abc123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": 1236,
      "jobType": "EXPIRE_SERVERS",
      "jobRun": "cm5abc123def456",
      "level": "INFO",
      "message": "Successfully suspended server via Pterodactyl API",
      "details": {
        "serverId": "clxyz123abc",
        "ptAdminId": 42,
        "responseStatus": 204
      },
      "gameServerId": "clxyz123abc",
      "userId": "user_abc123",
      "createdAt": "2026-01-20T15:00:02.500Z",
      "gameServer": {
        "id": "clxyz123abc",
        "name": "My Minecraft Server",
        "status": "EXPIRED"
      },
      "user": {
        "id": "user_abc123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": 1237,
      "jobType": "EXPIRE_SERVERS",
      "jobRun": "cm5abc123def456",
      "level": "INFO",
      "message": "Job completed successfully",
      "details": { "totalProcessed": 2, "totalServers": 2 },
      "gameServerId": null,
      "userId": null,
      "createdAt": "2026-01-20T15:00:45.000Z",
      "gameServer": null,
      "user": null
    }
  ]
}
```

**Use Case:** Show detailed view of a job execution with timeline of all log entries.

---

### 4. Trigger Job Manually

Manually triggers a specific job to run immediately.

**Endpoint:** `POST /v1/jobs/trigger/:jobName`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `jobName` | string | One of: `ExpireServers`, `DeleteServers`, `SendEmails`, `GenerateExpiryEmails`, `GenerateDeletionEmails` |

**Response (Success):**
```typescript
{
  timestamp: string;
  success: true;
  result: {
    processed: number;
    total: number;
    failed: number;
  };
}
```

**Response (Failure):**
```typescript
{
  timestamp: string;
  success: false;
  error: string;
}
```

**Example Success Response:**
```json
{
  "timestamp": "2026-01-20T15:35:00.000Z",
  "success": true,
  "result": {
    "processed": 5,
    "total": 5,
    "failed": 0
  }
}
```

**Example Error Response:**
```json
{
  "timestamp": "2026-01-20T15:35:00.000Z",
  "success": false,
  "error": "Database connection failed"
}
```

**Use Case:** Admin button to manually run a job on demand.

---

## Scheduled Job Details

| Job Name | Schedule | Description |
|----------|----------|-------------|
| `ExpireServers` | Every hour | Finds servers past expiration date and suspends them via Pterodactyl API |
| `DeleteServers` | Daily at 3:00 AM | Permanently deletes servers expired for more than 90 days |
| `SendEmails` | Every 5 minutes | Processes email queue and sends pending emails via SMTP |
| `GenerateExpiryEmails` | Daily at 8:00 AM | Creates reminder emails for servers expiring in 1 or 7 days |
| `GenerateDeletionEmails` | Daily at 9:00 AM | Creates reminder emails for servers being deleted in 1 or 7 days |

---

## Frontend Implementation Guide

### Recommended Dashboard Components

#### 1. Job Status Overview Card
Display real-time status of all jobs:
- Green indicator: Job idle
- Blue/spinning indicator: Job running
- Use polling every 10-30 seconds on `GET /v1/jobs/status`

#### 2. Recent Job Runs Table
Columns to display:
- Job Type (with icon/color coding)
- Status (badge: green=completed, red=failed, blue=running)
- Started At (relative time, e.g., "5 minutes ago")
- Duration (endedAt - startedAt)
- Progress (itemsProcessed / itemsTotal)
- Failed count (highlight if > 0)
- Actions (view details button)

#### 3. Job Run Detail View
- Header with job type, status badge, timing info
- Summary stats: processed, total, failed
- Error message display (if failed)
- Collapsible metadata JSON viewer
- Log timeline with:
  - Color-coded log levels
  - Timestamps
  - Messages
  - Expandable details JSON
  - Links to related game server/user

#### 4. Manual Trigger Buttons
- Confirmation modal before triggering
- Show loading state while job executes
- Display result toast notification

### Suggested UI Libraries
- **Table:** TanStack Table, AG Grid, or similar
- **Charts:** For job history trends (optional)
- **Toast notifications:** For trigger results
- **JSON viewer:** For metadata/details display

### Polling Strategy
```typescript
// Recommended polling intervals
const POLLING_INTERVALS = {
  jobStatus: 15000,    // 15 seconds
  recentRuns: 30000,   // 30 seconds
  runDetails: 5000,    // 5 seconds (only when viewing details of RUNNING job)
};
```

### Status Color Mapping
```typescript
const STATUS_COLORS = {
  RUNNING: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  CANCELLED: 'gray',
};

const LOG_LEVEL_COLORS = {
  TRACE: 'gray',
  INFO: 'blue',
  WARN: 'yellow',
  ERROR: 'red',
  FATAL: 'purple',
};

const JOB_TYPE_ICONS = {
  EXPIRE_SERVERS: 'clock',
  DELETE_SERVERS: 'trash',
  SEND_EMAILS: 'mail',
  GENERATE_EMAILS: 'file-plus',
  GENERATE_DELETION_EMAILS: 'alert-triangle',
  CHECK_NEW_VERSIONS: 'refresh',
};
```

---

## Error Handling

All endpoints may return standard HTTP error codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad request (invalid job name) |
| 404 | Job run not found |
| 500 | Internal server error |

---

## TypeScript Types

```typescript
// Enums
type WorkerJobType = 
  | 'EXPIRE_SERVERS'
  | 'SEND_EMAILS'
  | 'GENERATE_EMAILS'
  | 'DELETE_SERVERS'
  | 'GENERATE_DELETION_EMAILS'
  | 'CHECK_NEW_VERSIONS';

type JobRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

type LogLevel = 'TRACE' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

// API Response Types
interface JobStatusResponse {
  timestamp: string;
  jobs: Record<string, { isRunning: boolean }>;
}

interface JobRunSummary {
  id: string;
  jobType: WorkerJobType;
  status: JobRunStatus;
  startedAt: string;
  endedAt: string | null;
  itemsProcessed: number;
  itemsTotal: number;
  itemsFailed: number;
  errorMessage: string | null;
}

interface RecentRunsResponse {
  timestamp: string;
  runs: JobRunSummary[];
}

interface WorkerLog {
  id: number;
  jobType: WorkerJobType;
  jobRun: string;
  level: LogLevel;
  message: string;
  details: Record<string, unknown> | null;
  gameServerId: string | null;
  userId: string | null;
  createdAt: string;
  gameServer: {
    id: string;
    name: string;
    status: string;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface JobRunDetails extends JobRunSummary {
  errorStack: string | null;
  metadata: Record<string, unknown> | null;
  logs: WorkerLog[];
}

interface TriggerJobResponse {
  timestamp: string;
  success: boolean;
  result?: {
    processed: number;
    total: number;
    failed: number;
  };
  error?: string;
}
```
