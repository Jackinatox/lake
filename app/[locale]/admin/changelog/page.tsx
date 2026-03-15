import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { headers } from 'next/headers';
import { History, Pencil, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { listChangelogAdmin } from '@/app/actions/changelog/changelogActions';
import { DeleteChangelogButton } from './ChangelogAdminClient';

function getStatus(entry: { published: boolean; publishedAt: Date | null }) {
    if (!entry.published) return { label: 'Draft', color: 'text-muted-foreground' };
    if (entry.publishedAt && entry.publishedAt > new Date())
        return { label: 'Scheduled', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Published', color: 'text-green-600 dark:text-green-400' };
}

export default async function AdminChangelogPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') return <NoAdmin />;

    const entries = await listChangelogAdmin();

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
                            <BreadcrumbLink href="/admin/changelog" className="text-foreground">
                                Changelog
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Changelog
                    </CardTitle>
                    <Button asChild>
                        <Link href="/admin/changelog/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Entry
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {entries.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No changelog entries yet.
                        </p>
                    ) : (
                        <div className="divide-y rounded-lg border">
                            <div className="hidden items-center gap-3 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground sm:flex">
                                <div className="min-w-0 flex-1">Title</div>
                                <div className="hidden w-40 md:block">Blog Post</div>
                                <div className="w-24 text-center">Status</div>
                                <div className="hidden w-32 lg:block">Date</div>
                                <div className="w-20 shrink-0 text-right">Actions</div>
                            </div>
                            {entries.map((entry) => {
                                const status = getStatus(entry);
                                const date = entry.publishedAt ?? entry.createdAt;
                                return (
                                    <div
                                        key={entry.id}
                                        className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-medium truncate">
                                                {entry.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {entry.text.slice(0, 60)}
                                                {entry.text.length > 60 ? '...' : ''}
                                            </div>
                                        </div>
                                        <div className="hidden w-40 text-xs text-muted-foreground md:block truncate">
                                            {entry.blogPost?.title ?? '-'}
                                        </div>
                                        <div className="w-24 text-center">
                                            <span className={`text-xs font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="hidden w-32 text-xs text-muted-foreground lg:block">
                                            {date.toLocaleDateString()}
                                        </div>
                                        <div className="flex shrink-0 gap-2 justify-end">
                                            <Button size="sm" variant="outline" asChild>
                                                <Link href={`/admin/changelog/${entry.id}/edit`}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                            <DeleteChangelogButton
                                                id={entry.id}
                                                title={entry.title}
                                            />
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
