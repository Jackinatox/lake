'use client';

import Link from 'next/link';
import {
    Activity,
    BookOpen,
    CalendarClock,
    ChevronRight,
    Cog,
    Database,
    FileText,
    Gamepad2Icon,
    History,
    KeyRound,
    MonitorX,
    RefreshCw,
    Shield,
    SquarePlay,
    Ticket,
    Undo2,
    UsersIcon,
} from 'lucide-react';

type AdminItem = {
    name: string;
    description: string;
    link: string;
    Icon: typeof UsersIcon;
};

type AdminSection = {
    title: string;
    items: AdminItem[];
};

const sections: AdminSection[] = [
    {
        title: 'Core',
        items: [
            {
                name: 'Users',
                description: 'Manage accounts & roles',
                link: '/admin/users',
                Icon: UsersIcon,
            },
            {
                name: 'Gameservers',
                description: 'View & edit servers',
                link: '/admin/gameservers',
                Icon: Gamepad2Icon,
            },
            {
                name: 'Wings',
                description: 'Node management',
                link: '/admin/wings',
                Icon: SquarePlay,
            },
            {
                name: 'Tickets',
                description: 'Support requests',
                link: '/admin/tickets',
                Icon: Ticket,
            },
        ],
    },
    {
        title: 'Billing',
        items: [
            {
                name: 'Stripe Sessions',
                description: 'Checkout & payment sessions',
                link: '/admin/sessions',
                Icon: CalendarClock,
            },
            {
                name: 'Refunds',
                description: 'Process & review refunds',
                link: '/admin/refunds',
                Icon: Undo2,
            },
        ],
    },
    {
        title: 'Developer',
        items: [
            {
                name: 'API Keys',
                description: 'Create & revoke project API keys',
                link: '/admin/api-keys',
                Icon: KeyRound,
            },
        ],
    },
    {
        title: 'System',
        items: [
            {
                name: 'System Status',
                description: 'Health & uptime',
                link: '/admin/status',
                Icon: Activity,
            },
            {
                name: 'Application Logs',
                description: 'Server-side log viewer',
                link: '/admin/logs',
                Icon: FileText,
            },
            {
                name: 'Job Status',
                description: 'Background job monitoring',
                link: '/admin/jobStatus',
                Icon: MonitorX,
            },
            {
                name: 'Cache Invalidation',
                description: 'Clear cached data',
                link: '/admin/cache-invalidation',
                Icon: RefreshCw,
            },
            {
                name: 'Key-Value Store',
                description: 'Runtime configuration',
                link: '/admin/keyvalue',
                Icon: Database,
            },
            {
                name: 'Provision By Id',
                description: 'Manual server provisioning',
                link: '/admin/TestInternalFunctions/provisionById',
                Icon: Cog,
            },
        ],
    },
    {
        title: 'Content',
        items: [
            {
                name: 'Blog',
                description: 'Create & manage posts',
                link: '/admin/blog',
                Icon: BookOpen,
            },
            {
                name: 'Neuigkeiten',
                description: 'Changelog & updates',
                link: '/admin/changelog',
                Icon: History,
            },
        ],
    },
];

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';
const deploymentEnv = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
const instanceId = process.env.NEXT_PUBLIC_INSTANCE_ID;

const AdminPage = () => {
    return (
        <div className="w-full py-4 sm:mx-auto sm:px-4 md:py-8 lg:max-w-5xl xl:max-w-6xl">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3 md:mb-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 md:h-12 md:w-12">
                    <Shield className="h-5 w-5 text-primary md:h-6 md:w-6" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-foreground md:text-2xl">Admin</h1>
                    <p className="text-xs text-muted-foreground md:text-sm">
                        Lake management console
                    </p>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {sections.map((section) => (
                    <div key={section.title}>
                        <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {section.title}
                        </h2>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {section.items.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.link}
                                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:bg-accent/60 active:bg-accent sm:px-4 sm:py-3.5"
                                >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/80 sm:h-10 sm:w-10">
                                        <item.Icon className="h-[18px] w-[18px] text-foreground/70 sm:h-5 sm:w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-foreground">
                                            {item.name}
                                        </div>
                                        <div className="truncate text-xs text-muted-foreground">
                                            {item.description}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-8 py-4 text-center text-[11px] text-muted-foreground/60">
                <span>Version: {appVersion}</span>
                {deploymentEnv && <span> &middot; Env: {deploymentEnv}</span>}
                {instanceId && <span> &middot; Instance: {instanceId}</span>}
            </div>
        </div>
    );
};

export default AdminPage;
