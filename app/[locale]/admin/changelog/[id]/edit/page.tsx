import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { headers } from 'next/headers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import prisma from '@/lib/prisma';
import { getChangelogEntryForEdit } from '@/app/actions/changelog/changelogActions';
import ChangelogEntryForm from '@/components/admin/changelog/ChangelogEntryForm';
import { notFound } from 'next/navigation';

export default async function EditChangelogEntryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') return <NoAdmin />;

    const { id } = await params;

    let entry;
    try {
        entry = await getChangelogEntryForEdit(id);
    } catch {
        notFound();
    }

    const blogPosts = await prisma.blogPost.findMany({
        where: { published: true },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="max-w-7xl w-full mx-auto">
            <AdminBreadcrumb
                items={[{ label: 'Changelog', href: '/admin/changelog' }, { label: 'Edit Entry' }]}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Edit Changelog Entry</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChangelogEntryForm entry={entry} publishedBlogPosts={blogPosts} />
                </CardContent>
            </Card>
        </div>
    );
}
