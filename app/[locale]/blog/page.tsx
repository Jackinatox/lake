import { getPublishedBlogPosts, getBlogCategories } from '@/app/actions/blog/blogActions';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

function stripMarkdown(md: string): string {
    return md
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        .replace(/>\s/g, '')
        .replace(/[-*+]\s/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export default async function BlogPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string }>;
}) {
    const t = await getTranslations('blog');
    const { category } = await searchParams;
    const [posts, categories] = await Promise.all([
        getPublishedBlogPosts(category),
        getBlogCategories(),
    ]);

    return (
        <div className="mx-auto w-full min-w-0 max-w-5xl p-2 md:p-6">
            <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

            {/* Category filter */}
            <div className="mb-8 flex flex-wrap gap-2">
                <Link
                    href="/blog"
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        !category
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                >
                    {t('allCategories')}
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat}
                        href={`/blog?category=${encodeURIComponent(cat)}`}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            category === cat
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                    >
                        {cat}
                    </Link>
                ))}
            </div>

            {/* Post list */}
            {posts.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">{t('noPosts')}</p>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => {
                        const date = post.publishedAt;
                        const excerpt = stripMarkdown(post.content).slice(0, 150);
                        return (
                            <Card
                                key={post.id}
                                className="p-4 md:p-6 transition-colors hover:bg-accent/50"
                            >
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                                    {post.category && (
                                        <span className="font-medium text-foreground">
                                            {post.category}
                                        </span>
                                    )}
                                    <span>{date.toLocaleDateString()}</span>
                                </div>
                                <Link href={`/blog/${post.slug}`} className="block group">
                                    <h2 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {excerpt}
                                        {post.content.length > 150 ? '...' : ''}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                                        {t('readMore')}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </span>
                                </Link>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
