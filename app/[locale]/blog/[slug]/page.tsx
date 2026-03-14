import { getBlogPostBySlug } from '@/app/actions/blog/blogActions';
import { MarkdownRenderer } from '@/components/blog/MarkdownRenderer';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const t = await getTranslations('blog');
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) notFound();

    const date = post.publishedAt ?? post.createdAt;

    return (
        <div className="mx-auto max-w-3xl">
            <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('title')}
            </Link>

            <article>
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-2">
                        {post.category && (
                            <span className="font-medium text-foreground">{post.category}</span>
                        )}
                        <span>
                            {t('publishedOn')} {date.toLocaleDateString()}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold md:text-4xl">{post.title}</h1>
                </div>
                <MarkdownRenderer content={post.content} />
            </article>
        </div>
    );
}
