import { HardwareConfig } from '@/models/config';
import { PerformanceGroup } from '@/models/prisma';

type PriceBreakdown = {
    totalCents: number;
    cents: { cpu: number; ram: number };
};

type Discount = { cents: number; percent: number };

export type NewPriceDef = PriceBreakdown & { discount: Discount };
export type UpgradePriceDef = {
    totalCents: number;
    upgradeCents: { cpu: number; ram: number };
    extendCents: { cpu: number; ram: number };
    discount: Discount;
};

export function calculateNew(
    pf: PerformanceGroup,
    cpuPercent: number,
    ramMB: number,
    duration: number,
): NewPriceDef {
    const baseCalc = calculateBase(pf, cpuPercent, ramMB, duration);

    const { cents, percent } = calculateDiscount(duration, baseCalc.totalCents);
    const totalPrice: NewPriceDef = {
        totalCents: baseCalc.totalCents - cents,
        cents: { cpu: baseCalc.cents.cpu, ram: baseCalc.cents.ram },
        discount: { cents: cents, percent: percent },
    };

    return totalPrice;
}

export function calculateUpgradeCost(
    oldConfig: HardwareConfig,
    upgradeByConfig: HardwareConfig,
    pf: PerformanceGroup,
): UpgradePriceDef {
    const costToUpgrade = calculateBase(
        pf,
        upgradeByConfig.cpuPercent,
        upgradeByConfig.ramMb,
        oldConfig.durationsDays,
    );
    const costToExtend = calculateBase(
        pf,
        upgradeByConfig.cpuPercent + oldConfig.cpuPercent,
        upgradeByConfig.ramMb + oldConfig.ramMb,
        upgradeByConfig.durationsDays,
    );

    const totalCents = costToExtend.totalCents + costToUpgrade.totalCents;

    const { cents, percent } = calculateDiscount(upgradeByConfig.durationsDays, totalCents);

    const res: UpgradePriceDef = {
        extendCents: {
            cpu: costToExtend.cents.cpu,
            ram: costToExtend.cents.ram,
        },
        upgradeCents: {
            cpu: costToUpgrade.cents.cpu,
            ram: costToUpgrade.cents.ram,
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
