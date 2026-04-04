import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBlogCategories } from '@/app/actions/blog/blogActions';
import BlogPostForm from '@/components/admin/blog/BlogPostForm';

export default async function NewBlogPostPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') return <NoAdmin />;

    const categories = await getBlogCategories();

    return (
        <div className="w-full mx-auto">
            <AdminBreadcrumb
                items={[{ label: 'Blog', href: '/admin/blog' }, { label: 'New Post' }]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>New Post</CardTitle>
                </CardHeader>
                <CardContent>
                    <BlogPostForm existingCategories={categories} />
                </CardContent>
            </Card>
        </div>
    );
}
