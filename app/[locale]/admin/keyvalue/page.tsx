import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { headers } from 'next/headers';
import { Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getKeyValuesAction, KeyValueRow } from '@/app/actions/keyvalue/keyValueActions';
import { KeyValueType } from '@/app/client/generated/enums';
import { EntryDialog, DeleteButton } from './KeyValueClient';

const typeBadgeColor: Record<KeyValueType, string> = {
    STRING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    TEXT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    JSON: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    NUMBER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    BOOLEAN: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

function valuePreview(row: KeyValueRow): string {
    switch (row.type) {
        case 'STRING':
        case 'TEXT':
            return row.string ? row.string.slice(0, 80) + (row.string.length > 80 ? '…' : '') : '—';
        case 'JSON':
            try {
                const s = JSON.stringify(row.json);
                return s ? s.slice(0, 80) + (s.length > 80 ? '…' : '') : '—';
            } catch {
                return '—';
            }
        case 'NUMBER':
            return row.number !== null && row.number !== undefined ? String(row.number) : '—';
        case 'BOOLEAN':
            return row.boolean !== null && row.boolean !== undefined ? String(row.boolean) : '—';
        default:
            return '—';
    }
}

export default async function KeyValuePage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const entries = await getKeyValuesAction();

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="mb-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                href="/admin"
                                className="flex items-center gap-2 text-muted-foreground"
                            >
                                <Database className="h-4 w-4" />
                                Admin Panel
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/admin/keyvalue" className="text-foreground">
                                Key-Value Store
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Key-Value Store
                    </CardTitle>
                    <EntryDialog />
                </CardHeader>
                <CardContent>
                    {entries.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">No entries yet.</p>
                    ) : (
                        <div className="divide-y rounded-lg border">
                            {entries.map((row) => (
                                <div
                                    key={row.id}
                                    className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3"
                                >
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                        <span className="font-mono text-sm font-semibold break-all">
                                            {row.key}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColor[row.type]}`}
                                        >
                                            {row.type}
                                        </span>
                                    </div>
                                    <div className="hidden min-w-0 max-w-xs flex-1 text-xs text-muted-foreground sm:block truncate">
                                        {valuePreview(row)}
                                    </div>
                                    {row.note && (
                                        <div className="hidden min-w-0 max-w-[160px] flex-1 text-xs text-muted-foreground xl:block truncate">
                                            {row.note}
                                        </div>
                                    )}
                                    <div className="flex shrink-0 gap-2">
                                        <EntryDialog entry={row} />
                                        <DeleteButton id={row.id} keyName={row.key} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
