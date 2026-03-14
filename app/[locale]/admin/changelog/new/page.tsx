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
                                New Entry
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

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
