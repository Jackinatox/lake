'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GameServer } from '@/models/gameServerModel';
import { EggFeature } from '@/app/client/generated/browser';
import { Clipboard, Check, X, Code } from 'lucide-react';

interface DebugPanelProps {
    data: {
        server: GameServer;
        ptApiKey: string;
        features: EggFeature[];
    };
}

export default function DebugPanel({ data }: DebugPanelProps) {
    const [debugOpen, setDebugOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
                setDebugOpen((v) => !v);
            }
            // close with Escape
            if (e.key === 'Escape') setDebugOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const safeStringify = (obj: any) => {
        try {
            const seen = new WeakSet();
            return JSON.stringify(
                obj,
                function (_k, v) {
                    if (typeof v === 'object' && v !== null) {
                        if (seen.has(v)) return '[Circular]';
                        seen.add(v);
                    }
                    return v;
                },
                2,
            );
        } catch (err) {
            return String(err);
        }
    };

    const propsJson = safeStringify(data);

    const copyJson = async () => {
        try {
            await navigator.clipboard.writeText(propsJson);
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus(''), 2000);
        } catch {
            setCopyStatus('Failed');
            setTimeout(() => setCopyStatus(''), 2000);
        }
    };

    if (!debugOpen) return null;

    return (
        <>
            {/* backdrop */}
            <div
                className="fixed inset-0 z-[59] bg-black/40 backdrop-blur-sm"
                onClick={() => setDebugOpen(false)}
                aria-hidden
            />

            <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-background border shadow-lg rounded-md overflow-hidden transform transition duration-150 ease-out">
                    <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-background/50 to-background">
                        <div className="flex items-start gap-3">
                            <Code className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                                <div className="text-sm font-semibold">Debug: Props Snapshot</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Press{' '}
                                    <span className="px-1.5 py-0.5 rounded bg-muted-foreground/10 text-xs">
                                        Ctrl
                                    </span>{' '}
                                    +{' '}
                                    <span className="px-1.5 py-0.5 rounded bg-muted-foreground/10 text-xs">
                                        Alt
                                    </span>{' '}
                                    +{' '}
                                    <span className="px-1.5 py-0.5 rounded bg-muted-foreground/10 text-xs">
                                        D
                                    </span>{' '}
                                    to toggle
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={copyJson} title="Copy JSON">
                                {copyStatus === 'Copied!' ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Clipboard className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDebugOpen(false)}
                                aria-label="Close debug panel"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-3">
                        <pre className="whitespace-pre-wrap max-h-[60vh] overflow-auto text-xs font-mono bg-slate-900/80 text-white p-3 rounded-md">
                            {propsJson}
                        </pre>
                        {copyStatus && (
                            <div className="text-sm mt-2 text-muted-foreground">{copyStatus}</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
