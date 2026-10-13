import { cn } from '@/lib/utils';

/** Compact bordered block for the admin ticket sidebar: small caps title, tight padding. */
export default function SidebarSection({
    title,
    action,
    className,
    children,
}: {
    title: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section className={cn('rounded-lg border bg-card text-sm shadow-sm', className)}>
            <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
                <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {title}
                </h2>
                {action}
            </header>
            <div className="space-y-2.5 p-3">{children}</div>
        </section>
    );
}

/** Label/value grid used inside a `SidebarSection`. */
export function SidebarFields({ children }: { children: React.ReactNode }) {
    return (
        <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5 text-xs">
            {children}
        </dl>
    );
}

export function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0">{children}</dd>
        </>
    );
}
