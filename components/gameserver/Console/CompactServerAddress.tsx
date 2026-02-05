'use client';

import { Copy, Check, ChevronDown, EthernetPort } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    SatisfactoryEggId,
    PaperEggId,
    VanillaEggId,
    ForgeEggId,
    FabricEggId,
    NeoForgeEggId,
} from '@/app/GlobalConstants';

interface Allocation {
    id: number;
    ip: string;
    ip_alias: string | null;
    port: number;
    notes: string | null;
    is_default: boolean;
}

interface CompactServerAddressProps {
    /** Primary/default allocation */
    address: string;
    port: number;
    eggId: number;
    /** Additional allocations (optional) */
    allocations?: Allocation[];
    /** Compact mode - always use dropdown even for simple addresses */
    compact?: boolean;
    className?: string;
}

// Separate CopyButton component defined outside
interface CopyButtonProps {
    text: string;
    copyKey: string;
    label: string;
    iconOnly?: boolean;
    isCopied: boolean;
    onCopy: (text: string, key: string) => void;
}

function CopyButton({ text, copyKey, label, iconOnly = false, isCopied, onCopy }: CopyButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopy(text, copyKey);
                    }}
                    className={cn(
                        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors',
                        'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground',
                        isCopied && 'bg-green-500/20 text-green-600 dark:text-green-400',
                    )}
                >
                    {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {!iconOnly && <span>{isCopied ? '✓' : label}</span>}
                </button>
            </TooltipTrigger>
            <TooltipContent>{isCopied ? 'Copied!' : `Copy ${label}`}</TooltipContent>
        </Tooltip>
    );
}

/**
 * CompactServerAddress - A responsive server address display component
 *
 * Features:
 * - Single address: Shows IP:Port with copy button
 * - Multiple allocations: Dropdown menu with all allocations
 * - Satisfactory: Shows IP and Port separately with individual copy
 * - Compact mode: Minimal footprint, expandable on interaction
 */
