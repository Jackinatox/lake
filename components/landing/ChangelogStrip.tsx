import { getPublishedChangelog } from '@/app/actions/changelog/changelogActions';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

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

export async function ChangelogStrip() {
    const t = await getTranslations('changelog');
    const entries = await getPublishedChangelog(4);

    if (entries.length === 0) return null;

    return (
        <section className="mt-4 mx-auto w-full max-w-screen-2xl px-2 md:px-0">
            <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between px-4 py-2.5 border-b">
                    <span className="text-sm font-semibold">{t('title')}</span>
                    <Link
                        href="/changelog"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                        {t('viewAll')}
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                <div className="divide-y">
                    {entries.map((entry) => {
                        const cfg = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG['NEW'];
                        const date = entry.publishedAt;
                        const inner = (
                            <>
                                <Badge
                                    variant="outline"
                                    className={`hidden sm:inline-flex shrink-0 px-1.5 py-0 text-[10px] font-medium leading-4 ${cfg.className}`}
                                >
                                    {cfg.label}
                                </Badge>
                                <span
                                    className={`sm:hidden shrink-0 h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                                />
                                <span className="min-w-0 flex-1 text-sm truncate">
                                    {entry.title}
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {date.toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                                {entry.blogPost?.slug && (
                                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                                )}
                            </>
                        );
                        return entry.blogPost?.slug ? (
                            <Link
                                key={entry.id}
                                href={`/blog/${entry.blogPost.slug}`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                            >
                                {inner}
                            </Link>
                        ) : (
                            <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                                {inner}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
