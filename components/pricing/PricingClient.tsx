'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { calculateNew } from '@/lib/GlobalFunctions/paymentLogic';
import { formatVCores } from '@/lib/GlobalFunctions/formatVCores';
import { cn } from '@/lib/utils';
import type { PerformanceGroup, ResourceTierDisplay } from '@/models/prisma';
import {
    ArrowRight,
    Calendar,
    ChevronRight,
    Cpu,
    HardDrive,
    MemoryStick,
    Minus,
    Plus,
    Tag,
    TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

const CPU_SCALE = [1, 2, 3, 4, 6, 8, 10, 14, 20, 32];
const RAM_SCALE = [1, 2, 3, 4, 6, 8, 10, 14, 20];

type DurationOption = {
    value: number;
    key: 'week' | 'month' | 'threeMonths' | 'sixMonths';
    discount?: number;
    surcharge?: number;
};

const DURATIONS: DurationOption[] = [
    { value: 7, key: 'week', surcharge: 15 },
    { value: 30, key: 'month' },
    { value: 90, key: 'threeMonths', discount: 10 },
    { value: 180, key: 'sixMonths', discount: 15 },
];

function clampToNearest(value: number, stops: number[]): number {
    return stops.reduce((best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best));
}

interface PricingClientProps {
    performanceGroups: PerformanceGroup[];
    resourceTiers: ResourceTierDisplay[];
}

export default function PricingClient({ performanceGroups, resourceTiers }: PricingClientProps) {
    const t = useTranslations('pricing');
    const router = useRouter();

    const [pfId, setPfId] = useState<number>(performanceGroups[0]?.id ?? 0);
    const [cpu, setCpu] = useState(4);
    const [ram, setRam] = useState(4);
    const [days, setDays] = useState(30);
    const [tierId, setTierId] = useState<number | null>(resourceTiers[0]?.id ?? null);

    const pf = performanceGroups.find((p) => p.id === pfId) ?? performanceGroups[0] ?? null;
    const tier = resourceTiers.find((rt) => rt.id === tierId) ?? null;

    // Filter stops by performance group bounds
    const cpuStops = useMemo(() => {
        if (!pf) return CPU_SCALE;
        const { minThreads, maxThreads } = pf.cpu;
        const filtered = CPU_SCALE.filter((v) => v >= minThreads && v <= maxThreads);
        return Array.from(new Set([...filtered, maxThreads])).sort((a, b) => a - b);
    }, [pf]);

    const ramStops = useMemo(() => {
        if (!pf) return RAM_SCALE;
        const { minGb, maxGb } = pf.ram;
        const filtered = RAM_SCALE.filter((v) => v >= minGb && v <= maxGb);
        return Array.from(new Set([minGb, ...filtered, maxGb])).sort((a, b) => a - b);
    }, [pf]);

    // Clamp values whenever stops change (performance group switch)
    const cpuValue = cpuStops.includes(cpu) ? cpu : clampToNearest(cpu, cpuStops);
    const ramValue = ramStops.includes(ram) ? ram : clampToNearest(ram, ramStops);

    const price = useMemo(() => {
        if (!pf) {
            return {
                cents: { cpu: 0, ram: 0 },
                discount: { cents: 0, percent: 0 },
                totalCents: 0,
                tierPriceCents: 0,
            };
        }
        return calculateNew(pf, cpuValue * 100, ramValue * 1024, days, tier?.priceCents ?? 0);
    }, [pf, cpuValue, ramValue, days, tier]);

    const priceTooSmall = price.totalCents < 100;

    const cpuIdx = cpuStops.indexOf(cpuValue);
    const ramIdx = ramStops.indexOf(ramValue);

    const stepCpu = (dir: -1 | 1) => {
        const next = cpuStops[Math.max(0, Math.min(cpuStops.length - 1, cpuIdx + dir))];
        if (next != null) setCpu(next);
    };
    const stepRam = (dir: -1 | 1) => {
        const next = ramStops[Math.max(0, Math.min(ramStops.length - 1, ramIdx + dir))];
        if (next != null) setRam(next);
    };

    const handleContinue = () => {
        if (!pf) return;
        const params = new URLSearchParams({
            pf: String(pf.id),
            cpu: String(cpuValue),
            ram: String(ramValue),
            days: String(days),
        });
        if (tier) params.set('tier', String(tier.id));
        router.push(`/order/configure/games?${params.toString()}`);
    };

    if (!pf) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                No hardware options available.
            </div>
        );
    }

    const faqKeys = ['billing', 'upgrade', 'refund'] as const;

    return (
        <div className="mx-auto w-full max-w-6xl flex flex-col gap-8 md:gap-12">
            {/* ── Header ──────────────────────────────────────────────── */}
            <section className="pt-0 md:pt-4">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{t('hero.title')}</h1>
                <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
                    {t('hero.subtitle')}
                </p>
            </section>

            {/* ── Pricing table ───────────────────────────────────────── */}
            <section>
                {/* Performance group selector — card-style tabs */}
                <div className="mb-4">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t('table.performanceGroup')}
                    </div>
                    <div
                        role="tablist"
                        className={cn(
                            'grid gap-2',
                            performanceGroups.length === 1
                                ? 'grid-cols-1'
                                : performanceGroups.length === 2
                                  ? 'grid-cols-2'
                                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
                        )}
                    >
                        {performanceGroups.map((p) => {
                            const active = p.id === pf.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setPfId(p.id)}
                                    className={cn(
                                        'group relative flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all',
                                        'cursor-pointer hover:border-primary/60 hover:bg-primary/5',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                        active
                                            ? 'border-primary bg-primary/10 shadow-sm'
                                            : 'border-border bg-card',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'h-4 w-4 rounded-full border-2 shrink-0 transition-colors',
                                            active
                                                ? 'border-primary bg-primary'
                                                : 'border-muted-foreground/40 group-hover:border-primary/60',
                                        )}
                                    >
                                        {active && (
                                            <div className="h-full w-full rounded-full bg-primary-foreground scale-[0.45]" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-sm">{p.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {p.cpu.name}
                                        </div>
                                    </div>
                                    <ChevronRight
                                        className={cn(
                                            'h-4 w-4 shrink-0 transition-transform',
                                            active
                                                ? 'text-primary'
                                                : 'text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:text-primary',
                                        )}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-xl border bg-card overflow-hidden">
                    {/* Header row — visible on sm+ */}
                    <div className="hidden sm:grid grid-cols-[1.2fr_2fr_1fr_1fr] gap-3 px-4 py-2.5 border-b bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <div>{t('table.headers.item')}</div>
                        <div>{t('table.headers.selection')}</div>
                        <div className="text-right">{t('table.headers.unit')}</div>
                        <div className="text-right">{t('table.headers.subtotal')}</div>
                    </div>

                    {/* CPU row */}
                    <Row
                        icon={Cpu}
                        label={t('table.cpu')}
                        sublabel={pf.cpu.name}
                        unit={`${(pf.cpu.pricePerCore / 100).toFixed(2)} ${t('table.perVCore')}`}
                        subtotal={`${(price.cents.cpu / 100).toFixed(2)} €`}
                    >
                        <Stepper
                            value={cpuValue}
                            display={formatVCores(cpuValue)}
                            onDec={() => stepCpu(-1)}
                            onInc={() => stepCpu(1)}
                            decDisabled={cpuIdx <= 0}
                            incDisabled={cpuIdx >= cpuStops.length - 1}
                        />
                    </Row>

                    {/* RAM row */}
                    <Row
                        icon={MemoryStick}
                        label={t('table.ram')}
                        unit={`${(pf.ram.pricePerGb / 100).toFixed(2)} ${t('table.perGiB')}`}
                        subtotal={`${(price.cents.ram / 100).toFixed(2)} €`}
                    >
                        <Stepper
                            value={ramValue}
                            display={`${ramValue} ${t('table.gib')}`}
                            onDec={() => stepRam(-1)}
                            onInc={() => stepRam(1)}
                            decDisabled={ramIdx <= 0}
                            incDisabled={ramIdx >= ramStops.length - 1}
                        />
                    </Row>

                    {/* Resource package row */}
                    {resourceTiers.length > 0 && (
                        <Row
                            icon={HardDrive}
                            label={t('table.resources')}
                            sublabel={tier ? tierSublabel(tier, t) : undefined}
                            unit={
                                tier && tier.priceCents > 0
                                    ? `${(tier.priceCents / 100).toFixed(2)} ${t('table.perMonth')}`
                                    : t('table.free')
                            }
                            subtotal={`${(price.tierPriceCents / 100).toFixed(2)} €`}
                        >
                            <Select
                                value={tier ? String(tier.id) : ''}
                                onValueChange={(v) => setTierId(Number(v))}
                            >
                                <SelectTrigger className="h-9 w-[150px] sm:w-[220px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[280px]">
                                    {resourceTiers.map((rt) => (
                                        <SelectItem key={rt.id} value={String(rt.id)}>
                                            <span className="flex items-center gap-2 whitespace-nowrap">
                                                <span className="font-medium">
                                                    {rt.name || `Tier ${rt.id}`}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {t('table.tierSummary', {
                                                        disk: rt.diskMB / 1024,
                                                        backups: rt.backups,
                                                        ports: rt.ports,
                                                    })}
                                                </span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Row>
                    )}

                    {/* Duration — horizontal timeline track */}
                    <div className="px-4 pt-4 pb-5">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-sm font-semibold">{t('table.duration')}</div>
                            </div>
                            <div className="text-xs text-muted-foreground tabular-nums shrink-0">
                                {t('table.daysValue', { days })}
                            </div>
                        </div>

                        <div role="radiogroup" className="relative">
                            {/* Track — sits between first and last stop centers (12.5% inset) */}
                            <div className="pointer-events-none absolute top-2 left-[12.5%] right-[12.5%] h-1 rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                                    style={{
                                        width: `${
                                            (Math.max(
                                                0,
                                                DURATIONS.findIndex((x) => x.value === days),
                                            ) /
                                                (DURATIONS.length - 1)) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>

                            {/* Stops */}
                            <div className="relative grid grid-cols-4">
                                {DURATIONS.map((d, idx) => {
                                    const activeIdx = DURATIONS.findIndex((x) => x.value === days);
                                    const active = idx === activeIdx;
                                    const passed = idx < activeIdx;
                                    const meta = d.discount
                                        ? `−${d.discount}%`
                                        : d.surcharge
                                          ? `+${d.surcharge}%`
                                          : null;
                                    const metaColor = d.discount
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-orange-600 dark:text-orange-400';
                                    return (
                                        <button
                                            key={d.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            onClick={() => setDays(d.value)}
                                            className="group flex flex-col items-center pt-0 pb-0 cursor-pointer focus-visible:outline-none"
                                        >
                                            <span
                                                className={cn(
                                                    'relative flex items-center justify-center rounded-full transition-all duration-200',
                                                    'h-5 w-5',
                                                    active &&
                                                        'ring-4 ring-primary/20 group-focus-visible:ring-primary/40',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'rounded-full border-2 transition-all duration-200',
                                                        active
                                                            ? 'h-4 w-4 border-primary bg-primary'
                                                            : passed
                                                              ? 'h-3 w-3 border-primary bg-primary'
                                                              : 'h-3 w-3 border-muted-foreground/40 bg-background group-hover:border-primary group-hover:scale-110',
                                                    )}
                                                />
                                            </span>
                                            <span
                                                className={cn(
                                                    'mt-3 text-xs sm:text-sm transition-colors',
                                                    active
                                                        ? 'font-semibold text-foreground'
                                                        : 'text-muted-foreground group-hover:text-foreground',
                                                )}
                                            >
                                                {t(`table.durations.${d.key}`)}
                                            </span>
                                            <span
                                                className={cn(
                                                    'mt-0.5 text-[10px] tabular-nums leading-none h-3',
                                                    meta ? metaColor : 'opacity-0',
                                                )}
                                            >
                                                {meta ?? '·'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Discount / Surcharge */}
                    {price.discount.cents !== 0 && (
                        <div
                            className={cn(
                                'flex items-center justify-between px-4 py-2.5 border-t text-sm',
                                price.discount.cents > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-orange-600 dark:text-orange-400',
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {price.discount.cents > 0 ? (
                                    <Tag className="h-3.5 w-3.5" />
                                ) : (
                                    <TrendingUp className="h-3.5 w-3.5" />
                                )}
                                {price.discount.cents > 0
                                    ? t('table.discount', { percent: price.discount.percent })
                                    : t('table.surcharge', {
                                          percent: Math.abs(price.discount.percent),
                                      })}
                            </span>
                            <span className="font-medium tabular-nums">
                                {price.discount.cents > 0 ? '−' : '+'}
                                {(Math.abs(price.discount.cents) / 100).toFixed(2)} €
                            </span>
                        </div>
                    )}

                    {/* Total row */}
                    <div className="flex items-center justify-between gap-4 px-4 py-4 border-t bg-muted/40">
                        <div>
                            <div className="text-sm text-muted-foreground">{t('table.total')}</div>
                            <div className="text-xs text-muted-foreground/80">
                                {t('table.totalSub', { days })}
                            </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold tabular-nums">
                            {(price.totalCents / 100).toFixed(2)} €
                        </div>
                    </div>
                </div>

                {/* Continue */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                    {priceTooSmall && (
                        <span className="text-xs text-red-500 sm:mr-auto">
                            {t('table.minOrderHint')}
                        </span>
                    )}
                    <Button
                        size="lg"
                        onClick={handleContinue}
                        disabled={priceTooSmall || !tier}
                        className="font-semibold"
                    >
                        {t('configurator.continueLabel')}
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                </div>
            </section>

            {/* ── FAQ ─────────────────────────────────────────────────── */}
            <section className="max-w-3xl mx-auto w-full pb-4 md:pb-8">
                <h2 className="text-lg md:text-xl font-semibold mb-3">{t('faq.title')}</h2>
                <Accordion type="single" collapsible className="w-full">
                    {faqKeys.map((key) => (
                        <AccordionItem key={key} value={key}>
                            <AccordionTrigger className="text-left text-base">
                                {t(`faq.items.${key}.question`)}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                {t(`faq.items.${key}.answer`)}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </section>
        </div>
    );
}

// ── helpers ──────────────────────────────────────────────────────────────

function tierSublabel(tier: ResourceTierDisplay, t: (k: string, v?: any) => string): string {
    return t('table.tierSummary', {
        disk: tier.diskMB / 1024,
        backups: tier.backups,
        ports: tier.ports,
    });
}

function Row({
    icon: Icon,
    label,
    sublabel,
    unit,
    subtotal,
    children,
    isLast,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sublabel?: string;
    unit: string;
    subtotal: string;
    children: React.ReactNode;
    isLast?: boolean;
}) {
    return (
        <div
            className={cn(
                'px-4 py-3 sm:grid sm:grid-cols-[1.2fr_2fr_1fr_1fr] sm:gap-3 sm:items-center',
                !isLast && 'border-b',
            )}
        >
            {/* Mobile: label + control on same row; sm+: split into grid columns */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:contents">
                {/* Item */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold">{label}</div>
                        {sublabel && (
                            <div className="text-xs text-muted-foreground truncate">{sublabel}</div>
                        )}
                    </div>
                </div>

                {/* Control */}
                <div className="ml-auto sm:ml-0 max-w-full min-w-0 sm:flex-initial">{children}</div>
            </div>

            {/* Unit price (sm+ third column) */}
            <div className="hidden sm:block text-right text-xs text-muted-foreground tabular-nums">
                {unit}
            </div>

            {/* Subtotal — second line on mobile, fourth column sm+ */}
            <div className="mt-2 flex items-center justify-between text-xs sm:mt-0 sm:block sm:text-right">
                <span className="text-muted-foreground tabular-nums sm:hidden">{unit}</span>
                <span className="font-semibold tabular-nums text-sm sm:text-base">{subtotal}</span>
            </div>
        </div>
    );
}

function Stepper({
    display,
    onDec,
    onInc,
    decDisabled,
    incDisabled,
}: {
    value: number;
    display: string;
    onDec: () => void;
    onInc: () => void;
    decDisabled?: boolean;
    incDisabled?: boolean;
}) {
    return (
        <div className="inline-flex items-center rounded-md border overflow-hidden">
            <button
                type="button"
                onClick={onDec}
                disabled={decDisabled}
                aria-label="Decrease"
                className="h-9 w-9 flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
            <div className="h-9 min-w-20 px-3 flex items-center justify-center text-sm font-medium tabular-nums border-x">
                {display}
            </div>
            <button
                type="button"
                onClick={onInc}
                disabled={incDisabled}
                aria-label="Increase"
                className="h-9 w-9 flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
