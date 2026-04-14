'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { Check, ChevronsUpDown, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
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
import { keyValueUpsertSchema } from '@/lib/validation/adminContent';
import { getValidationMessage } from '@/lib/validation/common';

const MAX_CATEGORY_LENGTH = 30;

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
    ssr: false,
    loading: () => (
        <div className="flex h-75 items-center justify-center rounded border bg-muted text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading editor…
        </div>
    ),
});

type FormState = {
    key: string;
    type: KeyValueType;
    stringValue: string;
    jsonValue: string;
    numberValue: string;
    booleanValue: boolean;
    note: string;
    category: string;
};

function rowToForm(row: KeyValueRow): FormState {
    let jsonValue = '{}';
    try {
        jsonValue = JSON.stringify(row.json, null, 2);
    } catch {
        /* */
    }
    return {
        key: row.key,
        type: row.type,
        stringValue: row.string ?? '',
        jsonValue,
        numberValue: row.number != null ? String(row.number) : '',
        booleanValue: row.boolean ?? false,
        note: row.note ?? '',
        category: row.category ?? '',
    };
}

const defaultForm = (): FormState => ({
    key: '',
    type: 'STRING',
    stringValue: '',
    jsonValue: '{}',
    numberValue: '',
    booleanValue: false,
    note: '',
    category: '',
});

// ─── Category combobox ────────────────────────────────────────────────────────

function CategoryCombobox({
    value,
    onChange,
    categories,
}: {
    value: string;
    onChange: (v: string) => void;
    categories: string[];
}) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');

    const categoriesLower = useMemo(
        () => new Set(categories.map((c) => c.toLowerCase())),
        [categories],
    );
    const filtered = useMemo(
        () => categories.filter((c) => c.toLowerCase().includes(input.toLowerCase())),
        [categories, input],
    );
    const showCreate = input.length > 0 && !categoriesLower.has(input.toLowerCase());

    function select(cat: string) {
        onChange(value === cat ? '' : cat);
        setOpen(false);
        setInput('');
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {value || (
                        <span className="text-muted-foreground">Select or create category…</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search or create category…"
                        value={input}
                        onValueChange={(v) => setInput(v.slice(0, MAX_CATEGORY_LENGTH))}
                        maxLength={MAX_CATEGORY_LENGTH}
                    />
                    <CommandList>
                        <CommandEmpty>{input ? null : 'No categories yet.'}</CommandEmpty>
                        {filtered.length > 0 && (
                            <CommandGroup heading="Existing">
                                {filtered.map((cat) => (
                                    <CommandItem key={cat} value={cat} onSelect={() => select(cat)}>
                                        <Check
                                            className={`mr-2 h-4 w-4 ${value === cat ? 'opacity-100' : 'opacity-0'}`}
                                        />
                                        {cat}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {showCreate && (
                            <CommandGroup heading="Create">
                                <CommandItem
                                    value={`__create__${input}`}
                                    onSelect={() => select(input)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create &quot;{input}&quot;
                                </CommandItem>
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ─── Edit / Create dialog ────────────────────────────────────────────────────

interface EntryDialogProps {
    entry?: KeyValueRow;
    categories: string[];
}

export function EntryDialog({ entry, categories }: EntryDialogProps) {
    const router = useRouter();
    const { toast } = useToast();
    const { theme } = useTheme();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [form, setForm] = useState<FormState>(entry ? rowToForm(entry) : defaultForm());

    const isEditing = !!entry;

    function handleOpen() {
        setForm(entry ? rowToForm(entry) : defaultForm());
        setOpen(true);
    }

    function handleSave() {
        let parsedJson: unknown = undefined;
        let invalidJson = false;
        if (form.type === 'JSON') {
            try {
                parsedJson = JSON.parse(form.jsonValue);
            } catch {
                invalidJson = true;
            }
        }

        if (invalidJson) {
            toast({
                title: 'Invalid JSON',
                description: 'Fix the JSON before saving.',
                variant: 'destructive',
            });
            return;
        }

        const payload = {
            id: entry?.id,
            key: form.key,
            type: form.type,
            string: form.type === 'STRING' || form.type === 'TEXT' ? form.stringValue : undefined,
            json: form.type === 'JSON' ? parsedJson : undefined,
            number:
                form.type === 'NUMBER'
                    ? form.numberValue !== ''
                        ? Number(form.numberValue)
                        : undefined
                    : undefined,
            boolean: form.type === 'BOOLEAN' ? form.booleanValue : undefined,
            note: form.note || undefined,
            category: form.category || undefined,
        };

        const validated = keyValueUpsertSchema.safeParse(payload);
        if (!validated.success) {
            toast({
                title: 'Error',
                description: getValidationMessage(validated.error),
                variant: 'destructive',
            });
            return;
        }

        startTransition(async () => {
            try {
                await upsertKeyValueAction(validated.data);
                setOpen(false);
                router.refresh();
                toast({
                    title: isEditing ? 'Updated' : 'Created',
                    description: `Key "${validated.data.key}" saved.`,
                });
            } catch (error: unknown) {
                toast({
                    title: 'Error',
                    description: getValidationMessage(error) || 'Unknown error',
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <>
            {isEditing ? (
                <Button size="sm" variant="outline" onClick={handleOpen}>
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="ml-1.5 hidden sm:inline">Edit</span>
                </Button>
            ) : (
                <Button onClick={handleOpen}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Entry
                </Button>
            )}

            <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
                <DialogContent className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden p-0">
                    <DialogHeader className="shrink-0 border-b px-6 py-4">
                        <DialogTitle>
                            {isEditing ? `Edit: ${entry.key}` : 'New Key-Value Entry'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update the value and note for this entry.'
                                : 'Add a new configuration entry.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
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
                                maxLength={120}
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
                                    maxLength={100000}
                                />
                            )}
                            {(form.type === 'TEXT' || form.type === 'JSON') && (
                                <MonacoEditor
                                    height="320px"
                                    language={form.type === 'JSON' ? 'json' : 'plaintext'}
                                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                    value={form.type === 'JSON' ? form.jsonValue : form.stringValue}
                                    onChange={(v) =>
                                        setForm((f) =>
                                            form.type === 'JSON'
                                                ? { ...f, jsonValue: v ?? '{}' }
                                                : { ...f, stringValue: v ?? '' },
                                        )
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
                                maxLength={1000}
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5">
                            <Label>Category (optional)</Label>
                            <CategoryCombobox
                                value={form.category}
                                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                                categories={categories}
                            />
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 border-t px-6 py-4">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
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
        </>
    );
}

// ─── Delete button ─────────────────────────────────────────────────────────

interface DeleteButtonProps {
    id: number;
    keyName: string;
}

export function DeleteButton({ id, keyName }: DeleteButtonProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteKeyValueAction(id);
                setOpen(false);
                router.refresh();
                toast({ title: 'Deleted', description: `Key "${keyName}" removed.` });
            } catch (err: unknown) {
                toast({
                    title: 'Error',
                    description: err instanceof Error ? err.message : 'Unknown error',
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <>
            <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                <span className="ml-1.5 hidden sm:inline">Delete</span>
            </Button>
            <AlertDialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove{' '}
                            <span className="font-mono font-semibold">{keyName}</span>. This action
                            cannot be undone.
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
        </>
    );
}
