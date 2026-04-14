import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { headers } from 'next/headers';
import { BookOpen, Pencil, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { listBlogPostsAdmin } from '@/app/actions/blog/blogActions';
import { DeleteBlogPostButton } from './BlogAdminClient';
import formatDate from '@/lib/formatDate';

function getStatus(post: { published: boolean; listed: boolean; publishedAt: Date }) {
    if (!post.published) return { label: 'Draft', color: 'text-muted-foreground' };
    if (post.publishedAt > new Date())
        return { label: 'Scheduled', color: 'text-amber-600 dark:text-amber-400' };
    if (!post.listed) return { label: 'Unlisted', color: 'text-blue-600 dark:text-blue-400' };
    return { label: 'Published', color: 'text-green-600 dark:text-green-400' };
}

export default async function AdminBlogPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') return <NoAdmin />;

    const posts = await listBlogPostsAdmin();

    return (
        <div className="w-full mx-auto">
            <AdminBreadcrumb items={[{ label: 'Blog' }]} />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Blog Posts
                    </CardTitle>
                    <Button asChild>
                        <Link href="/admin/blog/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Post
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {posts.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No blog posts yet.
                        </p>
                    ) : (
                        <div className="divide-y rounded-lg border">
                            <div className="hidden items-center gap-3 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
                                <div className="min-w-0 flex-1">Title</div>
                                <div className="hidden w-36 lg:block">Category</div>
                                <div className="w-24 text-center">Status</div>
                                <div className="hidden w-32 md:block">Date</div>
                                <div className="w-20 shrink-0 text-right">Actions</div>
                            </div>
                            {posts.map((post) => {
                                const status = getStatus(post);
                                const date = post.publishedAt;
                                return (
                                    <div
                                        key={post.id}
                                        className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium truncate">
                                                {post.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono truncate">
                                                /{post.slug}
                                            </div>
                                        </div>
                                        <div className="hidden w-36 text-xs text-muted-foreground lg:block truncate">
                                            {post.category || '-'}
                                        </div>
                                        <div className="w-24 text-center">
                                            <span className={`text-xs font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="hidden w-32 text-xs text-muted-foreground md:block">
                                            {formatDate(date)}
                                        </div>
                                        <div className="flex shrink-0 gap-2 justify-end">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/admin/blog/${post.id}/edit`}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                            <DeleteBlogPostButton id={post.id} title={post.title} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
