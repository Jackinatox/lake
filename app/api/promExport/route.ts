import prisma from '@/lib/prisma';

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
            const cents = Math.round((result._sum.price ?? 0) * 100);
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
];

// ---------------------------------------------------------------------------

export async function GET() {
    const blocks = await Promise.all(
        collectors.map(async (m) => renderMetric(m, await m.collect())),
    );

    return new Response(blocks.join('\n\n') + '\n', {
        headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
    });
}