export function CompactServerAddress({
    address,
    port,
    eggId,
    allocations = [],
    compact = false,
    className,
}: CompactServerAddressProps) {
    const t = useTranslations();
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const minecraftEggs = [PaperEggId, VanillaEggId, ForgeEggId, FabricEggId, NeoForgeEggId];
    const isMinecraft = minecraftEggs.includes(eggId);
    const isSatisfactory = eggId === SatisfactoryEggId;

    // For games that need separate IP/Port (like Satisfactory) - determined by egg type
    const needsSeparateDisplay = isSatisfactory;

    const ipPortCombo = `${address}:${port}`;

    const handleCopy = useCallback(async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        }
    }, []);

    // COMPACT MODE: Always show in dropdown/tooltip
    if (compact) {
        if (needsSeparateDisplay) {
            // Satisfactory: Dropdown with separate IP and Port items
            return (
                <div className={cn('flex items-center gap-1 text-sm', className)}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 font-mono text-xs gap-1"
                                aria-label={`Connection details for ${address}`}
                            >
                                <EthernetPort className="h-3 w-3 text-muted-foreground" />
                                {/* Show a "Connect" label when there's space (md+), otherwise keep icon-only */}
                                <span className="hidden md:inline ml-1">Connect</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                            <DropdownMenuLabel className="text-xs">
                                Connection Details
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-8">
                                            IP:
                                        </span>
                                        <span className="font-mono text-sm truncate max-w-35">
                                            {address}
                                        </span>
                                    </div>
                                    <CopyButton
                                        text={address}
                                        copyKey="ip"
                                        label="IP"
                                        iconOnly
                                        isCopied={copiedKey === 'ip'}
                                        onCopy={handleCopy}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-8">
                                            Port:
                                        </span>
                                        <span className="font-mono text-sm">{port}</span>
                                    </div>
                                    <CopyButton
                                        text={port.toString()}
                                        copyKey="port"
                                        label="Port"
                                        iconOnly
                                        isCopied={copiedKey === 'port'}
                                        onCopy={handleCopy}
                                    />
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        } else {
            // Other games: Dropdown with combined IP:Port
            return (
                <div className={cn('flex items-center gap-1 text-sm', className)}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 font-mono text-xs gap-1"
                                aria-label={`Connection address ${ipPortCombo}`}
                            >
                                <EthernetPort className="h-3 w-3 text-muted-foreground" />
                                {/* Show IP:Port earlier on small screens for Minecraft (sm+), otherwise show at md+ */}
                                <span className={cn(isMinecraft ? 'hidden sm:inline' : 'hidden md:inline', 'ml-1 font-mono truncate max-w-32')}>{ipPortCombo}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                            <DropdownMenuLabel className="text-xs">
                                Connection Address
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm">{ipPortCombo}</span>
                                    <CopyButton
                                        text={ipPortCombo}
                                        copyKey="address"
                                        label="Address"
                                        iconOnly
                                        isCopied={copiedKey === 'address'}
                                        onCopy={handleCopy}
                                    />
                                </div>
                            </div>
                            {allocations.length > 1 && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs">
                                        Additional Allocations
                                    </DropdownMenuLabel>
                                    {allocations
                                        .filter((alloc) => !alloc.is_default)
                                        .map((alloc) => {
                                            const allocCombo = `${alloc.ip_alias || alloc.ip}:${alloc.port}`;
                                            return (
                                                <div key={alloc.id} className="px-2 py-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-xs">
                                                            {allocCombo}
                                                        </span>
                                                        <CopyButton
                                                            text={allocCombo}
                                                            copyKey={`alloc-${alloc.id}`}
                                                            label="Copy"
                                                            iconOnly
                                                            isCopied={
                                                                copiedKey === `alloc-${alloc.id}`
                                                            }
                                                            onCopy={handleCopy}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        }
    }

    // NON-COMPACT MODE: Show inline directly
    if (needsSeparateDisplay) {
        // Satisfactory: Show IP and Port separately inline
        return (
            <div className={cn('flex items-center gap-3 text-xs font-mono', className)}>
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">IP:</span>
                    <span className="truncate max-w-32">{address}</span>
                    <button
                        type="button"
                        onClick={() => handleCopy(address, 'ip-inline')}
                        className="p-1 rounded hover:bg-muted transition-colors"
                    >
                        {copiedKey === 'ip-inline' ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Port:</span>
                    <span>{port}</span>
                    <button
                        type="button"
                        onClick={() => handleCopy(port.toString(), 'port-inline')}
                        className="p-1 rounded hover:bg-muted transition-colors"
                    >
                        {copiedKey === 'port-inline' ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Standard display for other games - inline combined format
    // Multiple allocations: show dropdown
    if (allocations.length > 1) {
        const defaultAlloc = allocations.find((a) => a.is_default) || allocations[0];
        const defaultAddress = defaultAlloc.ip_alias || defaultAlloc.ip;
        const defaultCombo = `${defaultAddress}:${defaultAlloc.port}`;

        return (
            <div className={cn('flex items-center gap-1 text-sm', className)}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 font-mono text-xs gap-1"
                        >
                            <EthernetPort className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-20 sm:max-w-28 lg:max-w-40 truncate">
                                {defaultCombo}
                            </span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72">
                        <DropdownMenuLabel className="text-xs">
                            Server Allocations
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allocations.map((alloc) => {
                            const allocAddress = alloc.ip_alias || alloc.ip;
                            const allocCombo = `${allocAddress}:${alloc.port}`;
                            return (
                                <DropdownMenuItem
                                    key={alloc.id}
                                    className="flex items-center justify-between gap-2 cursor-pointer"
                                    onClick={() => handleCopy(allocCombo, `alloc-${alloc.id}`)}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="font-mono text-sm truncate">
                                            {allocCombo}
                                        </span>
                                        {alloc.is_default && (
                                            <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                                                Default
                                            </span>
                                        )}
                                        {alloc.notes && (
                                            <span className="text-[10px] text-muted-foreground truncate max-w-16">
                                                {alloc.notes}
                                            </span>
                                        )}
                                    </div>
                                    {copiedKey === `alloc-${alloc.id}` ? (
                                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                                    ) : (
                                        <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    // Single allocation: simple display with copy
    if (compact) {
        return (
            <div className={cn('flex items-center gap-1 text-sm', className)}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 font-mono text-xs gap-1 bg-muted/50 hover:bg-muted"
                            aria-label={`Copy connection ${ipPortCombo}`}
                            onClick={() => handleCopy(ipPortCombo, 'main')}
                        >
                            <EthernetPort className="h-3 w-3 text-muted-foreground" />
                            {/* Hide the IP:Port on very small screens; show at sm+ for Minecraft, md+ for others */}
                            <span className={cn(isMinecraft ? 'hidden sm:inline' : 'hidden md:inline', 'ml-1 max-w-20 sm:max-w-28 lg:max-w-40 truncate')}>
                                {ipPortCombo}
                            </span>
                            {copiedKey === 'main' ? (
                                <Check className="h-3 w-3 text-green-500" />
                            ) : (
                                <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {copiedKey === 'main' ? 'Copied!' : 'Click to copy'}
                    </TooltipContent>
                </Tooltip>
            </div>
        );
    }

    // Single allocation - simple combined IP:Port display inline
    return (
        <div className={cn('flex items-center gap-1 text-sm', className)}>
            <span className="font-mono text-xs truncate max-w-32">{ipPortCombo}</span>
            <CopyButton
                text={ipPortCombo}
                copyKey="main"
                label={t('gameserver.dashboard.copyIPPort')}
                isCopied={copiedKey === 'main'}
                onCopy={handleCopy}
            />
        </div>
    );
}
