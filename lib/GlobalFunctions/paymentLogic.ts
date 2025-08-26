import { HardwareConfig } from "@/models/config";
import { PerformanceGroup } from "@/models/prisma";

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

export function calculateNew(pf: PerformanceGroup, cpuPercent: number, ramMB: number, duration: number): NewPriceDef {
    const baseCalc = calculateBase(pf, cpuPercent, ramMB, duration);
    console.log("base: ", baseCalc)

    const { cents, percent } = calculateDiscount(duration, baseCalc.totalCents)
    const totalPrice: NewPriceDef = { totalCents: baseCalc.totalCents - cents, cents: { cpu: baseCalc.cents.cpu, ram: baseCalc.cents.ram }, discount: { cents: cents, percent: percent } };

    console.log("return:", totalPrice)

    return totalPrice;
}


export function calculateUpgradeCost(oldConfig: HardwareConfig, upgradeByConfig: HardwareConfig, pf: PerformanceGroup): UpgradePriceDef {
    const costToUpgrade = calculateBase(pf, upgradeByConfig.cpuPercent, upgradeByConfig.ramMb, oldConfig.durationsDays);
    const costToExtend = calculateBase(pf, upgradeByConfig.cpuPercent + oldConfig.cpuPercent, upgradeByConfig.ramMb + oldConfig.ramMb, upgradeByConfig.durationsDays);

    const totalCents = costToExtend.totalCents + costToUpgrade.totalCents;

    const { cents, percent } = calculateDiscount(upgradeByConfig.durationsDays, totalCents);

    const res: UpgradePriceDef = {
        extendCents: {
            cpu: costToExtend.cents.cpu,
            ram: costToExtend.cents.ram
        },
        upgradeCents: {
            cpu: costToUpgrade.cents.cpu,
            ram: costToUpgrade.cents.ram
        },
        discount: {
            cents: cents,
            percent: percent,
        },
        totalCents: (totalCents - cents),
    };

    return res;
}

export function calculateBase(pf: PerformanceGroup, cpuPercent: number, ramMB: number, duration: number): PriceBreakdown {
    const cpuPrice = Math.round(pf.cpu.pricePerCore * cpuPercent / 100 / 30 * duration);
    const ramPrice = Math.round(pf.ram.pricePerGb * ramMB / 1024 / 30 * duration);

    const toPay = cpuPrice + ramPrice;

    return { totalCents: toPay, cents: { cpu: cpuPrice, ram: ramPrice } };
}

const DISCOUNT_THRESHOLDS: { days: number; percent: number }[] = [
    { days: 180, percent: 15 },
    { days: 90, percent: 10 },
];

function calculateDiscount(days: number, totalPrice: number): Discount {
    const applicable = DISCOUNT_THRESHOLDS.find(threshold => days >= threshold.days);

    const percent = applicable ? applicable.percent : 0;
    const amount = Math.round(totalPrice * (percent / 100));

    return { cents: amount, percent };
}
