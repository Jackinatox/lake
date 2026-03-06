import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

// This endpoint should be protected by the reverse proxy to only be accessed locally

type MetricType = 'gauge' | 'counter' | 'histogram' | 'summary' | 'untyped';

interface Metric {
    name: string;
    help: string;
    type: MetricType;
    collect: () => string[] | Promise<string[]>;
}

function renderMetric(metric: Metric, samples: string[]): string {
    return [
        `# HELP ${metric.name} ${metric.help}`,
        `# TYPE ${metric.name} ${metric.type}`,
        ...samples,
    ].join('\n');
}

// ---------------------------------------------------------------------------
// Collectors — add new entries here to expose additional metrics
// ---------------------------------------------------------------------------

const collectors: Metric[] = [
    // --- Users ---
    {
        name: 'lake_users_total',
        help: 'Total number of registered users',
        type: 'gauge',
        collect: async () => {
            const count = await prisma.user.count();
            return [`lake_users_total ${count}`];
        },
    },
    {
        name: 'lake_users_banned_total',
        help: 'Number of currently banned users',
        type: 'gauge',
        collect: async () => {
            const count = await prisma.user.count({ where: { banned: true } });
            return [`lake_users_banned_total ${count}`];
        },
    },

    // --- Game Servers ---
    {
        name: 'lake_game_servers_total',
        help: 'Number of game servers by status',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServer.groupBy({
                by: ['status'],
                _count: { _all: true },
            });
            return rows.map(
                (r) => `lake_game_servers_total{status="${r.status}"} ${r._count._all}`,
            );
        },
    },
    {
        name: 'lake_game_servers_by_type_total',
        help: 'Number of game servers by type',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServer.groupBy({
                by: ['type'],
                _count: { _all: true },
            });
            return rows.map(
                (r) => `lake_game_servers_by_type_total{type="${r.type}"} ${r._count._all}`,
            );
        },
    },

    // --- Orders ---
    {
        name: 'lake_orders_total',
        help: 'Number of orders by status',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServerOrder.groupBy({
                by: ['status'],
                _count: { _all: true },
            });
            return rows.map((r) => `lake_orders_total{status="${r.status}"} ${r._count._all}`);
        },
    },
    {
        name: 'lake_orders_by_type_total',
        help: 'Number of orders by type',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServerOrder.groupBy({
                by: ['type'],
                _count: { _all: true },
            });
            return rows.map((r) => `lake_orders_by_type_total{type="${r.type}"} ${r._count._all}`);
        },
    },
    {
        name: 'lake_orders_revenue_cents_total',
        help: 'Total revenue from PAID orders in cents',
        type: 'counter',
        collect: async () => {
            const result = await prisma.gameServerOrder.aggregate({
                where: { status: 'PAID' },
                _sum: { price: true },
            });
            const cents = Math.round(result._sum.price ?? 0);
            return [`lake_orders_revenue_cents_total ${cents}`];
        },
    },

    // --- Refunds ---
    {
        name: 'lake_refunds_total',
        help: 'Number of refunds by status',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.refund.groupBy({
                by: ['status'],
                _count: { _all: true },
            });
            return rows.map((r) => `lake_refunds_total{status="${r.status}"} ${r._count._all}`);
        },
    },
    {
        name: 'lake_refunds_amount_cents_total',
        help: 'Total refunded amount in cents',
        type: 'counter',
        collect: async () => {
            const result = await prisma.refund.aggregate({
                where: { status: 'SUCCEEDED' },
                _sum: { amount: true },
            });
            return [`lake_refunds_amount_cents_total ${result._sum.amount ?? 0}`];
        },
    },

    // --- Support Tickets ---
    {
        name: 'lake_support_tickets_total',
        help: 'Number of support tickets by status',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.supportTicket.groupBy({
                by: ['status'],
                _count: { _all: true },
            });
            return rows.map(
                (r) => `lake_support_tickets_total{status="${r.status}"} ${r._count._all}`,
            );
        },
    },

    // --- Emails ---
    {
        name: 'lake_emails_total',
        help: 'Number of emails by status',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.email.groupBy({
                by: ['status'],
                _count: { _all: true },
            });
            return rows.map((r) => `lake_emails_total{status="${r.status}"} ${r._count._all}`);
        },
    },

    // --- Job Runs ---
    {
        name: 'lake_job_runs_total',
        help: 'Number of job runs by type and status',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.jobRun.groupBy({
                by: ['jobType', 'status'],
                _count: { _all: true },
            });
            return rows.map(
                (r) =>
                    `lake_job_runs_total{workerJob="${r.jobType}",status="${r.status}"} ${r._count._all}`,
            );
        },
    },

    // --- Application Logs (last 24 h) ---
    {
        name: 'lake_app_logs_24h_total',
        help: 'Number of application log entries in the last 24 hours by level',
        type: 'gauge',
        collect: async () => {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const rows = await prisma.applicationLog.groupBy({
                by: ['level'],
                where: { createdAt: { gte: since } },
                _count: { _all: true },
            });
            return rows.map((r) => `lake_app_logs_24h_total{level="${r.level}"} ${r._count._all}`);
        },
    },
    // Hardware Stats
    {
        name: 'lake_total_given_cpu_percent',
        help: 'Total CPU percent allocated across all active game servers',
        type: 'gauge',
        collect: async () => {
            const result = await prisma.gameServer.aggregate({
                where: {
                    status: {
                        in: ['ACTIVE', 'CREATED'],
                    },
                },
                _sum: { cpuPercent: true },
            });
            return [`lake_total_given_cpus ${result._sum.cpuPercent ?? 0}`];
        },
    },
    {
        name: 'lake_total_given_memory_mb',
        help: 'Total memory allocated across all active game servers in MB',
        type: 'gauge',
        collect: async () => {
            const result = await prisma.gameServer.aggregate({
                where: {
                    status: {
                        in: ['ACTIVE', 'CREATED'],
                    },
                },
                _sum: { ramMB: true },
            });
            return [`lake_total_given_memory_mb ${result._sum.ramMB ?? 0}`];
        },
    },
    {
        name: 'lake_total_given_disk_mb',
        help: 'Total disk space allocated across all active game servers in MB',
        type: 'gauge',
        collect: async () => {
            const result = await prisma.gameServer.aggregate({
                where: {
                    status: {
                        in: ['ACTIVE', 'CREATED'],
                    },
                },
                _sum: { diskMB: true },
            });
            return [`lake_total_given_disk_mb ${result._sum.diskMB ?? 0}`];
        },
    },

    // ---------------------------------------------------------------------------
    // Revenue — rolling windows
    // ---------------------------------------------------------------------------
    {
        name: 'lake_orders_revenue_cents',
        help: 'Revenue from PAID orders in cents for rolling time windows',
        type: 'gauge',
        collect: async () => {
            const now = Date.now();
            const windows = [
                { label: '24h', ms: 24 * 60 * 60 * 1000 },
                { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
                { label: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
            ] as const;
            const results = await Promise.all(
                windows.map(({ label, ms }) =>
                    prisma.gameServerOrder
                        .aggregate({
                            where: { status: 'PAID', createdAt: { gte: new Date(now - ms) } },
                            _sum: { price: true },
                        })
                        .then((r) => ({ label, value: Math.round(r._sum.price ?? 0) })),
                ),
            );
            return results.map((r) => `lake_orders_revenue_cents{window="${r.label}"} ${r.value}`);
        },
    },
    {
        name: 'lake_net_revenue_cents_total',
        help: 'Net revenue in cents (total PAID orders minus total SUCCEEDED refunds)',
        type: 'gauge',
        collect: async () => {
            const [paid, refunded] = await Promise.all([
                prisma.gameServerOrder.aggregate({
                    where: { status: 'PAID' },
                    _sum: { price: true },
                }),
                prisma.refund.aggregate({
                    where: { status: 'SUCCEEDED' },
                    _sum: { amount: true },
                }),
            ]);
            const net = Math.round(paid._sum.price ?? 0) - (refunded._sum.amount ?? 0);
            return [`lake_net_revenue_cents_total ${net}`];
        },
    },
    {
        name: 'lake_orders_avg_value_cents',
        help: 'Average value of PAID orders in cents',
        type: 'gauge',
        collect: async () => {
            const result = await prisma.gameServerOrder.aggregate({
                where: { status: 'PAID' },
                _avg: { price: true },
            });
            const avg = Math.round(result._avg.price ?? 0);
            return [`lake_orders_avg_value_cents ${avg}`];
        },
    },

    // ---------------------------------------------------------------------------
    // Orders
    // ---------------------------------------------------------------------------
    {
        name: 'lake_orders_pending_total',
        help: 'Number of orders in PENDING state (checkout started, payment not yet confirmed)',
        type: 'gauge',
        collect: async () => {
            const count = await prisma.gameServerOrder.count({ where: { status: 'PENDING' } });
            return [`lake_orders_pending_total ${count}`];
        },
    },
    {
        name: 'lake_orders_created_24h_total',
        help: 'Number of orders created in the last 24 hours',
        type: 'gauge',
        collect: async () => {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const count = await prisma.gameServerOrder.count({
                where: { createdAt: { gte: since } },
            });
            return [`lake_orders_created_24h_total ${count}`];
        },
    },

    // ---------------------------------------------------------------------------
    // Users — signups, 2FA, sessions
    // ---------------------------------------------------------------------------
    {
        name: 'lake_users_new_total',
        help: 'New user registrations for rolling time windows',
        type: 'gauge',
        collect: async () => {
            const now = Date.now();
            const windows = [
                { label: '24h', ms: 24 * 60 * 60 * 1000 },
                { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
                { label: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
            ] as const;
            const results = await Promise.all(
                windows.map(({ label, ms }) =>
                    prisma.user
                        .count({ where: { createdAt: { gte: new Date(now - ms) } } })
                        .then((count) => ({ label, count })),
                ),
            );
            return results.map((r) => `lake_users_new_total{window="${r.label}"} ${r.count}`);
        },
    },
    {
        name: 'lake_users_twofactor_enabled_total',
        help: 'Number of users with two-factor authentication enabled',
        type: 'gauge',
        collect: async () => {
            const count = await prisma.user.count({ where: { twoFactorEnabled: true } });
            return [`lake_users_twofactor_enabled_total ${count}`];
        },
    },
    {
        name: 'lake_users_email_verified_total',
        help: 'Number of users with a verified email address',
        type: 'gauge',
        collect: async () => {
            const count = await prisma.user.count({ where: { emailVerified: true } });
            return [`lake_users_email_verified_total ${count}`];
        },
    },
    {
        name: 'lake_users_with_active_server_total',
        help: 'Number of distinct users who own at least one ACTIVE game server',
        type: 'gauge',
        collect: async () => {
            const result = await prisma.gameServer.findMany({
                where: { status: { in: ['ACTIVE', 'CREATED'] } },
                select: { userId: true },
                distinct: ['userId'],
            });
            return [`lake_users_with_active_server_total ${result.length}`];
        },
    },
    {
        name: 'lake_active_sessions_total',
        help: 'Number of non-expired user sessions',
        type: 'gauge',
        collect: async () => {
            const count = await prisma.session.count({ where: { expiresAt: { gt: new Date() } } });
            return [`lake_active_sessions_total ${count}`];
        },
    },

    // ---------------------------------------------------------------------------
    // Game Servers — richer breakdowns
    // ---------------------------------------------------------------------------
    {
        name: 'lake_game_servers_by_game_total',
        help: 'Number of active game servers grouped by gameDataId',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServer.groupBy({
                by: ['gameDataId'],
                where: { status: { in: ['ACTIVE', 'CREATED'] } },
                _count: { _all: true },
            });
            return rows.map(
                (r) =>
                    `lake_game_servers_by_game_total{game_id="${r.gameDataId}"} ${r._count._all}`,
            );
        },
    },
    {
        name: 'lake_game_servers_by_location_total',
        help: 'Number of active game servers grouped by locationId',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServer.groupBy({
                by: ['locationId'],
                where: { status: { in: ['ACTIVE', 'CREATED'] } },
                _count: { _all: true },
            });
            return rows.map(
                (r) =>
                    `lake_game_servers_by_location_total{location_id="${r.locationId}"} ${r._count._all}`,
            );
        },
    },
    {
        name: 'lake_game_servers_expiring_soon_total',
        help: 'Number of ACTIVE/CREATED servers expiring within the given time window',
        type: 'gauge',
        collect: async () => {
            const now = new Date();
            const windows = [
                { label: '1d', ms: 1 * 24 * 60 * 60 * 1000 },
                { label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
            ] as const;
            const results = await Promise.all(
                windows.map(({ label, ms }) =>
                    prisma.gameServer
                        .count({
                            where: {
                                status: { in: ['ACTIVE', 'CREATED'] },
                                expires: { lte: new Date(now.getTime() + ms) },
                            },
                        })
                        .then((count) => ({ label, count })),
                ),
            );
            return results.map(
                (r) => `lake_game_servers_expiring_soon_total{window="${r.label}"} ${r.count}`,
            );
        },
    },
    {
        name: 'lake_resources_by_location_cpu_percent',
        help: 'Total CPU percent allocated per location (active servers only)',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServer.groupBy({
                by: ['locationId'],
                where: { status: { in: ['ACTIVE', 'CREATED'] } },
                _sum: { cpuPercent: true },
            });
            return rows.map(
                (r) =>
                    `lake_resources_by_location_cpu_percent{location_id="${r.locationId}"} ${r._sum.cpuPercent ?? 0}`,
            );
        },
    },
    {
        name: 'lake_resources_by_location_ram_mb',
        help: 'Total RAM allocated per location in MB (active servers only)',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServer.groupBy({
                by: ['locationId'],
                where: { status: { in: ['ACTIVE', 'CREATED'] } },
                _sum: { ramMB: true },
            });
            return rows.map(
                (r) =>
                    `lake_resources_by_location_ram_mb{location_id="${r.locationId}"} ${r._sum.ramMB ?? 0}`,
            );
        },
    },
    {
        name: 'lake_resources_by_location_disk_mb',
        help: 'Total disk allocated per location in MB (active servers only)',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.gameServer.groupBy({
                by: ['locationId'],
                where: { status: { in: ['ACTIVE', 'CREATED'] } },
                _sum: { diskMB: true },
            });
            return rows.map(
                (r) =>
                    `lake_resources_by_location_disk_mb{location_id="${r.locationId}"} ${r._sum.diskMB ?? 0}`,
            );
        },
    },

    // ---------------------------------------------------------------------------
    // Support Tickets
    // ---------------------------------------------------------------------------
    {
        name: 'lake_support_tickets_by_category_total',
        help: 'Number of support tickets grouped by category',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.supportTicket.groupBy({
                by: ['category'],
                _count: { _all: true },
            });
            return rows.map(
                (r) =>
                    `lake_support_tickets_by_category_total{category="${r.category}"} ${r._count._all}`,
            );
        },
    },

    // ---------------------------------------------------------------------------
    // Emails
    // ---------------------------------------------------------------------------
    {
        name: 'lake_emails_failed_24h_total',
        help: 'Number of FAILED emails in the last 24 hours',
        type: 'gauge',
        collect: async () => {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const count = await prisma.email.count({
                where: { status: 'FAILED', createdAt: { gte: since } },
            });
            return [`lake_emails_failed_24h_total ${count}`];
        },
    },
    {
        name: 'lake_emails_by_type_total',
        help: 'Total emails grouped by type',
        type: 'gauge',
        collect: async () => {
            const rows = await prisma.email.groupBy({ by: ['type'], _count: { _all: true } });
            return rows.map((r) => `lake_emails_by_type_total{type="${r.type}"} ${r._count._all}`);
        },
    },

    // ---------------------------------------------------------------------------
    // Job Runs — performance
    // ---------------------------------------------------------------------------
    {
        name: 'lake_job_last_run_duration_seconds',
        help: 'Duration in seconds of the most recent completed run per job type',
        type: 'gauge',
        collect: async () => {
            const jobTypes = [
                'EXPIRE_SERVERS',
                'SEND_EMAILS',
                'GENERATE_EMAILS',
                'DELETE_SERVERS',
                'GENERATE_DELETION_EMAILS',
                'CHECK_NEW_VERSIONS',
            ] as const;
            const results = await Promise.all(
                jobTypes.map((jobType) =>
                    prisma.jobRun
                        .findFirst({
                            where: { jobType, status: 'COMPLETED', endedAt: { not: null } },
                            orderBy: { startedAt: 'desc' },
                            select: { startedAt: true, endedAt: true },
                        })
                        .then((r) => ({
                            jobType,
                            seconds:
                                r?.endedAt != null
                                    ? (r.endedAt.getTime() - r.startedAt.getTime()) / 1000
                                    : -1,
                        })),
                ),
            );
            return results.map(
                (r) => `lake_job_last_run_duration_seconds{job_type="${r.jobType}"} ${r.seconds}`,
            );
        },
    },
    {
        name: 'lake_job_last_items_processed',
        help: 'Items processed in the most recent completed run per job type',
        type: 'gauge',
        collect: async () => {
            const jobTypes = [
                'EXPIRE_SERVERS',
                'SEND_EMAILS',
                'GENERATE_EMAILS',
                'DELETE_SERVERS',
                'GENERATE_DELETION_EMAILS',
                'CHECK_NEW_VERSIONS',
            ] as const;
            const results = await Promise.all(
                jobTypes.map((jobType) =>
                    prisma.jobRun
                        .findFirst({
                            where: { jobType, status: 'COMPLETED' },
                            orderBy: { startedAt: 'desc' },
                            select: { itemsProcessed: true },
                        })
                        .then((r) => ({ jobType, items: r?.itemsProcessed ?? -1 })),
                ),
            );
            return results.map(
                (r) => `lake_job_last_items_processed{job_type="${r.jobType}"} ${r.items}`,
            );
        },
    },

    // ---------------------------------------------------------------------------
    // Application Logs — by LogType
    // ---------------------------------------------------------------------------
    {
        name: 'lake_app_logs_24h_by_type_total',
        help: 'Number of application log entries in the last 24 hours grouped by log type',
        type: 'gauge',
        collect: async () => {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const rows = await prisma.applicationLog.groupBy({
                by: ['type'],
                where: { createdAt: { gte: since } },
                _count: { _all: true },
            });
            return rows.map(
                (r) => `lake_app_logs_24h_by_type_total{log_type="${r.type}"} ${r._count._all}`,
            );
        },
    },
];

// ---------------------------------------------------------------------------

export async function GET() {
    const start = performance.now();
    const results = await Promise.allSettled(
        collectors.map(async (m) => renderMetric(m, await m.collect())),
    );
    const blocks = results.flatMap((r, i) => {
        if (r.status === 'fulfilled') return [r.value];
        logger.error('promExport: collector failed', 'SYSTEM', {
            details: { metric: collectors[i].name, err: r.reason },
        });
        return [];
    });
    const duration = (performance.now() - start) / 1000;

    blocks.push(
        [
            '# HELP lake_scrape_duration_seconds Time taken to collect all metrics in seconds',
            '# TYPE lake_scrape_duration_seconds gauge',
            `lake_scrape_duration_seconds ${duration}`,
        ].join('\n'),
    );

    return new Response(blocks.join('\n\n') + '\n', {
        headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
    });
}
