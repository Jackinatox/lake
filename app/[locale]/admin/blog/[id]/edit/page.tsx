import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { headers } from 'next/headers';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getBlogPostForEdit, getBlogCategories } from '@/app/actions/blog/blogActions';
import BlogPostForm from '@/components/admin/blog/BlogPostForm';
import { notFound } from 'next/navigation';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') return <NoAdmin />;

    const { id } = await params;

    let post;
    try {
        post = await getBlogPostForEdit(id);
    } catch {
        notFound();
    }

    const categories = await getBlogCategories();

    return (
        <div className="w-full mx-auto">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                href="/admin"
                                className="flex items-center gap-2 text-muted-foreground"
                            >
                                <BookOpen className="h-4 w-4" />
                                Admin Panel
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin/blog" className="text-muted-foreground">
                                Blog Posts
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#" className="text-foreground">
                                Edit Post
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Post</CardTitle>
                </CardHeader>
                <CardContent>
                    <BlogPostForm post={post} existingCategories={categories} />
                </CardContent>
            </Card>
        </div>
    );
}
