import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import ChangelogEntryForm from '@/components/admin/changelog/ChangelogEntryForm';

export default async function NewChangelogEntryPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') return <NoAdmin />;

    const blogPosts = await prisma.blogPost.findMany({
        where: { published: true },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="w-full mx-auto">
            <AdminBreadcrumb
                items={[{ label: 'Changelog', href: '/admin/changelog' }, { label: 'New Entry' }]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>New Changelog Entry</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChangelogEntryForm publishedBlogPosts={blogPosts} />
                </CardContent>
            </Card>
        </div>
    );
}
