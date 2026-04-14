'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { calculateNew, NewPriceDef } from '@/lib/GlobalFunctions/paymentLogic';
import type { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import InfoButton from '@/components/InfoButton';
import { formatVCores } from '@/lib/GlobalFunctions/formatVCores';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import LogarithmicSlider, { SliderMarker } from './LogarithmicSlider';
import PriceOverview from './PriceOverview';
import ResourceTierSelector from './ResourceTierSelector';
import type { HardwareRecommendationSlim, ResourceTierDisplay } from '@/models/prisma';
import { performanceConfiguratorQuerySchema } from '@/lib/validation/order';

// ── Logarithmic scales ──────────────────────────────────────────────────
const CPU_SCALE = [1, 2, 3, 4, 6, 8, 10, 14, 20, 32];
const RAM_SCALE = [1, 2, 3, 4, 6, 8, 10, 14, 20];

// ── Duration config ──────────────────────────────────────────────────────
const DURATIONS: readonly {
    value: number;
    labelKey: string;
    discount?: number;
    surcharge?: number;
}[] = [
    { value: 7, labelKey: 'durations.week', surcharge: 15 },
    { value: 30, labelKey: 'durations.month' },
    { value: 90, labelKey: 'durations.threeMonths', discount: 10 },
    { value: 180, labelKey: 'durations.sixMonths', discount: 15 },
];

// ── Helpers ──────────────────────────────────────────────────────────────
function clampToNearest(value: number, stops: number[]): number {
    return stops.reduce((best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best));
}

function parsePerformanceQuery(searchParams: URLSearchParams) {
    return performanceConfiguratorQuerySchema.safeParse({
        pf: searchParams.get('pf') ? Number(searchParams.get('pf')) : undefined,
        cpu: searchParams.get('cpu') ? Number(searchParams.get('cpu')) : undefined,
        ram: searchParams.get('ram') ? Number(searchParams.get('ram')) : undefined,
        days: searchParams.get('days') ? Number(searchParams.get('days')) : undefined,
        tier: searchParams.get('tier') ? Number(searchParams.get('tier')) : undefined,
    });
}

interface PerformanceConfiguratorProps {
    performanceOptions: PerformanceGroup[];
    resourceTiers: ResourceTierDisplay[];
    /** Hardware recommendations from the database (left-joined on GameData) */
    hardwareRecommendations?: HardwareRecommendationSlim[];
    /** Where to navigate on continue. Receives the current search params string. */
    continueHref: (params: string) => string;
    /** Button label override */
    continueLabel?: string;
    /** Called whenever price or continue state changes, for parent to render in sticky header/footer */
    onPriceUpdate?: (info: {
        totalCents: number;
        disabled: boolean;
        onContinue: () => void;
    }) => void;
}

// ── Component ────────────────────────────────────────────────────────────
export default function PerformanceConfigurator({
    performanceOptions,
    resourceTiers,
    hardwareRecommendations,
    continueHref,
    continueLabel,
    onPriceUpdate,
}: PerformanceConfiguratorProps) {
    const t = useTranslations('buyGameServer.hardware');
    const tl = useTranslations('buyGameServer.hardware.labels');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const parsedQuery = parsePerformanceQuery(searchParams);

    // ── Initial state from URL params ────────────────────────────────────
    const initialPfId = parsedQuery.success
        ? parsedQuery.data.pf
        : (performanceOptions[0]?.id ?? null);
    const initialCpu = parsedQuery.success ? parsedQuery.data.cpu : 4;
    const initialRam = parsedQuery.success ? parsedQuery.data.ram : 4;
    const initialDays = parsedQuery.success ? parsedQuery.data.days : 30;
    const initialTier = parsedQuery.success ? parsedQuery.data.tier : null;

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

    // ── Hardware recommendation (use the first one without an eggId, i.e. general) ──
    // For games like Minecraft with multiple eggs, eggId-specific recommendations
    // won't be shown here since the egg isn't selected yet at this stage.
    const activeRecommendation = useMemo(() => {
        if (!hardwareRecommendations || hardwareRecommendations.length === 0) return null;
        // Prefer a recommendation without eggId (general for the game)
        const general = hardwareRecommendations.find((r) => r.eggId === null);
        if (general) return general;
        // Fall back to the first recommendation even if egg-specific
        return hardwareRecommendations[0];
    }, [hardwareRecommendations]);

    // Pre-select resource tier from recommendation (only on mount)
    const [hasAppliedTierPreselect, setHasAppliedTierPreselect] = useState(false);
    useEffect(() => {
        if (hasAppliedTierPreselect) return;
        if (!activeRecommendation?.preSelectedResourceTierId) return;
        // Only preselect if the user hasn't explicitly chosen a tier via URL
        if (searchParams.get('tier')) return;
        const tierExists = resourceTiers.some(
            (t) => t.id === activeRecommendation.preSelectedResourceTierId,
        );
        if (tierExists) {
            setSelectedTierId(activeRecommendation.preSelectedResourceTierId);
        }
        setHasAppliedTierPreselect(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRecommendation]);

    // Build slider markers from the recommendation
    const cpuMarkers = useMemo<SliderMarker[]>(() => {
        if (!activeRecommendation) return [];
        return [
            {
                value: activeRecommendation.minCpuPercent / 100,
                color: 'bg-yellow-500/70',
                label: 'Min',
            },
            {
                value: activeRecommendation.recCpuPercent / 100,
                color: 'bg-green-500/70',
                label: 'Rec',
            },
        ];
    }, [activeRecommendation]);

    const ramMarkers = useMemo<SliderMarker[]>(() => {
        if (!activeRecommendation) return [];
        return [
            {
                value: activeRecommendation.minramMb / 1024,
                color: 'bg-yellow-500/70',
                label: 'Min',
            },
            { value: activeRecommendation.recRamMb / 1024, color: 'bg-green-500/70', label: 'Rec' },
        ];
    }, [activeRecommendation]);

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
            return calculateNew(
                selectedPFGroup,
                cpuCores * 100,
                ramGb * 1024,
                days,
                tierPriceCents,
            );
        }
        return {
            cents: { cpu: 0, ram: 0 },
            discount: { cents: 0, percent: 0 },
            totalCents: 0,
            tierPriceCents: 0,
        };
    }, [selectedPFGroup, cpuCores, ramGb, days, tierPriceCents]);

    const handleContinue = () => {
        router.push(continueHref(buildParams()));
    };

    useEffect(() => {
        if (!onPriceUpdate) return;
        onPriceUpdate({
            totalCents: totalPrice.totalCents,
            disabled: !selectedTier || totalPrice.totalCents < 100,
            onContinue: handleContinue,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPrice.totalCents, tierPriceCents, selectedTier, onPriceUpdate]);

    if (!selectedPFGroup) return <div>...</div>;

    // ── Render ───────────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
                {/* ── Configuration panel ──────────────────────────────── */}
                <div className="lg:col-span-2 order-1 lg:order-1">
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
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 p-1 rounded-lg bg-muted/50">
                                    {DURATIONS.map((d) => (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => setDays(d.value)}
                                            className={cn(
                                                'flex flex-col items-center justify-center gap-0.5 rounded-md p-2 sm:p-3 text-sm font-medium transition-all',
                                                days === d.value
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                            )}
                                        >
                                            <span>{t('durations.days', { days: d.value })}</span>
                                            {d.discount && (
                                                <span className="text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold shadow-sm">
                                                    -{d.discount}%
                                                </span>
                                            )}
                                            {d.surcharge && (
                                                <span className="text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-bold shadow-sm">
                                                    +{d.surcharge}%
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </Section>

                            {/* CPU */}
                            <SliderSection
                                label={formatVCores(cpuCores)}
                                sublabel={selectedPFGroup.cpu.name}
                                detail={`${((selectedPFGroup.cpu.pricePerCore / 100 / 30) * days).toFixed(2)} ${tl('perVcore')}`}
                            >
                                <LogarithmicSlider
                                    stops={availableCpuStops}
                                    value={cpuCores}
                                    onChange={setCpuCores}
                                    logarithmic
                                    markers={cpuMarkers}
                                />
                            </SliderSection>

                            {/* RAM */}
                            <SliderSection
                                label={`${ramGb} ${tl('ramUnit')}`}
                                detail={`${((selectedPFGroup.ram.pricePerGb / 100 / 30) * days).toFixed(2)} ${tl('perGiB')}`}
                            >
                                <LogarithmicSlider
                                    stops={availableRamStops}
                                    value={ramGb}
                                    onChange={setRamGb}
                                    unit="GiB"
                                    logarithmic
                                    markers={ramMarkers}
                                />
                            </SliderSection>

                            {/* Recommendation note */}
                            {activeRecommendation && cpuMarkers.length > 0 && (
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                                    <span className="inline-flex items-center gap-1.5 min-w-0">
                                        <InfoButton className="w-3.5 h-3.5 shrink-0" text="" />
                                        <span className="wrap-break-word">
                                            {t('recommendation.note')}
                                        </span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500/70 shrink-0" />
                                        <span>{t('recommendation.min')}</span>
                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500/70 ml-1 shrink-0" />
                                        <span>{t('recommendation.recommended')}</span>
                                    </span>
                                    {activeRecommendation.note && (
                                        <span className="w-full text-muted-foreground/80">
                                            {activeRecommendation.note}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Resource Tiers */}
                            {resourceTiers.length > 0 && (
                                <ResourceTierSelector
                                    tiers={resourceTiers}
                                    selectedId={selectedTierId}
                                    onSelect={setSelectedTierId}
                                    days={days}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Price overview ───────────────────────────────────── */}
                <div className="order-2 lg:order-2">
                    <div className="lg:sticky lg:top-22">
                        <PriceOverview
                            cpuCores={cpuCores}
                            ramGb={ramGb}
                            days={days}
                            totalPrice={totalPrice}
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

// ── Utility: parse hardware config from URL search params ────────────────
export function configuredHardwareFromParams(
    searchParams: URLSearchParams,
    resourceTiers: ResourceTierDisplay[],
): { hardwareConfig: HardwareConfig; tierId: number; tierPriceCents: number } | null {
    const parsed = parsePerformanceQuery(searchParams);
    if (!parsed.success) return null;

    const { pf, cpu, ram, days, tier } = parsed.data;
    const tierId = tier;
    const selectedTier = resourceTiers.find((t) => t.id === tierId);
    if (!selectedTier) return null;

    const cpuPercent = cpu * 100;
    const ramMb = ram * 1024;

    return {
        hardwareConfig: {
            pfGroupId: pf,
            cpuPercent,
            ramMb,
            diskMb: selectedTier.diskMB,
            backupCount: selectedTier.backups,
            allocations: selectedTier.ports,
            durationsDays: days,
        },
        tierId,
        tierPriceCents: selectedTier.priceCents,
    };
}
