import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <AdminBreadcrumb
                items={[{ label: 'Blog', href: '/admin/blog' }, { label: 'Edit Post' }]}
            />

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
