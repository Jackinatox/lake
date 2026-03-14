import { getBlogPostBySlug } from '@/app/actions/blog/blogActions';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import formatDate from '@/lib/formatDate';

export default async function BlogPostPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ from?: string }>;
}) {
    const t = await getTranslations('blog');
    const [{ slug }, { from }] = await Promise.all([params, searchParams]);
    const post = await getBlogPostBySlug(slug);

    if (!post) notFound();

    const date = post.publishedAt ?? post.createdAt;

    const backHref = from === 'changelog' ? '/changelog' : '/blog';
    const backLabel = t('title');

    return (
        <div className="mx-auto max-w-4xl w-full p-2">
            <Link
                href={backHref}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backLabel}
            </Link>

            <article>
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-2">
                        {post.category && (
                            <span className="font-medium text-foreground">{post.category}</span>
                        )}
                        <span>
                            {t('publishedOn')} {formatDate(date)}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold md:text-4xl">{post.title}</h1>
                </div>
                <MarkdownRenderer content={post.content} />
            </article>
        </div>
    );
}
