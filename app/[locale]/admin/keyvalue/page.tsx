import { Fragment } from 'react';
import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { headers } from 'next/headers';
import { Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
            return row.string ? row.string.slice(0, 80) + (row.string.length > 80 ? '…' : '') : '—';
        case 'TEXT':
            return row.string ? row.string.slice(0, 30) + (row.string.length > 30 ? '…' : '') : '—';
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

type CategoryGroup = {
    category: string | null;
    entries: KeyValueRow[];
};

function groupByCategory(entries: KeyValueRow[]): CategoryGroup[] {
    const groups = new Map<string, CategoryGroup>();

    entries.forEach((entry) => {
        const groupKey = entry.category?.trim() || '';
        const existing = groups.get(groupKey);

        if (existing) {
            existing.entries.push(entry);
            return;
        }

        groups.set(groupKey, {
            category: groupKey || null,
            entries: [entry],
        });
    });

    return Array.from(groups.values()).sort((a, b) => {
        if (a.category === null) return 1;
        if (b.category === null) return -1;

        return a.category.localeCompare(b.category);
    });
}

export default async function KeyValuePage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const entries = await getKeyValuesAction();
    const groupedEntries = groupByCategory(entries);
    const categories = [
        ...new Set(
            entries
                .map((entry) => entry.category?.trim())
                .filter((category): category is string => Boolean(category)),
        ),
    ].sort();

    return (
        <div className="w-full mx-auto">
            <AdminBreadcrumb items={[{ label: 'Key-Value Store' }]} />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Key-Value Store
                    </CardTitle>
                    <EntryDialog categories={categories} />
                </CardHeader>
                <CardContent>
                    {entries.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            No entries yet.
                        </p>
                    ) : (
                        <div className="rounded-lg border">
                            <Table className="min-w-[860px] table-fixed">
                                <colgroup>
                                    <col className="w-[34%]" />
                                    <col className="w-[7.5rem]" />
                                    <col className="w-[30%]" />
                                    <col className="w-[13.75rem]" />
                                    <col className="w-[9rem]" />
                                </colgroup>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead>Variable</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Preview</TableHead>
                                        <TableHead>Note</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedEntries.map((group) => (
                                        <Fragment key={group.category ?? '__uncategorized'}>
                                            <TableRow className="border-y-2 border-y-border bg-muted/70 hover:bg-muted/70">
                                                <TableCell colSpan={5} className="px-4 py-4">
                                                    <div className="flex items-center justify-between gap-4 border-l-4 border-l-primary pl-3">
                                                        <div>
                                                            <p className="text-base font-semibold">
                                                                {group.category ?? 'Uncategorized'}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                                {group.entries.length}{' '}
                                                                {group.entries.length === 1
                                                                    ? 'entry'
                                                                    : 'entries'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {group.entries.map((row) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>
                                                        <span className="block break-all font-mono text-sm font-semibold">
                                                            {row.key}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColor[row.type]}`}
                                                        >
                                                            {row.type}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="truncate text-xs text-muted-foreground">
                                                        {valuePreview(row)}
                                                    </TableCell>
                                                    <TableCell className="truncate text-xs text-muted-foreground">
                                                        {row.note ?? '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end gap-2">
                                                            <EntryDialog
                                                                entry={row}
                                                                categories={categories}
                                                            />
                                                            <DeleteButton
                                                                id={row.id}
                                                                keyName={row.key}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
