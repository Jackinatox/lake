'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSendCommand, useServerStatus } from '@/hooks/useServerWebSocket';
import { useServerFile } from '@/hooks/useServerFile';
import {
    OTHER_CATEGORY_ID,
    type ConfigCategory,
    type ConfigField,
    type ConfigFormat,
} from '@/lib/gameConfig/types';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    FileCode,
    FileQuestion,
    Loader2,
    Lock,
    RefreshCw,
    Search,
    type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';

// Monaco is heavy; only load it when the user actually opens the raw text editor.
const FileEditorDialog = dynamic(
    () => import('../FileManager/components/FileEditorDialog').then((m) => m.FileEditorDialog),
    { ssr: false },
);

interface ConfigFileEditorProps<Doc> {
    serverId: string;
    apiKey: string;
    filePath: string;
    format: ConfigFormat<Doc>;
    fields: ConfigField[];
    categories: ConfigCategory[];
    /** Keys owned by another panel; hidden here so two editors never write the same key. */
    excludeKeys?: string[];
    /** i18n namespace holding `title`, `description`, `fields`, `categories`, `options`. */
    namespace: string;
    icon: LucideIcon;
}

type Row = ConfigField & { uncurated?: boolean };

const CUSTOM_OPTION = '__custom__';

/** Whether `value` is something the field's typed control (switch, select, number) can show. */
function isRecognized(field: ConfigField, value: string): boolean {
    switch (field.type) {
        case 'boolean':
            return value === 'true' || value === 'false';
        case 'enum':
            return (field.options ?? []).some((option) => option.value === value);
        case 'number': {
            if (!/^-?\d+$/.test(value.trim())) return false;
            const n = Number(value);
            if (field.min !== undefined && n < field.min) return false;
            if (field.max !== undefined && n > field.max) return false;
            return true;
        }
        default:
            return true;
    }
}

/**
 * Form editor for one config file. Generic over the file format and field schema; see
 * docs/game-config-editors.md. Only curated fields whose key exists in the file are shown,
 * any other key in the file lands in the "Other" category as a text input.
 */
