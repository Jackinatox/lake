import { getPublishedChangelog } from '@/app/actions/changelog/changelogActions';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function ChangelogStrip() {
    const t = await getTranslations('changelog');
    const entries = await getPublishedChangelog(4);

    if (entries.length === 0) return null;

    return (
        <section className="mt-4 mx-auto w-full max-w-screen-2xl px-2 md:px-0">
            <div className="rounded-xl border bg-card p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">{t('title')}</h2>
                <div className="space-y-3">
                    {entries.map((entry) => {
                        const date = entry.publishedAt ?? entry.createdAt;
                        const formatted = date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                        });
                        return (
                            <div
                                key={entry.id}
                                className="flex items-start gap-3 text-sm"
                            >
                                <span className="w-14 shrink-0 text-muted-foreground text-xs pt-0.5">
                                    {formatted}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <span className="font-medium">{entry.title}</span>
                                    {entry.blogPost?.slug && (
                                        <Link
                                            href={`/blog/${entry.blogPost.slug}`}
                                            className="ml-2 inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                                        >
                                            {t('readMore')}
                                            <ArrowRight className="h-3 w-3" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 text-center">
                    <Link
                        href="/changelog"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                        {t('viewAll')}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
