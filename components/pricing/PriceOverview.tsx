import { getTranslations } from 'next-intl/server';
import { formatMB } from '@/lib/GlobalFunctions/ptResourceLogic';
import type { PerformanceGroup, ResourceTierDisplay } from '@/models/prisma';

type PriceOverviewProps = {
    performanceGroups: PerformanceGroup[];
    resourceTiers: ResourceTierDisplay[];
};

const euros = (cents: number) => `${(cents / 100).toFixed(2)} €`;

/**
 * Every performance group, resource tier and duration modifier as static tables. The configurator
 * above only shows the selected group, so without this the prices of the other groups never
 * appear in the HTML that search engines and AI answers read.
 */
export async function PriceOverview({ performanceGroups, resourceTiers }: PriceOverviewProps) {
    const t = await getTranslations('pricing');

    const durations = [
        { label: t('discounts.weekLabel'), modifier: t('discounts.weekModifier') },
        { label: t('discounts.monthLabel'), modifier: t('discounts.monthModifier') },
        { label: t('discounts.threeMonthsLabel'), modifier: t('discounts.threeMonthsModifier') },
        { label: t('discounts.sixMonthsLabel'), modifier: t('discounts.sixMonthsModifier') },
    ];

    return (
        <section className="flex flex-col gap-6">
            <div>
                <h2 className="text-lg md:text-xl font-semibold">{t('overview.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('overview.subtitle')}</p>
            </div>

            <OverviewTable
                title={t('performance.title')}
                subtitle={t('performance.subtitle')}
                headers={[
                    t('performance.groupLabel'),
                    t('performance.cpuLabel'),
                    t('performance.cpuPrice'),
                    t('performance.ramPrice'),
                ]}
                rows={performanceGroups.map((pf) => [
                    pf.name,
                    <>
                        {pf.cpu.name}
                        <span className="block text-xs text-muted-foreground">
                            {t('performance.vCoreRange', {
                                min: pf.cpu.minThreads,
                                max: pf.cpu.maxThreads,
                            })}
                            {', '}
                            {t('performance.ramRange', { min: pf.ram.minGb, max: pf.ram.maxGb })}
                        </span>
                    </>,
                    euros(pf.cpu.pricePerCore),
                    euros(pf.ram.pricePerGb),
                ])}
            />

            {resourceTiers.length > 0 && (
                <OverviewTable
                    title={t('resourceTiers.title')}
                    subtitle={t('resourceTiers.subtitle')}
                    headers={[
                        t('resourceTiers.tierLabel'),
                        t('resourceTiers.diskLabel'),
                        t('resourceTiers.backupsLabel'),
                        t('resourceTiers.portsLabel'),
                        t('resourceTiers.priceLabel'),
                    ]}
                    rows={resourceTiers.map((rt) => [
                        rt.name,
                        formatMB(rt.diskMB),
                        String(rt.backups),
                        String(rt.ports),
                        rt.priceCents > 0 ? euros(rt.priceCents) : t('resourceTiers.free'),
                    ])}
                />
            )}

            <OverviewTable
                title={t('discounts.title')}
                subtitle={t('discounts.subtitle')}
                headers={[t('discounts.durationLabel'), t('discounts.modifierLabel')]}
                rows={durations.map((d) => [d.label, d.modifier])}
            />

            <p className="text-sm text-muted-foreground">{t('overview.vatNote')}</p>
        </section>
    );
}

function OverviewTable({
    title,
    subtitle,
    headers,
    rows,
}: {
    title: string;
    subtitle: string;
    headers: string[];
    rows: React.ReactNode[][];
}) {
    return (
        <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mb-2 text-xs text-muted-foreground">{subtitle}</p>
            <div className="rounded-xl border bg-card overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {headers.map((header, i) => (
                                <th
                                    key={header}
                                    scope="col"
                                    className={`px-4 py-2.5 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((cells, r) => (
                            <tr key={r} className={r < rows.length - 1 ? 'border-b' : undefined}>
                                {cells.map((cell, i) =>
                                    i === 0 ? (
                                        <th
                                            key={i}
                                            scope="row"
                                            className="px-4 py-3 text-left font-semibold"
                                        >
                                            {cell}
                                        </th>
                                    ) : (
                                        <td
                                            key={i}
                                            className="px-4 py-3 text-right tabular-nums"
                                        >
                                            {cell}
                                        </td>
                                    ),
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
