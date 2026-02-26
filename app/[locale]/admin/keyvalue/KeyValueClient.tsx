'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    KeyValueRow,
    upsertKeyValueAction,
    deleteKeyValueAction,
} from '@/app/actions/keyvalue/keyValueActions';
import { KeyValueType } from '@/app/client/generated/enums';
import { useIsMobile } from '@/hooks/useIsMobile';

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
    ssr: false,
    loading: () => (
        <div className="flex h-[300px] items-center justify-center rounded border bg-muted text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading editor…
        </div>
    ),
});

type FormState = {
    id?: number;
    key: string;
    type: KeyValueType;
    stringValue: string;
    jsonValue: string;
    numberValue: string;
    booleanValue: boolean;
    note: string;
};

const defaultForm = (): FormState => ({
    key: '',
    type: 'STRING',
    stringValue: '',
    jsonValue: '{}',
    numberValue: '',
    booleanValue: false,
    note: '',
});

function rowToForm(row: KeyValueRow): FormState {
    let jsonValue = '{}';
    try {
        jsonValue = JSON.stringify(row.json, null, 2);
    } catch {
        jsonValue = String(row.json ?? '{}');
    }
    return {
        id: row.id,
        key: row.key,
        type: row.type,
        stringValue: row.string ?? '',
        jsonValue,
        numberValue: row.number !== null && row.number !== undefined ? String(row.number) : '',
        booleanValue: row.boolean ?? false,
        note: row.note ?? '',
    };
}

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

const typeBadgeVariant: Record<KeyValueType, 'default' | 'secondary' | 'destructive' | 'outline'> =
    {
        STRING: 'secondary',
        TEXT: 'outline',
        JSON: 'default',
        NUMBER: 'secondary',
        BOOLEAN: 'secondary',
    };

