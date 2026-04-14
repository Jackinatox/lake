'use client';

import { Archive, Clock, Cpu, HardDrive, MemoryStick, Network } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/GlobalFunctions/ptResourceLogic';

interface HardwareChipBarProps {
    cpu: number;
    ram: number;
    days: number;
    diskGB: number;
    backups: number;
    ports: number;
    totalCents: number;
    className?: string;
}

export default function HardwareChipBar({
    cpu,
    ram,
    days,
    diskGB,
    backups,
    ports,
    totalCents,
    className,
}: HardwareChipBarProps) {
    const locale = useLocale();
    const daysSuffix = locale === 'de' ? 'T' : 'd';

    return (
        <div
            className={cn('flex items-center gap-2 md:gap-3 overflow-x-auto', className)}
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
            <Chip color="blue" label="CPU">
                <Cpu className="h-3.5 w-3.5 text-blue-500" />
                {cpu} vCores
            </Chip>

            <Chip color="purple" label="RAM">
                <MemoryStick className="h-3.5 w-3.5 text-purple-500" />
                {formatBytes(ram * 1024 * 1024 * 1024)}
            </Chip>

            <Chip color="green" label="Disk">
                <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                {formatBytes(diskGB * 1024 * 1024 * 1024)}
            </Chip>

            <div className="w-px h-5 bg-border shrink-0" />

            <Chip color="muted" label="Backups">
                <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                {backups}
            </Chip>

            <Chip color="muted" label="Ports">
                <Network className="h-3.5 w-3.5 text-muted-foreground" />
                {ports}
            </Chip>

            <Chip color="muted" label="Duration">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {days}
                {daysSuffix}
            </Chip>

            {totalCents > 0 && (
                <>
                    <div className="w-px h-5 bg-border shrink-0 ml-auto" />
                    <Chip color="primary">{(totalCents / 100).toFixed(2)} €</Chip>
                </>
            )}
        </div>
    );
}

function Chip({
    color,
    label,
    children,
}: {
    color: 'blue' | 'purple' | 'green' | 'muted' | 'primary';
    label?: string;
    children: React.ReactNode;
}) {
    const bg: Record<string, string> = {
        blue: 'bg-blue-500/10',
        purple: 'bg-purple-500/10',
        green: 'bg-emerald-500/10',
        muted: 'bg-muted',
        primary: 'bg-primary/10 text-primary font-semibold',
    };
    return (
        <div
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${bg[color]}`}
        >
            {children}
            {label && (
                <span className="hidden sm:inline text-muted-foreground font-normal">{label}</span>
            )}
        </div>
    );
}
