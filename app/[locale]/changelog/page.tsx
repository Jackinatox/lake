import { getPublishedChangelog } from '@/app/actions/changelog/changelogActions';
import { Badge } from '@/components/ui/badge';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import formatDate from '@/lib/formatDate';

type ChangelogEntry = Awaited<ReturnType<typeof getPublishedChangelog>>[number];

const TYPE_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
    NEW: {
        label: 'New',
        className: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
        dot: 'bg-blue-400',
    },
    IMPROVED: {
        label: 'Improved',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        dot: 'bg-emerald-400',
    },
    FIXED: {
        label: 'Fixed',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        dot: 'bg-amber-400',
    },
    SECURITY: {
        label: 'Security',
        className: 'border-red-500/30 bg-red-500/10 text-red-400',
        dot: 'bg-red-400',
    },
    REMOVED: {
        label: 'Removed',
        className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400',
        dot: 'bg-zinc-400',
    },
};

function groupByMonth(entries: ChangelogEntry[], locale: string) {
    const groups: { label: string; entries: ChangelogEntry[] }[] = [];
    const map = new Map<string, ChangelogEntry[]>();
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });

    for (const entry of entries) {
        const key = fmt.format(new Date(entry.publishedAt));
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(entry);
    }

    for (const [label, entries] of map) {
        groups.push({ label, entries });
    }

    return groups;
}

export default async function ChangelogPage() {
    const t = await getTranslations('changelog');
    const locale = await getLocale();
    const entries = await getPublishedChangelog(50);
    const groups = groupByMonth(entries, locale);

    return (
        <div className="mx-auto max-w-4xl w-full p-2 md:p-6">
            <div className="mb-10">
                <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>

            {groups.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No entries yet.</p>
            ) : (
                <div className="space-y-10">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <div className="mb-4 flex items-center gap-3">
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    {group.label}
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <div className="space-y-6">
                                {group.entries.map((entry) => {
                                    const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG['NEW'];
                                    const date = entry.publishedAt;
                                    const slug = entry.blogPost?.slug;
                                    const content = (
                                        <div className="min-w-0 flex-1 pb-6 group-last:pb-0">
                                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`px-2 py-0 text-[11px] font-medium ${cfg.className}`}
                                                >
                                                    {cfg.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(date)}
                                                </span>
                                            </div>
                                            <h2
                                                className={`text-sm font-semibold leading-snug ${slug ? 'group-hover:underline' : ''}`}
                                            >
                                                {entry.title}
                                            </h2>
                                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                                {entry.text}
                                            </p>
                                        </div>
                                    );
                                    return (
                                        <div key={entry.id} className="group flex gap-4">
                                            <div className="flex flex-col items-center pt-1">
                                                <div
                                                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
                                                />
                                                <div className="mt-2 w-px flex-1 bg-border group-last:hidden" />
                                            </div>
                                            {slug ? (
                                                <Link
                                                    href={`/blog/${slug}?from=changelog`}
                                                    className="group min-w-0 flex-1"
                                                >
                                                    {content}
                                                </Link>
                                            ) : (
                                                content
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
