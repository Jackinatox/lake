import { getPublishedChangelog } from '@/app/actions/changelog/changelogActions';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function ChangelogPage() {
    const t = await getTranslations('changelog');
    const entries = await getPublishedChangelog(50);

    return (
        <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

            {entries.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No entries yet.</p>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => {
                        const date = entry.publishedAt ?? entry.createdAt;
                        return (
                            <div key={entry.id} className="flex gap-4 border-b pb-4 last:border-0">
                                <div className="w-20 shrink-0 text-sm text-muted-foreground pt-0.5">
                                    {date.toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-base font-semibold">{entry.title}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {entry.text}
                                    </p>
                                    {entry.blogPost?.slug && (
                                        <Link
                                            href={`/blog/${entry.blogPost.slug}`}
                                            className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                        >
                                            {t('readMore')}
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
