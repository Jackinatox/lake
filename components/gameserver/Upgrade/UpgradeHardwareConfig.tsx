'use client';

import { Euro } from '@/components/Euro';
import ResourceTierSelector from '@/components/order/ResourceTierSelector';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatVCores } from '@/lib/GlobalFunctions/formatVCores';
import {
    DAY_MS,
    hardwareBounds,
    quoteServerChange,
    UPGRADE_MIN_CHARGE_CENTS,
    type ServerSpec,
} from '@/lib/upgrade/pricing';
import { tierBlockers, type ServerUsage, type TierBlocker } from '@/lib/upgrade/tierEligibility';
import type { PerformanceGroup, ResourceTierDisplay } from '@/models/prisma';
import { UPGRADE_DURATIONS } from '@/lib/validation/common';
import { Info } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

const EXTEND_OPTIONS = UPGRADE_DURATIONS;
type ExtendDays = (typeof EXTEND_OPTIONS)[number];

export type UpgradeSelection = {
    cpuPercent: number;
    ramMb: number;
    resourceTierId: number;
    extendDays: ExtendDays;
};

interface UpgradeHardwareConfigProps {
    location: PerformanceGroup;
    current: ServerSpec;
    currentTier: ResourceTierDisplay | null;
    tiers: ResourceTierDisplay[];
    usage: ServerUsage | null;
    remainingMs: number;
    draftSelection?: UpgradeSelection | null;
    onNext: (selection: UpgradeSelection) => void;
    initialDays?: ExtendDays;
    loading?: boolean;
}

const gib = (mb: number) => (Math.ceil((mb / 1024) * 10) / 10).toFixed(1);

/**
 * Configurator for changing a paid server in both directions and/or extending it. Prices come
 * from `quoteServerChange`, the same function `checkoutAction` charges with.
 * See docs/server-upgrade.md.
 */
