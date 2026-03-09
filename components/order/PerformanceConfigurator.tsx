'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateNew, NewPriceDef } from '@/lib/GlobalFunctions/paymentLogic';
import type { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import InfoButton from '@/components/InfoButton';
import { formatVCores } from '@/lib/GlobalFunctions/formatVCores';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import LogarithmicSlider from './LogarithmicSlider';
import PriceOverview from './PriceOverview';
import { cn } from '@/lib/utils';
import { HardDrive, Archive, Network } from 'lucide-react';

// ── Logarithmic scales ──────────────────────────────────────────────────
const CPU_SCALE = [1, 2, 3, 4, 6, 8, 10, 14, 20, 32];
const RAM_SCALE = [1, 2, 3, 4, 6, 8, 10, 14, 20];

// ── Duration config ──────────────────────────────────────────────────────
const DURATIONS: readonly { value: number; labelKey: string; discount?: number }[] = [
    { value: 7, labelKey: 'durations.week' },
    { value: 30, labelKey: 'durations.month' },
    { value: 90, labelKey: 'durations.threeMonths', discount: 10 },
    { value: 180, labelKey: 'durations.sixMonths', discount: 15 },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function clampToNearest(value: number, stops: number[]): number {
    return stops.reduce((best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best));
}

// ── Types ────────────────────────────────────────────────────────────────
export interface ResourceTierDisplay {
    id: number;
    name: string;
    diskMB: number;
    backups: number;
    ports: number;
    priceCents: number;
}

interface PerformanceConfiguratorProps {
    performanceOptions: PerformanceGroup[];
    resourceTiers: ResourceTierDisplay[];
    /** Where to navigate on continue. Receives the current search params string. */
    continueHref: (params: string) => string;
    /** Button label override */
    continueLabel?: string;
}

// ── Component ────────────────────────────────────────────────────────────
export default function PerformanceConfigurator({
    performanceOptions,
    resourceTiers,
    continueHref,
    continueLabel,
}: PerformanceConfiguratorProps) {
    const t = useTranslations('buyGameServer.hardware');
    const tl = useTranslations('buyGameServer.hardware.labels');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // ── Initial state from URL params ────────────────────────────────────
    const initialPfId = searchParams.get('pf')
        ? Number(searchParams.get('pf'))
        : (performanceOptions[0]?.id ?? null);

    const initialCpu = searchParams.get('cpu') ? Number(searchParams.get('cpu')) : 4;
    const initialRam = searchParams.get('ram') ? Number(searchParams.get('ram')) : 4;
    const initialDays = searchParams.get('days') ? Number(searchParams.get('days')) : 30;
    const initialTier = searchParams.get('tier') ? Number(searchParams.get('tier')) : null;

    // ── State ────────────────────────────────────────────────────────────
    const [selectedPFGroup, setSelectedPFGroup] = useState<PerformanceGroup | null>(
        performanceOptions.find((pf) => pf.id === initialPfId) ?? performanceOptions[0] ?? null,
    );
    const [cpuCores, setCpuCores] = useState(clampToNearest(initialCpu, CPU_SCALE));
    const [ramGb, setRamGb] = useState(clampToNearest(initialRam, RAM_SCALE));
    const [days, setDays] = useState(initialDays);
    const [selectedTierId, setSelectedTierId] = useState<number | null>(
        initialTier ?? resourceTiers[0]?.id ?? null,
    );

    const selectedTier = resourceTiers.find((t) => t.id === selectedTierId) ?? null;

    // ── Available stops filtered by performance group constraints ────────
    const availableCpuStops = useMemo(() => {
        if (!selectedPFGroup) return [];
        const { minThreads, maxThreads } = selectedPFGroup.cpu;
        const filtered = CPU_SCALE.filter((v) => v >= minThreads && v <= maxThreads);
        const allCpuOptions = new Set(filtered).add(maxThreads);
        return Array.from(allCpuOptions);
    }, [selectedPFGroup]);

    const availableRamStops = useMemo(() => {
        if (!selectedPFGroup) return [];
        const { minGb, maxGb } = selectedPFGroup.ram;
        const filtered = RAM_SCALE.filter((v) => v >= minGb && v <= maxGb);
        const withBounds = new Set([minGb, ...filtered, maxGb]);
        return [...withBounds].sort((a, b) => a - b);
    }, [selectedPFGroup]);

    // Clamp CPU/RAM when performance group changes
    useEffect(() => {
        if (availableCpuStops.length > 0 && !availableCpuStops.includes(cpuCores)) {
            setCpuCores(clampToNearest(cpuCores, availableCpuStops));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableCpuStops]);

    useEffect(() => {
        if (availableRamStops.length > 0 && !availableRamStops.includes(ramGb)) {
            setRamGb(clampToNearest(ramGb, availableRamStops));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableRamStops]);

    // ── URL sync ─────────────────────────────────────────────────────────
    const buildParams = useCallback(() => {
        const params = new URLSearchParams();
        if (selectedPFGroup) params.set('pf', String(selectedPFGroup.id));
        params.set('cpu', String(cpuCores));
        params.set('ram', String(ramGb));
        params.set('days', String(days));
        if (selectedTierId) params.set('tier', String(selectedTierId));
        return params.toString();
    }, [selectedPFGroup, cpuCores, ramGb, days, selectedTierId]);

    useEffect(() => {
        const newParams = buildParams();
        if (newParams !== searchParams.toString()) {
            window.history.replaceState(null, '', `${pathname}?${newParams}`);
        }
    }, [buildParams, pathname, searchParams]);

    // ── Price calculation ────────────────────────────────────────────────
    const tierPriceCents = selectedTier?.priceCents ?? 0;

    const totalPrice = useMemo<NewPriceDef>(() => {
        if (selectedPFGroup?.cpu && selectedPFGroup?.ram) {
            return calculateNew(selectedPFGroup, cpuCores * 100, ramGb * 1024, days);
        }
        return {
            cents: { cpu: 0, ram: 0 },
            discount: { cents: 0, percent: 0 },
            totalCents: 0,
        };
    }, [selectedPFGroup, cpuCores, ramGb, days]);

    if (!selectedPFGroup) return <div>...</div>;

    const handleContinue = () => {
        router.push(continueHref(buildParams()));
    };

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
                {/* ── Configuration panel ──────────────────────────────── */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <Card className="shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg sm:text-xl">{t('title')}</CardTitle>
                            <CardDescription className="text-sm">
                                {t('description')}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Performance tier */}
                            <Section label={t('performanceTier')}>
                                <Tabs
                                    value={selectedPFGroup.id.toString()}
                                    onValueChange={(v) => {
                                        const pf = performanceOptions.find(
                                            (p) => p.id.toString() === v,
                                        );
                                        if (pf) setSelectedPFGroup(pf);
                                    }}
                                >
                                    <TabsList className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-auto p-1 bg-muted/50">
                                        {performanceOptions.map((pf) => (
                                            <TabsTrigger
                                                key={pf.id}
                                                value={pf.id.toString()}
                                                className="flex items-center justify-center gap-2 p-4 text-sm font-medium rounded-md transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md hover:bg-muted/80"
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="font-semibold">{pf.name}</span>
                                                    <div className="flex items-center gap-1 text-xs opacity-80">
                                                        <span>{pf.cpu.name}</span>
                                                        <InfoButton
                                                            className="w-3 h-3"
                                                            text="kleine info"
                                                        />
                                                    </div>
                                                </div>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </Section>

                            {/* Billing period */}
                            <Section label={t('billingPeriod')}>
                                <Tabs
                                    value={days.toString()}
                                    onValueChange={(v) => setDays(Number(v))}
                                >
                                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 h-auto p-1 bg-muted/50">
                                        {DURATIONS.map((d) => (
                                            <TabsTrigger
                                                key={d.value}
                                                value={d.value.toString()}
                                                className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                <div className="text-center">
                                                    <div className="font-medium">
                                                        {t(d.labelKey as any)}
                                                    </div>
                                                    {d.discount ? (
                                                        <div className="text-xs opacity-80 text-green-600">
                                                            -{d.discount}%
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs opacity-80">
                                                            {t('durations.days', {
                                                                days: d.value,
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </Section>

                            {/* CPU */}
                            <SliderSection
                                label={formatVCores(cpuCores)}
                                sublabel={selectedPFGroup.cpu.name}
                                detail={`${(selectedPFGroup.cpu.pricePerCore / 100).toFixed(2)} ${tl('perVcore')}`}
                            >
                                <LogarithmicSlider
                                    stops={availableCpuStops}
                                    value={cpuCores}
                                    onChange={setCpuCores}
                                    logarithmic
                                />
                            </SliderSection>

                            {/* RAM */}
                            <SliderSection
                                label={`${ramGb} ${tl('ramUnit')}`}
                                detail={`${(selectedPFGroup.ram.pricePerGb / 100).toFixed(2)} ${tl('perGiB')}`}
                            >
                                <LogarithmicSlider
                                    stops={availableRamStops}
                                    value={ramGb}
                                    onChange={setRamGb}
                                    unit="GiB"
                                    logarithmic
                                />
                            </SliderSection>

                            {/* Resource Tiers */}
                            {resourceTiers.length > 0 && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {resourceTiers.map((tier) => (
                                            <button
                                                key={tier.id}
                                                type="button"
                                                onClick={() => setSelectedTierId(tier.id)}
                                                className={cn(
                                                    'relative rounded-lg border-2 p-4 sm:p-6 text-center transition-all duration-200 cursor-pointer',
                                                    selectedTierId === tier.id
                                                        ? 'border-primary bg-primary/5 shadow-md'
                                                        : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
                                                )}
                                            >
                                                <div className="space-y-3">
                                                    <TierRow
                                                        icon={HardDrive}
                                                        label="Disk"
                                                        value={`${tier.diskMB / 1024} GiB`}
                                                    />
                                                    <TierRow
                                                        icon={Archive}
                                                        label="Backups"
                                                        value={String(tier.backups)}
                                                    />
                                                    <TierRow
                                                        icon={Network}
                                                        label="Ports"
                                                        value={String(tier.ports)}
                                                    />
                                                    {tier.priceCents > 0 && (
                                                        <div className="pt-1 border-t text-sm font-semibold text-primary">
                                                            +{(tier.priceCents / 100).toFixed(2)} €
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Price overview ───────────────────────────────────── */}
                <div className="order-1 lg:order-2">
                    <div className="lg:sticky lg:top-4">
                        <PriceOverview
                            cpuCores={cpuCores}
                            ramGb={ramGb}
                            days={days}
                            totalPrice={totalPrice}
                            tierPriceCents={tierPriceCents}
                            onContinue={handleContinue}
                            continueLabel={continueLabel}
                            disableContinue={!selectedTier}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Tiny layout helpers ──────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">{label}</h3>
            {children}
        </div>
    );
}

function SliderSection({
    label,
    sublabel,
    detail,
    children,
}: {
    label: string;
    sublabel?: string;
    detail?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <div className="flex items-center gap-2">
                    <div className="text-base sm:text-lg font-semibold">{label}</div>
                    {sublabel && (
                        <span className="text-xs sm:text-sm text-muted-foreground">{sublabel}</span>
                    )}
                </div>
                {detail && <div className="text-xs sm:text-sm text-muted-foreground">{detail}</div>}
            </div>
            <div className="px-2">{children}</div>
        </div>
    );
}

function TierRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
            </div>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

// ── Utility: parse hardware config from URL search params ────────────────
export function configuredHardwareFromParams(
    searchParams: URLSearchParams,
    resourceTiers: ResourceTierDisplay[],
): { hardwareConfig: HardwareConfig; tierId: number } | null {
    const pf = searchParams.get('pf');
    const cpu = searchParams.get('cpu');
    const ram = searchParams.get('ram');
    const days = searchParams.get('days');
    const tier = searchParams.get('tier');

    if (!pf || !cpu || !ram || !days || !tier) return null;

    const tierId = Number(tier);
    const selectedTier = resourceTiers.find((t) => t.id === tierId);
    if (!selectedTier) return null;

    const cpuPercent = Number(cpu) * 100;
    const ramMb = Number(ram) * 1024;

    return {
        hardwareConfig: {
            pfGroupId: Number(pf),
            cpuPercent,
            ramMb,
            diskMb: selectedTier.diskMB,
            backupCount: selectedTier.backups,
            allocations: selectedTier.ports,
            durationsDays: Number(days),
        },
        tierId,
    };
}
