'use client';

import { Check, ChevronDown, Copy, EthernetPort } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getServerAddressConfig } from './serverAddressConfig';

export interface Allocation {
    id: number;
    ip: string;
    ip_alias: string | null;
    port: number;
    notes: string | null;
    is_default: boolean;
}

interface ServerAddressProps {
    gameSlug: string;
    allocations: Allocation[];
    /** Tight layout for the mobile header row. */
    compact?: boolean;
    className?: string;
}

const addressOf = (a: Allocation) => a.ip_alias || a.ip;

/** Hook returning a copy fn and the key of the most recently copied item. */
function useCopy() {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const copy = useCallback(async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopiedKey(key);
        setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    }, []);

    return { copiedKey, copy };
}

/** A labelled value row (used inside the mobile menu) with its own copy button. */
function FieldRow({
    label,
    value,
    copyText,
    copyKey,
    copyLabel,
    copiedKey,
    onCopy,
}: {
    label: string;
    value: string;
    copyText: string;
    copyKey: string;
    copyLabel: string;
    copiedKey: string | null;
    onCopy: (text: string, key: string) => void;
}) {
    const copied = copiedKey === copyKey;
    return (
        <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60">
            <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {label}
                </div>
                <div className="truncate font-mono text-sm">{value}</div>
            </div>
            <button
                type="button"
                aria-label={copyLabel}
                title={copyLabel}
                onClick={() => onCopy(copyText, copyKey)}
                className={cn(
                    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                    'hover:bg-muted text-muted-foreground hover:text-foreground',
                    copied && 'text-green-600 dark:text-green-400',
                )}
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
        </div>
    );
}

/**
 * ServerAddress — shows the primary connection address for a game server.
 *
 * Only the details needed to connect are shown here; every other port is
 * handled in the Network Manager. Presentation is driven by per-game config
 * (see serverAddressConfig.ts):
 * - combined mode copies the full "address:port" in one click (Minecraft, Valheim)
 * - separate mode copies the address and port independently (Satisfactory)
 *
 * On desktop the address sits inline in the header. On the tight mobile row it
 * collapses to a single trigger that opens the connection details in a menu.
 */
export function ServerAddress({ gameSlug, allocations, compact, className }: ServerAddressProps) {
    const t = useTranslations('gameserver.dashboard.address');
    const { copiedKey, copy } = useCopy();

    const config = getServerAddressConfig(gameSlug);
    const primary = allocations.find((a) => a.is_default) ?? allocations[0];

    if (!primary) return null;

    const primaryAddress = addressOf(primary);
    const primaryPort = String(primary.port);
    const primaryCombo = `${primaryAddress}:${primary.port}`;
    const isSeparate = config.primaryMode === 'separate';

    /* ── Mobile: collapse to a single trigger; details live in the menu ── */
    if (compact) {
        return (
            <div className={cn('flex items-center text-sm', className)}>
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            aria-label={t('connect')}
                            title={t('connect')}
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 transition-colors hover:bg-muted"
                        >
                            <EthernetPort className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-2">
                        <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t('connectionDetails')}
                        </div>
                        {isSeparate ? (
                            <>
                                <FieldRow
                                    label={t('address')}
                                    value={primaryAddress}
                                    copyText={primaryAddress}
                                    copyKey="address"
                                    copyLabel={t('copyAddress')}
                                    copiedKey={copiedKey}
                                    onCopy={copy}
                                />
                                <FieldRow
                                    label={t('port')}
                                    value={primaryPort}
                                    copyText={primaryPort}
                                    copyKey="port"
                                    copyLabel={t('copyPort')}
                                    copiedKey={copiedKey}
                                    onCopy={copy}
                                />
                            </>
                        ) : (
                            <FieldRow
                                label={t('serverAddress')}
                                value={primaryCombo}
                                copyText={primaryCombo}
                                copyKey="primary"
                                copyLabel={t('copyFull')}
                                copiedKey={copiedKey}
                                onCopy={copy}
                            />
                        )}
                    </PopoverContent>
                </Popover>
            </div>
        );
    }

    /* ── Desktop: address shown inline ─────────────────────────────────── */
    return (
        <div className={cn('flex items-center text-sm', className)}>
            <div className="inline-flex h-8 items-center overflow-hidden rounded-md border bg-card">
                {isSeparate ? (
                    <>
                        <button
                            type="button"
                            onClick={() => copy(primaryAddress, 'address')}
                            aria-label={t('copyAddress')}
                            title={t('copyAddress')}
                            className="flex h-full items-center gap-1.5 px-2.5 transition-colors hover:bg-muted"
                        >
                            <EthernetPort className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate font-mono max-w-[8rem] lg:max-w-[12rem]">
                                {primaryAddress}
                            </span>
                            {copiedKey === 'address' ? (
                                <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                            ) : (
                                <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                        </button>
                        <div className="h-4 w-px bg-border" />
                        <button
                            type="button"
                            onClick={() => copy(primaryPort, 'port')}
                            aria-label={t('copyPort')}
                            title={t('copyPort')}
                            className="flex h-full items-center gap-1.5 px-2.5 transition-colors hover:bg-muted"
                        >
                            <span className="text-xs text-muted-foreground">{t('port')}</span>
                            <span className="font-mono">{primary.port}</span>
                            {copiedKey === 'port' ? (
                                <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                            ) : (
                                <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => copy(primaryCombo, 'primary')}
                        aria-label={t('copyFull')}
                        title={t('copyFull')}
                        className="flex h-full items-center gap-1.5 px-2.5 transition-colors hover:bg-muted"
                    >
                        <EthernetPort className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-mono max-w-[10rem] lg:max-w-[15rem]">
                            {primaryCombo}
                        </span>
                        {copiedKey === 'primary' ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                        ) : (
                            <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