export function UpgradeHardwareConfig({
    location,
    current,
    currentTier,
    tiers,
    usage,
    remainingMs,
    draftSelection,
    onNext,
    initialDays = 0,
    loading = false,
}: UpgradeHardwareConfigProps) {
    const t = useTranslations('upgrade');
    const tTier = useTranslations('order.resourceTier');
    const locale = useLocale();
    const bounds = hardwareBounds(location);

    const [cpuPercent, setCpuPercent] = useState(draftSelection?.cpuPercent ?? current.cpuPercent);
    const [ramMb, setRamMb] = useState(draftSelection?.ramMb ?? current.ramMb);
    // An expired server can only be changed together with an extension, so "don't extend" is
    // not offered and the preselection falls back to one month.
    const expired = remainingMs <= 0;
    const extendOptions = expired ? EXTEND_OPTIONS.filter((d) => d !== 0) : EXTEND_OPTIONS;
    const [days, setDays] = useState<ExtendDays>(() => {
        const wanted = draftSelection?.extendDays ?? initialDays;
        return expired && wanted === 0 ? 30 : wanted;
    });
    const [tierId, setTierId] = useState<number | null>(
        draftSelection?.resourceTierId ?? currentTier?.id ?? null,
    );

    const blockersByTier = useMemo(
        () =>
            new Map<number, TierBlocker[]>(
                tiers.map((tier) => [tier.id, tierBlockers(tier, currentTier, usage)]),
            ),
        [tiers, currentTier, usage],
    );

    const blockerText = (blockers: TierBlocker[]) =>
        blockers
            .map((b) => {
                switch (b.kind) {
                    case 'unavailable':
                        return tTier('unavailable');
                    case 'usageUnknown':
                        // Explained once in the box below the tiers
                        return null;
                    case 'disk':
                        return t('usage.blockDisk', { used: gib(b.usedMb) });
                    case 'backups':
                        return t('usage.blockBackups', { count: b.used });
                    case 'ports':
                        return t('usage.blockPorts', { count: b.used });
                }
            })
            .filter(Boolean)
            .join(' · ');

    const unavailableReasons = Object.fromEntries(
        tiers
            .filter((tier) => (blockersByTier.get(tier.id) ?? []).length > 0)
            .map((tier) => [tier.id, blockerText(blockersByTier.get(tier.id)!)]),
    );
    const someTierBlockedByUsage = [...blockersByTier.values()].some((list) =>
        list.some((b) => b.kind === 'disk' || b.kind === 'backups' || b.kind === 'ports'),
    );

    const selectedTier = tiers.find((tier) => tier.id === tierId) ?? null;
    const selectedTierBlocked = !selectedTier || unavailableReasons[selectedTier.id] !== undefined;

    const quote = useMemo(
        () =>
            quoteServerChange({
                pf: location,
                current,
                target: {
                    cpuPercent,
                    ramMb,
                    tierId: selectedTier?.id ?? current.tierId,
                    tierPriceCents: selectedTier?.priceCents ?? current.tierPriceCents,
                },
                remainingMs,
                extendDays: days,
            }),
        [location, current, cpuPercent, ramMb, selectedTier, remainingMs, days],
    );

    const canContinue = !loading && !selectedTierBlocked && quote.status === 'OK';

    const handleContinue = () => {
        if (!canContinue || !selectedTier) return;
        onNext({ cpuPercent, ramMb, resourceTierId: selectedTier.id, extendDays: days });
    };

    const remainingDays = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(
        quote.remainingMs / DAY_MS,
    );
    const tierLabel = (tier: ResourceTierDisplay | null) =>
        tier ? tier.name?.trim() || `${tier.diskMB / 1024} GiB` : '–';

    const statusMessage = (() => {
        switch (quote.status) {
            case 'NO_CHANGE':
                return t('status.noChange');
            case 'EXTENSION_REQUIRED':
                return t('status.extensionRequired');
            case 'CREDIT_EXCEEDS':
                return t.rich('status.creditExceeds', {
                    amount: () => <Euro cents={-quote.netCents} />,
                });
            case 'BELOW_MINIMUM':
                return t.rich('status.belowMinimum', {
                    amount: () => <Euro cents={UPGRADE_MIN_CHARGE_CENTS} />,
                });
            default:
                return null;
        }
    })();

    const continueButton = (className: string) => (
        <Button className={className} size="lg" disabled={!canContinue} onClick={handleContinue}>
            {t('footer.continue')}
        </Button>
    );

    return (
        <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Configuration */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <Card className="shadow-lg">
                        <CardHeader className="pb-3 md:pb-4">
                            <CardTitle className="text-lg sm:text-xl">
                                {t('config.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 md:pt-0">
                            {/* Location: fixed for now. Switching locations needs a server
                                transfer in Pterodactyl that is being built separately; offer
                                the other locations here once checkoutAction supports it. */}
                            <div className="text-sm">
                                <span className="text-muted-foreground">
                                    {t('config.performanceGroup')}:{' '}
                                </span>
                                <span className="font-medium">{location.name}</span>
                                <span className="text-muted-foreground">
                                    {' '}
                                    · {location.cpu.name}
                                </span>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('config.performanceGroupFixed')}
                                </p>
                            </div>

                            {/* Extension */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium">{t('config.extend-title')}</h3>
                                <Tabs
                                    value={days.toString()}
                                    onValueChange={(v) => setDays(Number(v) as ExtendDays)}
                                >
                                    <TabsList
                                        className={`grid ${expired ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-5'} gap-1 sm:gap-2 h-auto p-1 bg-muted/50`}
                                    >
                                        {extendOptions.map((d) => (
                                            <TabsTrigger
                                                key={d}
                                                value={d.toString()}
                                                className="text-xs sm:text-sm p-2 sm:p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                            >
                                                {t(`config.duration.d${d}`)}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* CPU */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base sm:text-lg font-semibold">
                                            {formatVCores(cpuPercent / 100)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {t('config.currently', {
                                                value: formatVCores(current.cpuPercent / 100),
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                        <Euro
                                            cents={location.cpu.pricePerCore}
                                            unit={t('config.cpu.price-suffix')}
                                        />
                                    </div>
                                </div>
                                <Slider
                                    value={[cpuPercent / 100]}
                                    min={bounds.cpuMinPercent / 100}
                                    max={bounds.cpuMaxPercent / 100}
                                    step={1}
                                    onValueChange={(v) => setCpuPercent(Math.round(v[0] * 100))}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{bounds.cpuMinPercent / 100}</span>
                                    <span>{bounds.cpuMaxPercent / 100}</span>
                                </div>
                            </div>

                            {/* RAM */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base sm:text-lg font-semibold">
                                            {ramMb / 1024} {t('config.ram.label-suffix')}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {t('config.currently', {
                                                value: `${current.ramMb / 1024} GiB`,
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                        <Euro
                                            cents={location.ram.pricePerGb}
                                            unit={t('config.ram.price-suffix')}
                                        />
                                    </div>
                                </div>
                                <Slider
                                    value={[ramMb / 1024]}
                                    min={bounds.ramMinMb / 1024}
                                    max={bounds.ramMaxMb / 1024}
                                    step={0.5}
                                    onValueChange={(v) => setRamMb(Math.round(v[0] * 1024))}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{bounds.ramMinMb / 1024} GiB</span>
                                    <span>{bounds.ramMaxMb / 1024} GiB</span>
                                </div>
                            </div>

                            {/* Resource tier */}
                            {tiers.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium">
                                        {t('config.resource-tier')}
                                    </h3>
                                    <ResourceTierSelector
                                        tiers={tiers}
                                        selectedId={tierId}
                                        onSelect={setTierId}
                                        persistedTierId={currentTier?.id ?? null}
                                        unavailableReasons={unavailableReasons}
                                    />
                                    {usage ? (
                                        <p className="text-xs text-muted-foreground">
                                            {t('usage.current', {
                                                disk: gib(usage.diskUsageMb),
                                                backups: usage.backupCount,
                                                ports: usage.allocationCount,
                                            })}
                                        </p>
                                    ) : null}
                                    {(someTierBlockedByUsage || !usage) && (
                                        <div className="flex gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                                            <Info className="h-4 w-4 shrink-0" />
                                            <p className="leading-4">
                                                {usage
                                                    ? t('usage.smallerTierHint')
                                                    : t('usage.unknownHint')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Price overview */}
                <div className="order-1 lg:order-2">
                    {/* Sticks just below the page's own top bar (~70px + 16px gap; the navbar
                        scrolls away on this page). Must not exceed where the card rests, or it
                        gets pushed down out of line with the configuration card. */}
                    <div className="lg:sticky lg:top-[86px]">
                        <Card className="shadow-lg border-2 border-primary/20">
                            <CardHeader className="pb-3 md:pb-4">
                                <CardTitle className="text-lg sm:text-xl">
                                    {t('pricing.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm md:pt-0">
                                <dl className="space-y-1">
                                    <ChangeRow
                                        label="vCPU"
                                        from={formatVCores(current.cpuPercent / 100)}
                                        to={formatVCores(cpuPercent / 100)}
                                    />
                                    <ChangeRow
                                        label="RAM"
                                        from={`${current.ramMb / 1024} GiB`}
                                        to={`${ramMb / 1024} GiB`}
                                    />
                                    <ChangeRow
                                        label={t('config.resource-tier')}
                                        from={tierLabel(currentTier)}
                                        to={tierLabel(selectedTier)}
                                    />
                                </dl>

                                <div className="space-y-2 border-t pt-3">
                                    {quote.specChanged && (
                                        <div className="flex justify-between gap-3">
                                            <span className="text-muted-foreground">
                                                {quote.adjustmentCents >= 0
                                                    ? t('pricing.adjustUp', { days: remainingDays })
                                                    : t('pricing.adjustDown', {
                                                          days: remainingDays,
                                                      })}
                                            </span>
                                            <span className="tabular-nums">
                                                {quote.adjustmentCents < 0 && '−'}
                                                <Euro cents={Math.abs(quote.adjustmentCents)} />
                                            </span>
                                        </div>
                                    )}
                                    {days > 0 && (
                                        <div className="flex justify-between gap-3">
                                            <span className="text-muted-foreground">
                                                {t(
                                                    quote.specChanged
                                                        ? 'pricing.extend'
                                                        : 'pricing.extendOnly',
                                                    { days },
                                                )}
                                                {quote.extension.modifierCents !== 0 && (
                                                    <span className="block text-xs">
                                                        {quote.extension.modifierCents > 0
                                                            ? t.rich('pricing.discount', {
                                                                  percent:
                                                                      quote.extension
                                                                          .modifierPercent,
                                                                  amount: () => (
                                                                      <Euro
                                                                          cents={
                                                                              quote.extension
                                                                                  .modifierCents
                                                                          }
                                                                      />
                                                                  ),
                                                              })
                                                            : t.rich('pricing.surcharge', {
                                                                  percent:
                                                                      -quote.extension
                                                                          .modifierPercent,
                                                                  amount: () => (
                                                                      <Euro
                                                                          cents={
                                                                              -quote.extension
                                                                                  .modifierCents
                                                                          }
                                                                      />
                                                                  ),
                                                              })}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="tabular-nums">
                                                <Euro cents={quote.extension.totalCents} />
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {statusMessage && (
                                    <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                                        {statusMessage}
                                    </p>
                                )}
                                {/* Only relevant when something is charged or credited for the time left */}
                                {quote.specChanged && quote.remainingMs > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {t('pricing.noRefund')}
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter className="border-t pt-4 bg-muted/20 flex flex-col gap-3 font-semibold">
                                <div className="flex justify-between items-center w-full text-lg">
                                    <span className="text-primary">{t('footer.total')}</span>
                                    <span className="text-2xl font-bold text-primary tabular-nums">
                                        <Euro cents={quote.totalCents} />
                                    </span>
                                </div>
                                {continueButton('hidden lg:flex w-full font-bold')}
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Mobile continue bar */}
            <div className="lg:hidden sticky bottom-0 z-20 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
                <div className="flex items-center gap-4 max-w-7xl mx-auto">
                    <div className="shrink-0 min-w-25">
                        <div className="text-xs text-muted-foreground">{t('footer.total')}</div>
                        <div className="text-xl font-bold text-primary tabular-nums">
                            <Euro cents={quote.totalCents} />
                        </div>
                    </div>
                    {continueButton('flex-1 font-bold')}
                </div>
            </div>
        </div>
    );
}

function ChangeRow({ label, from, to }: { label: string; from: string; to: string }) {
    const changed = from !== to;
    return (
        <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right">
                {changed ? (
                    <>
                        <span className="text-muted-foreground line-through mr-1.5">{from}</span>
                        <span className="font-medium">{to}</span>
                    </>
                ) : (
                    <span>{from}</span>
                )}
            </dd>
        </div>
    );
}
