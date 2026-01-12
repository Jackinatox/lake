'use client';

import { Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
    SatisfactoryEggId,
    PaperEggId,
    VanillaEggId,
    ForgeEggId,
    FabricEggId,
    NeoForgeEggId,
} from '@/app/GlobalConstants';

interface ServerAddressProps {
    address: string;
    port: number;
    eggId: number;
}

export function ServerAddress({ address, port, eggId }: ServerAddressProps) {
    const t = useTranslations();
    const [copiedIP, setCopiedIP] = useState(false);
    const [copiedPort, setCopiedPort] = useState(false);
    const [copiedCombined, setCopiedCombined] = useState(false);

    const minecraftEggs = [PaperEggId, VanillaEggId, ForgeEggId, FabricEggId, NeoForgeEggId];
    const isMinecraft = minecraftEggs.includes(eggId);
    const isSatisfactory = eggId === SatisfactoryEggId;

    const ipPortCombo = `${address}:${port}`;

    const handleCopy = async (text: string, type: 'ip' | 'port' | 'combined') => {
        await navigator.clipboard.writeText(text);

        if (type === 'ip') {
            setCopiedIP(true);
            setTimeout(() => setCopiedIP(false), 2000);
        } else if (type === 'port') {
            setCopiedPort(true);
            setTimeout(() => setCopiedPort(false), 2000);
        } else {
            setCopiedCombined(true);
            setTimeout(() => setCopiedCombined(false), 2000);
        }
    };

    // Minecraft and default games: single button for IP:Port
    if (isMinecraft || (!isSatisfactory && !isMinecraft)) {
        return (
            <span className="flex items-center gap-2">
                {ipPortCombo}
                <button
                    type="button"
                    className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                    title={t('gameserver.dashboard.copyIPPort')}
                    onClick={() => handleCopy(ipPortCombo, 'combined')}
                >
                    <Copy className="h-3 w-3 inline mr-1" />
                    {copiedCombined ? '✓' : t('gameserver.dashboard.copyIPPort')}
                </button>
            </span>
        );
    }

    // Satisfactory: separate buttons for IP and Port
    if (isSatisfactory) {
        return (
            <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2">
                    <span className="font-medium text-xs text-slate-600 dark:text-slate-400">
                        IP:
                    </span>
                    <span>{address}</span>
                    <button
                        type="button"
                        className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                        title="Copy IP"
                        onClick={() => handleCopy(address, 'ip')}
                    >
                        <Copy className="h-3 w-3 inline mr-1" />
                        {copiedIP ? '✓' : 'Copy'}
                    </button>
                </span>
                <span className="flex items-center gap-2">
                    <span className="font-medium text-xs text-slate-600 dark:text-slate-400">
                        Port:
                    </span>
                    <span>{port}</span>
                    <button
                        type="button"
                        className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                        title="Copy Port"
                        onClick={() => handleCopy(port.toString(), 'port')}
                    >
                        <Copy className="h-3 w-3 inline mr-1" />
                        {copiedPort ? '✓' : 'Copy'}
                    </button>
                </span>
            </div>
        );
    }

    return null;
}
