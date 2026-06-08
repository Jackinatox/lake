import { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';

type PriceBreakdown = {
    totalCents: number;
    cents: { cpu: number; ram: number };
};

type UpgradeBreakdown = { cpu: number; ram: number; tier: number };

type Discount = { cents: number; percent: number };

export type NewPriceDef = PriceBreakdown & { discount: Discount; tierPriceCents: number };
export type UpgradePriceDef = {
    totalCents: number;
    upgradeCents: UpgradeBreakdown;
    extendCents: UpgradeBreakdown;
    discount: Discount;
};

export function calculateNew(
    pf: PerformanceGroup,
    cpuPercent: number,
    ramMB: number,
    duration: number,
    tierPriceCentsPerMonth: number = 0,
): NewPriceDef {
    const baseCalc = calculateBase(pf, cpuPercent, ramMB, duration);
    const proratedTierCents = Math.round((tierPriceCentsPerMonth / 30) * duration);

    const subtotal = baseCalc.totalCents + proratedTierCents;
    const { cents, percent } = calculateDiscount(duration, subtotal);
    const totalPrice: NewPriceDef = {
        totalCents: subtotal - cents,
        cents: { cpu: baseCalc.cents.cpu, ram: baseCalc.cents.ram },
        discount: { cents: cents, percent: percent },
        tierPriceCents: proratedTierCents,
    };

    return totalPrice;
}

export function calculateUpgradeCost(params: {
    currentConfig: HardwareConfig;
    targetConfig: HardwareConfig;
    performanceGroup: PerformanceGroup;
    currentTierPriceCents: number;
    newTierPriceCents: number;
}): UpgradePriceDef {
    const {
        currentConfig,
        targetConfig,
        performanceGroup,
        currentTierPriceCents,
        newTierPriceCents,
    } = params;

    const upgradeCpuPercent = Math.max(targetConfig.cpuPercent - currentConfig.cpuPercent, 0);
    const upgradeRamMb = Math.max(targetConfig.ramMb - currentConfig.ramMb, 0);
    const upgradeTierPriceCents = Math.max(newTierPriceCents - currentTierPriceCents, 0);

    const costToUpgrade = calculateBase(
        performanceGroup,
        upgradeCpuPercent,
        upgradeRamMb,
        currentConfig.durationsDays,
    );
    const proratedUpgradeTierCents = Math.round(
        (upgradeTierPriceCents / 30) * currentConfig.durationsDays,
    );

    const costToExtend = calculateBase(
        performanceGroup,
        targetConfig.cpuPercent,
        targetConfig.ramMb,
        targetConfig.durationsDays,
    );
    const proratedExtendTierCents = Math.round(
        (newTierPriceCents / 30) * targetConfig.durationsDays,
    );

    const totalCents =
        costToExtend.totalCents +
        proratedExtendTierCents +
        costToUpgrade.totalCents +
        proratedUpgradeTierCents;

    const { cents, percent } = calculateDiscount(targetConfig.durationsDays, totalCents);

    const res: UpgradePriceDef = {
        extendCents: {
            cpu: costToExtend.cents.cpu,
            ram: costToExtend.cents.ram,
            tier: proratedExtendTierCents,
        },
        upgradeCents: {
            cpu: costToUpgrade.cents.cpu,
            ram: costToUpgrade.cents.ram,
            tier: proratedUpgradeTierCents,
        },
        discount: {
            cents: cents,
            percent: percent,
        },
        totalCents: totalCents - cents,
    };

    return res;
}

export function calculateBase(
    pf: PerformanceGroup,
    cpuPercent: number,
    ramMB: number,
    duration: number,
): PriceBreakdown {
    const cpuPrice = Math.round(((pf.cpu.pricePerCore * cpuPercent) / 100 / 30) * duration);
    const ramPrice = Math.round(((pf.ram.pricePerGb * ramMB) / 1024 / 30) * duration);

    const toPay = cpuPrice + ramPrice;

    return { totalCents: toPay, cents: { cpu: cpuPrice, ram: ramPrice } };
}

// Negative percent = surcharge (adds to price), positive = discount (subtracts from price)
const DURATION_MODIFIERS: { days: number; percent: number; exact?: boolean }[] = [
    { days: 7, percent: -15, exact: true }, // short-term surcharge
    { days: 180, percent: 15 },
    { days: 90, percent: 10 },
];

function calculateDiscount(days: number, totalPrice: number): Discount {
    // Exact-match first (surcharges)
    const exact = DURATION_MODIFIERS.find((m) => m.exact && m.days === days);
    if (exact) {
        const amount = -Math.round(totalPrice * (Math.abs(exact.percent) / 100));
        return { cents: amount, percent: exact.percent };
    }
    // Threshold-based discounts
    const applicable = DURATION_MODIFIERS.filter((m) => !m.exact).find((m) => days >= m.days);
    const percent = applicable ? applicable.percent : 0;
    const amount = Math.round(totalPrice * (percent / 100));
    return { cents: amount, percent };
}