export default function ConfigFileEditor<Doc>({
    serverId,
    apiKey,
    filePath,
    format,
    fields,
    categories,
    excludeKeys = [],
    namespace,
    icon: Icon,
}: ConfigFileEditorProps<Doc>) {
    const t = useTranslations('gameserver.config.editor');
    const tf = useTranslations(namespace);
    const { toast } = useToast();
    const serverStatus = useServerStatus();
    const { sendPowerAction } = useSendCommand();
    const file = useServerFile(serverId, filePath, apiKey, { revalidateOnMount: true });

    const [draft, setDraft] = useState<Record<string, string>>({});
    // Per-key choice between the typed control and a free text field. Without an entry, a key
    // gets the free text field only when its saved value isn't recognised (e.g. a modded
    // difficulty), so unknown values are never silently replaced.
    const [modeOverride, setModeOverride] = useState<Record<string, 'custom' | 'typed'>>({});
    const [search, setSearch] = useState('');
    // null = first category with rows
    const [category, setCategory] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [restartPending, setRestartPending] = useState(false);
    const [textEditorOpen, setTextEditorOpen] = useState(false);
    const [textSaving, setTextSaving] = useState(false);
    const textDraftRef = useRef('');

    const doc = useMemo(
        () => (file.content !== null ? format.parse(file.content) : null),
        [file.content, format],
    );

    const rows = useMemo<Row[]>(() => {
        if (!doc) return [];
        const present = new Set(format.keys(doc).filter((key) => !excludeKeys.includes(key)));
        const curated = fields.filter((field) => present.has(field.key));
        const curatedKeys = new Set(curated.map((field) => field.key));
        const uncurated: Row[] = [...present]
            .filter((key) => !curatedKeys.has(key))
            .sort()
            .map((key) => ({
                key,
                id: key,
                type: 'string',
                category: OTHER_CATEGORY_ID,
                uncurated: true,
            }));
        return [...curated, ...uncurated];
    }, [doc, format, fields, excludeKeys]);

    const savedValue = (key: string) => (doc ? (format.get(doc, key) ?? '') : '');
    const valueOf = (key: string) => draft[key] ?? savedValue(key);

    const isCustom = (row: Row) => {
        if (row.locked || row.type === 'string') return false;
        const override = modeOverride[row.key];
        if (override) return override === 'custom';
        return !isRecognized(row, savedValue(row.key));
    };

    const changedKeys = Object.keys(draft).filter((key) => draft[key] !== savedValue(key));
    const invalidKeys = rows
        .filter(
            (row) =>
                row.type === 'number' &&
                !isCustom(row) &&
                draft[row.key] !== undefined &&
                !isRecognized(row, draft[row.key]),
        )
        .map((row) => row.key);
    const isDirty = changedKeys.length > 0;

    const labelOf = (row: Row) => (row.uncurated ? row.key : tf(`fields.${row.id}.label`));

    // Tabs only exist for curated categories. Keys without a curated field have no tab and
    // are reached through the search, which always covers every key in the file.
    const curatedCategories = categories.filter((cat) =>
        rows.some((row) => row.category === cat.id),
    );
    const tabs = curatedCategories.length > 0 ? curatedCategories : [{ id: OTHER_CATEGORY_ID }];
    const activeCategory =
        category && tabs.some((tab) => tab.id === category) ? category : tabs[0].id;
    const query = search.trim().toLowerCase();

    const visibleRows = query
        ? rows.filter(
              (row) =>
                  row.key.toLowerCase().includes(query) ||
                  labelOf(row).toLowerCase().includes(query),
          )
        : rows.filter((row) => row.category === activeCategory);

    const categoryLabel = (id: string) =>
        id === OTHER_CATEGORY_ID ? t('otherCategory') : tf(`categories.${id}`);

    const setValue = (key: string, value: string) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
    };

    const setMode = (key: string, mode: 'custom' | 'typed') => {
        setModeOverride((prev) => ({ ...prev, [key]: mode }));
    };

    const discard = () => {
        setDraft({});
        setModeOverride({});
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Re-read the file and apply only our changed keys, so values the server
            // wrote in the meantime survive.
            await file.update((current) => {
                let next = format.parse(current ?? '');
                for (const key of changedKeys) next = format.set(next, key, draft[key]);
                return format.serialize(next);
            });
            discard();
            if (serverStatus === 'running' || serverStatus === 'starting') {
                setRestartPending(true);
            }
            toast({ title: t('saved'), description: t('savedDescription') });
        } catch (error) {
            console.error('Failed to save config file', error);
            toast({
                title: t('saveFailed'),
                description: t('saveFailedDescription'),
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleRestart = () => {
        sendPowerAction('restart');
        setRestartPending(false);
    };

    const handleTextSave = async () => {
        setTextSaving(true);
        try {
            await file.save(textDraftRef.current);
            setTextEditorOpen(false);
            if (serverStatus === 'running' || serverStatus === 'starting') {
                setRestartPending(true);
            }
            toast({ title: t('saved'), description: t('savedDescription') });
        } catch (error) {
            console.error('Failed to save config file', error);
            toast({
                title: t('saveFailed'),
                description: t('saveFailedDescription'),
                variant: 'destructive',
            });
        } finally {
            setTextSaving(false);
        }
    };

    const renderControl = (row: Row) => {
        const value = valueOf(row.key);
        const controlId = `config-${row.key}`;

        if (row.locked) {
            return (
                <Input
                    id={controlId}
                    value={value}
                    readOnly
                    disabled
                    className="h-9 font-mono text-sm"
                />
            );
        }

        if (isCustom(row)) {
            return (
                <Input
                    id={controlId}
                    value={value}
                    onChange={(event) => setValue(row.key, event.target.value)}
                    spellCheck={false}
                    className="h-9 font-mono text-sm"
                />
            );
        }

        switch (row.type) {
            case 'boolean':
                return (
                    <Switch
                        id={controlId}
                        checked={value === 'true'}
                        onCheckedChange={(checked) => setValue(row.key, checked ? 'true' : 'false')}
                    />
                );
            case 'enum': {
                const options = row.options ?? [];
                return (
                    <Select
                        value={value}
                        onValueChange={(next) => {
                            if (next === CUSTOM_OPTION) setMode(row.key, 'custom');
                            else setValue(row.key, next);
                        }}
                    >
                        <SelectTrigger id={controlId} className="h-9 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {tf(`options.${row.id}.${option.id}`)}
                                </SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem value={CUSTOM_OPTION}>{t('customValueOption')}</SelectItem>
                        </SelectContent>
                    </Select>
                );
            }
            case 'number': {
                const invalid = invalidKeys.includes(row.key);
                return (
                    <Input
                        id={controlId}
                        type="number"
                        inputMode="numeric"
                        min={row.min}
                        max={row.max}
                        value={value}
                        onChange={(event) => setValue(row.key, event.target.value)}
                        aria-invalid={invalid}
                        className={cn(
                            'h-9 tabular-nums',
                            invalid && 'border-destructive focus-visible:ring-destructive',
                        )}
                    />
                );
            }
            default:
                return (
                    <Input
                        id={controlId}
                        value={value}
                        onChange={(event) => setValue(row.key, event.target.value)}
                        className="h-9"
                    />
                );
        }
    };

    /** Shown under a field in free-text mode: why it is free text, and a way back. */
    const renderCustomHint = (row: Row) => {
        const saved = savedValue(row.key);
        const unknown = !modeOverride[row.key] && !isRecognized(row, saved);
        const standardValues =
            row.type === 'boolean'
                ? [
                      { value: 'true', label: 'true' },
                      { value: 'false', label: 'false' },
                  ]
                : row.type === 'enum'
                  ? (row.options ?? []).map((option) => ({
                        value: option.value,
                        label: tf(`options.${row.id}.${option.id}`),
                    }))
                  : [];

        return (
            <div className="space-y-1 pt-0.5 text-xs">
                {unknown ? (
                    <p className="flex items-start gap-1 text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                        <span>{t('unknownValue')}</span>
                    </p>
                ) : (
                    <p className="text-muted-foreground">{t('customValueHint')}</p>
                )}
                {row.type === 'number' && (
                    <p className="text-muted-foreground">
                        {t('expectedNumber', { min: row.min ?? '−∞', max: row.max ?? '∞' })}
                    </p>
                )}
                {standardValues.length > 0 && (
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-muted-foreground">
                        <span>{t('standardValues')}</span>
                        {standardValues.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className="font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
                                onClick={() => {
                                    setValue(row.key, option.value);
                                    setMode(row.key, 'typed');
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </p>
                )}
            </div>
        );
    };

    const renderRow = (row: Row) => {
        const modified = changedKeys.includes(row.key);
        const invalid = invalidKeys.includes(row.key);
        const custom = isCustom(row);
        const isBoolean = row.type === 'boolean' && !row.locked && !custom;

        return (
            <div
                key={row.key}
                className={cn(
                    'flex gap-2 py-3',
                    isBoolean
                        ? 'flex-row items-center justify-between'
                        : 'flex-col sm:flex-row sm:items-center sm:justify-between',
                )}
            >
                <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Label htmlFor={`config-${row.key}`} className="text-sm font-medium">
                            {labelOf(row)}
                        </Label>
                        {modified && (
                            <span
                                className="h-1.5 w-1.5 rounded-full bg-blue-500"
                                title={t('modified')}
                            />
                        )}
                        {row.locked && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Lock className="h-3 w-3" />
                                {t('locked')}
                            </span>
                        )}
                    </div>
                    {!row.uncurated && (
                        <p className="text-xs text-muted-foreground">
                            {tf(`fields.${row.id}.description`)}
                        </p>
                    )}
                    {!row.uncurated && (
                        <code className="block text-[11px] text-muted-foreground/70 break-all">
                            {row.key}
                        </code>
                    )}
                    {row.warning && (
                        <p className="flex items-start gap-1 text-xs text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                            {tf(`fields.${row.id}.warning`)}
                        </p>
                    )}
                    {custom && renderCustomHint(row)}
                    {invalid && (
                        <p className="text-xs text-destructive">
                            {t('invalidNumber', {
                                min: row.min ?? '−∞',
                                max: row.max ?? '∞',
                            })}
                        </p>
                    )}
                </div>
                <div className={cn('shrink-0', isBoolean ? '' : 'w-full sm:w-56')}>
                    {renderControl(row)}
                </div>
            </div>
        );
    };

    const renderBody = () => {
        if (!file.loaded || (file.loading && !doc)) {
            return (
                <div className="space-y-3">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            );
        }

        if (file.error && !doc) {
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('loadFailed')}</AlertTitle>
                    <AlertDescription>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => void file.reload()}
                        >
                            {t('retry')}
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }

        if (file.notFound || !doc) {
            return (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <FileQuestion className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">{t('notFoundTitle', { file: filePath })}</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        {t('notFoundDescription')}
                    </p>
                </div>
            );
        }

        // Search results span all categories, so group them under headings.
        const groups = query
            ? [...curatedCategories, { id: OTHER_CATEGORY_ID }]
                  .map((cat) => ({
                      id: cat.id,
                      rows: visibleRows.filter((row) => row.category === cat.id),
                  }))
                  .filter((group) => group.rows.length > 0)
            : [{ id: activeCategory, rows: visibleRows }];

        return (
            <div className="space-y-3">
                <nav
                    aria-label={t('categoriesLabel')}
                    className="-mx-3 flex overflow-x-auto border-b px-1.5 [scrollbar-width:none]"
                >
                    {tabs.map((cat) => {
                        const active = !query && activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                aria-current={active ? 'true' : undefined}
                                onClick={() => {
                                    setCategory(cat.id);
                                    setSearch('');
                                }}
                                className={cn(
                                    'relative shrink-0 whitespace-nowrap px-2.5 py-2 text-sm transition-colors',
                                    'after:absolute after:inset-x-2.5 after:-bottom-px after:h-0.5 after:rounded-full',
                                    active
                                        ? 'font-medium text-foreground after:bg-primary'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {categoryLabel(cat.id)}
                            </button>
                        );
                    })}
                </nav>

                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="h-9 pl-8"
                    />
                </div>

                {visibleRows.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        {t('noResults')}
                    </p>
                ) : (
                    groups.map((group) => (
                        <section key={group.id}>
                            {query && (
                                <h4 className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {categoryLabel(group.id)}
                                </h4>
                            )}
                            <div className="divide-y">{group.rows.map(renderRow)}</div>
                        </section>
                    ))
                )}
            </div>
        );
    };

    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="p-3 pb-0 md:p-3 md:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="truncate">{tf('title')}</span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{tf('description')}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 px-2"
                            onClick={() => void file.reload()}
                            disabled={file.loading || saving}
                            title={t('reloadHint')}
                        >
                            <RefreshCw className={cn('h-4 w-4', file.loading && 'animate-spin')} />
                            {t('reload')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 px-2"
                            onClick={() => {
                                textDraftRef.current = file.content ?? '';
                                setTextEditorOpen(true);
                            }}
                            disabled={!doc || isDirty}
                            title={isDirty ? t('editAsTextDirty') : t('editAsText')}
                        >
                            <FileCode className="h-4 w-4" />
                            {t('editAsText')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-3">
                {restartPending && !isDirty && (
                    <Alert className="mb-3 border-amber-500/50 bg-amber-500/5">
                        <RefreshCw className="h-4 w-4 !text-amber-600" />
                        <AlertTitle>{t('restartRequired')}</AlertTitle>
                        <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-muted-foreground">
                                {t('restartRequiredDescription')}
                            </span>
                            <Button size="sm" className="shrink-0" onClick={handleRestart}>
                                {t('restartNow')}
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                {renderBody()}

                {isDirty && (
                    <div className="sticky bottom-0 z-10 -mx-3 -mb-3 mt-3 flex flex-col gap-2 rounded-b-lg border-t bg-background/95 px-3 py-2 backdrop-blur supports-backdrop-filter:bg-background/80 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-muted-foreground">
                            {t('unsavedChanges', { count: changedKeys.length })}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1 sm:flex-none"
                                onClick={discard}
                                disabled={saving}
                            >
                                {t('discard')}
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1 sm:flex-none"
                                onClick={() => void handleSave()}
                                disabled={saving || invalidKeys.length > 0}
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('save')}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            {textEditorOpen && (
                <FileEditorDialog
                    open={textEditorOpen}
                    fileName={filePath.split('/').pop() ?? filePath}
                    filePath={filePath}
                    isBinary={false}
                    loading={false}
                    saving={textSaving}
                    content={file.content ?? ''}
                    onClose={() => setTextEditorOpen(false)}
                    onChange={(value) => {
                        textDraftRef.current = value;
                    }}
                    onSave={() => void handleTextSave()}
                />
            )}
        </Card>
    );
}
