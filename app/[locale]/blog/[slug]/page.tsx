import { getBlogPostBySlug } from '@/app/actions/blog/blogActions';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import formatDate from '@/lib/formatDate';
import { Metadata } from 'next';
import { createPublicMetadata } from '@/lib/metadata';
import { markdownExcerpt } from '@/lib/markdownExcerpt';
import { blogPostingJsonLd } from '@/lib/structuredData';
import { JsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const post = await getBlogPostBySlug(slug);
    if (!post) {
        return { title: 'Post not found' };
    }
    return createPublicMetadata({
        locale,
        path: `/blog/${slug}`,
        title: post.title,
        description: markdownExcerpt(post.content) || post.title,
        article: { publishedTime: post.publishedAt, modifiedTime: post.updatedAt },
        // Unlisted posts are reachable by link only, so keep them out of search results too.
        noindex: !post.listed,
    });
}

export default async function BlogPostPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string; slug: string }>;
    searchParams: Promise<{ from?: string }>;
}) {
    const t = await getTranslations('blog');
    const [{ locale, slug }, { from }] = await Promise.all([params, searchParams]);
    const post = await getBlogPostBySlug(slug);

    if (!post) notFound();

    const date = post.publishedAt ?? post.createdAt;

    const backHref = from === 'changelog' ? '/changelog' : '/blog';
    const backLabel = t('title');

    return (
        <div className="mx-auto max-w-4xl w-full p-2">
            <JsonLd
                data={blogPostingJsonLd({
                    locale,
                    slug,
                    title: post.title,
                    description: markdownExcerpt(post.content) || post.title,
                    publishedAt: date,
                    updatedAt: post.updatedAt,
                })}
            />
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
