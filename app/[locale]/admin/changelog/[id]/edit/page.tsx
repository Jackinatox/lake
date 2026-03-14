import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { headers } from 'next/headers';
import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                href="/admin"
                                className="flex items-center gap-2 text-muted-foreground"
                            >
                                <History className="h-4 w-4" />
                                Admin Panel
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                href="/admin/changelog"
                                className="text-muted-foreground"
                            >
                                Changelog
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="#" className="text-foreground">
                                Edit Entry
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

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
