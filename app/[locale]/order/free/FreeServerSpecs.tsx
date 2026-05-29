'use client';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight, CreditCard, Database, HardDrive, MemoryStick, Network, Zap } from 'lucide-react';
import Link from 'next/link';

interface FreeServerSpecsProps {
    cpu: string;
    ram: string;
    disk: string;
    backups: number;
    ports: number;
}

export default function FreeServerSpecs({ cpu, ram, disk, backups, ports }: FreeServerSpecsProps) {
    const specs = [
        { icon: Zap, value: cpu, label: 'CPU' },
        { icon: MemoryStick, value: ram, label: 'RAM' },
        { icon: HardDrive, value: disk, label: 'Disk' },
        { icon: Database, value: String(backups), label: 'Backups' },
        { icon: Network, value: String(ports), label: 'Ports' },
        { icon: CreditCard, value: 'Kostenlos', label: 'Keine Zahlungsinfos nötig' },
    ];

    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-6">
                {specs.map((spec) => (
                    <div key={spec.label} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <spec.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-foreground">{spec.value}</p>
                            <p className="text-xs text-muted-foreground">{spec.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Collapsible>
                <CollapsibleTrigger className="group flex w-full cursor-pointer select-none items-center gap-2 border-t border-border px-6 py-4 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                    Warum ist der Server kostenlos?
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-4 pl-12">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Free Server laufen auf gemeinsam genutzter, einfacherer Hardware mit einer langsameren CPU —
                        das ermöglicht uns, sie kostenlos anzubieten. Für mehr Performance gibt es unsere{' '}
                        <Link
                            href="/order"
                            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                        >
                            bezahlten Tarife
                        </Link>
                        .
                    </p>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