const typeBadgeColor: Record<KeyValueType, string> = {
    STRING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    TEXT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    JSON: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    NUMBER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    BOOLEAN: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

interface Props {
    initialEntries: KeyValueRow[];
}

export default function KeyValueClient({ initialEntries }: Props) {
    const { toast } = useToast();
    const { theme } = useTheme();
    const isMobile = useIsMobile();
    const [isPending, startTransition] = useTransition();

    const [entries, setEntries] = useState<KeyValueRow[]>(initialEntries);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState<FormState>(defaultForm());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<KeyValueRow | null>(null);

    const filtered = entries.filter(
        (e) =>
            e.key.toLowerCase().includes(search.toLowerCase()) ||
            (e.note ?? '').toLowerCase().includes(search.toLowerCase()),
    );

    function openCreate() {
        setForm(defaultForm());
        setDialogOpen(true);
    }

    function openEdit(row: KeyValueRow) {
        setForm(rowToForm(row));
        setDialogOpen(true);
    }

    function handleSave() {
        startTransition(async () => {
            try {
                let parsedJson: unknown = null;
                if (form.type === 'JSON') {
                    try {
                        parsedJson = JSON.parse(form.jsonValue);
                    } catch {
                        toast({
                            title: 'Invalid JSON',
                            description: 'Please fix the JSON syntax before saving.',
                            variant: 'destructive',
                        });
                        return;
                    }
                }

                const saved = await upsertKeyValueAction({
                    id: form.id,
                    key: form.key.trim(),
                    type: form.type,
                    string:
                        form.type === 'STRING' || form.type === 'TEXT' ? form.stringValue : null,
                    json: form.type === 'JSON' ? parsedJson : null,
                    number:
                        form.type === 'NUMBER'
                            ? form.numberValue !== ''
                                ? parseFloat(form.numberValue)
                                : null
                            : null,
                    boolean: form.type === 'BOOLEAN' ? form.booleanValue : null,
                    note: form.note || null,
                });

                setEntries((prev) =>
                    form.id
                        ? prev.map((e) => (e.id === saved.id ? (saved as KeyValueRow) : e))
                        : [...prev, saved as KeyValueRow],
                );
                setDialogOpen(false);
                toast({
                    title: form.id ? 'Updated' : 'Created',
                    description: `Key "${saved.key}" saved.`,
                });
            } catch (err: unknown) {
                toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'destructive',
                });
            }
        });
    }

    function confirmDelete(row: KeyValueRow) {
        setDeleteTarget(row);
    }

    function handleDelete() {
        if (!deleteTarget) return;
        startTransition(async () => {
            try {
                await deleteKeyValueAction(deleteTarget.id);
                setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
                setDeleteTarget(null);
                toast({ title: 'Deleted', description: `Key "${deleteTarget.key}" removed.` });
            } catch (err: unknown) {
                toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'destructive',
                });
            }
        });
    }

    const monocoHeight = isMobile ? '250px' : '380px';
    const isEditing = !!form.id;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search keys or notes…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={openCreate} className="shrink-0">
                    <Plus className="mr-2 h-4 w-4" />
                    New Entry
                </Button>
            </div>

            {/* Entry list */}
            {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No entries found.</p>
            ) : (
                <div className="divide-y rounded-lg border">
                    {filtered.map((row) => (
                        <div
                            key={row.id}
                            className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
                        >
                            {/* Key + type */}
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
                            {/* Value preview */}
                            <div className="hidden min-w-0 max-w-xs flex-1 text-xs text-muted-foreground sm:block">
                                <span className="truncate">{valuePreview(row)}</span>
                            </div>
                            {/* Note */}
                            {row.note && (
                                <div className="hidden min-w-0 max-w-[160px] flex-1 text-xs text-muted-foreground xl:block">
                                    <span className="truncate">{row.note}</span>
                                </div>
                            )}
                            {/* Actions */}
                            <div className="flex shrink-0 gap-2">
                                <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span className="ml-1.5 hidden sm:inline">Edit</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => confirmDelete(row)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span className="ml-1.5 hidden sm:inline">Delete</span>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit / Create dialog */}
            <Dialog open={dialogOpen} onOpenChange={(v) => !isPending && setDialogOpen(v)}>
                <DialogContent className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden p-0">
                    <DialogHeader className="border-b px-6 py-4 shrink-0">
                        <DialogTitle>
                            {isEditing ? `Edit: ${form.key}` : 'New Key-Value Entry'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update the value and note for this entry.'
                                : 'Add a new configuration entry to the key-value store.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Key */}
                        <div className="space-y-1.5">
                            <Label htmlFor="kv-key">Key</Label>
                            <Input
                                id="kv-key"
                                value={form.key}
                                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                                disabled={isEditing}
                                placeholder="e.g. legal.imprint"
                                className="font-mono"
                            />
                        </div>

                        {/* Type */}
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) =>
                                    setForm((f) => ({ ...f, type: v as KeyValueType }))
                                }
                                disabled={isEditing}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STRING">STRING — short text</SelectItem>
                                    <SelectItem value="TEXT">TEXT — long text / Monaco</SelectItem>
                                    <SelectItem value="JSON">JSON — structured data</SelectItem>
                                    <SelectItem value="NUMBER">NUMBER</SelectItem>
                                    <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Value */}
                        <div className="space-y-1.5">
                            <Label>Value</Label>
                            {form.type === 'STRING' && (
                                <Input
                                    value={form.stringValue}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, stringValue: e.target.value }))
                                    }
                                    placeholder="String value"
                                />
                            )}
                            {form.type === 'TEXT' && (
                                <MonacoEditor
                                    height={monocoHeight}
                                    language="plaintext"
                                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                    value={form.stringValue}
                                    onChange={(v) =>
                                        setForm((f) => ({ ...f, stringValue: v ?? '' }))
                                    }
                                    options={{
                                        minimap: { enabled: false },
                                        wordWrap: 'on',
                                        lineNumbers: 'off',
                                        scrollBeyondLastLine: false,
                                        fontSize: 13,
                                    }}
                                />
                            )}
                            {form.type === 'JSON' && (
                                <MonacoEditor
                                    height={monocoHeight}
                                    language="json"
                                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                    value={form.jsonValue}
                                    onChange={(v) =>
                                        setForm((f) => ({ ...f, jsonValue: v ?? '{}' }))
                                    }
                                    options={{
                                        minimap: { enabled: false },
                                        wordWrap: 'on',
                                        scrollBeyondLastLine: false,
                                        formatOnPaste: true,
                                        formatOnType: true,
                                        fontSize: 13,
                                    }}
                                />
                            )}
                            {form.type === 'NUMBER' && (
                                <Input
                                    type="number"
                                    value={form.numberValue}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, numberValue: e.target.value }))
                                    }
                                    placeholder="0"
                                />
                            )}
                            {form.type === 'BOOLEAN' && (
                                <div className="flex items-center gap-3 pt-1">
                                    <Switch
                                        id="kv-bool"
                                        checked={form.booleanValue}
                                        onCheckedChange={(v) =>
                                            setForm((f) => ({ ...f, booleanValue: v }))
                                        }
                                    />
                                    <Label htmlFor="kv-bool" className="cursor-pointer">
                                        {form.booleanValue ? 'true' : 'false'}
                                    </Label>
                                </div>
                            )}
                        </div>

                        {/* Note */}
                        <div className="space-y-1.5">
                            <Label htmlFor="kv-note">Note (optional)</Label>
                            <Textarea
                                id="kv-note"
                                value={form.note}
                                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                                placeholder="Internal description…"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 border-t px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending || !form.key.trim()}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove{' '}
                            <span className="font-mono font-semibold">{deleteTarget?.key}</span>{' '}
                            from the database. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
