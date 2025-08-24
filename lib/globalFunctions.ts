import { HardwareConfig } from "@/models/config";
import { PerformanceGroup } from "@/models/prisma";
import { OrderType } from "@prisma/client";

// Config
const minBackups = 2;
const maxBackups = 100;
const minDisk = 10240; // 10GiB in MiB
const maxDisk = 102400; // 100GiB in MiB

// Input CPU % - 1 Thread = 100 | RamSize in MiB | return MiB
/**
 * Calculates the disk size based on the provided CPU and RAM size.
 * The calculation is performed using the formula: `(cpu / 50 + ramSize / 512) * 1024`,
 * with the result being constrained between `minDisk` and `maxDisk` values.
 *
 * @param cpu - The number of CPU in %.
 * @param ramSize - The size of RAM in MiB (mebibytes).
 * @returns The calculated disk size in MiB, constrained by the minimum and maximum disk size limits.
 */
export function calcDiskSize(cpu: number, ramSize: number): number {
  // Calculates Disk like this: threads*2 + ramGiB*2 min and Max Values set
  return 81_920;

  return Math.max(
    Math.min(
      maxDisk,
      Math.ceil(cpu / 50 + ramSize / 512) * 1024), // threads*2 + ramGiB*2;
    minDisk
  );
}

/**
 * Calculates the number of backups based on CPU cores and RAM size.
 *
 * The formula used is: `cores + (RAM in GB * 0.8)`, with the result
 * constrained between `minBackups` and `maxBackups`.
 *
 * @param cpu - The number of CPU in %.
 * @param ramSize - The size of RAM in megabytes.
 * @returns The calculated number of backups, constrained by minimum and maximum values.
 */
export function calcBackups(cpu: number, ramSize: number): number {
  // Calculates Backups like this: cores + RamGB * 0.8 min and max Values set
  return 10;
  return Math.max(
    Math.min(maxBackups, Math.ceil(cpu / 100 + (ramSize / 1024) * 0.8)),
    minBackups
  );
}

export function getEggId(gameName: string): number {
  switch (gameName.toLowerCase()) {
    case "minecraft":
      return 5;
    // case 'satisfactory':
    //     return 2;
    // case 'terraria':
    //     return 3;
    // case 'ark':
    //     return 4;
    default:
      return -1;
  }
}


export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const base = 1024;

  const unitIndex = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
  const clampedIndex = Math.min(unitIndex, units.length - 1);

  const value = bytes / Math.pow(base, clampedIndex);

  const formatted = parseFloat(value.toFixed(1));

  return `${formatted} ${units[clampedIndex]}`;
}


export type NewPriceDef = {
  totalCents: number,
  cents: { cpu: number, ram: number },
  discount: { cents: number, percent: number }
};

export function calculateNew(pf: PerformanceGroup, cpuPercent: number, ramMB: number, duration: number): NewPriceDef {
  const baseCalc = calculateBase(pf, cpuPercent, ramMB, duration);
  const toPay = parseFloat(((baseCalc.cents.cpu + baseCalc.cents.ram) / 30 * duration).toFixed(2));

  const { amount, percent } = calculateDiscount(duration, toPay)

  return { totalCents: toPay - amount, cents: { cpu: baseCalc.cents.cpu, ram: baseCalc.cents.ram }, discount: { cents: amount, percent: percent } };
}


export type UpgradePriceDef = {
  totalCents: number,
  upgradeCents: { cpu: number, ram: number },
  extendCents: { cpu: number, ram: number },
  discount: { cents: number, percent: number }
};

export function calculateUpgradeCost(oldConfig: HardwareConfig, upgradeByConfig: HardwareConfig, pf: PerformanceGroup): UpgradePriceDef {
  const costToUpgrade = calculateBase(pf, upgradeByConfig.cpuPercent, upgradeByConfig.ramMb, oldConfig.durationsDays);
  const costToExtend = calculateBase(pf, upgradeByConfig.cpuPercent + oldConfig.cpuPercent, upgradeByConfig.ramMb + oldConfig.ramMb, upgradeByConfig.durationsDays);
  
  const totalCents = costToExtend.totalCents + costToUpgrade.totalCents;
  
  const { amount, percent } = calculateDiscount(upgradeByConfig.durationsDays, totalCents);
  
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
      cents: amount,
      percent: percent,
    },
    totalCents: parseFloat((totalCents - amount).toFixed(2)),
  };
  
  return res;
}


export type priceDef = {
  totalCents: number,
  cents: { cpu: number, ram: number }
};

export function calculateBase(pf: PerformanceGroup, cpuPercent: number, ramMB: number, duration: number): priceDef {
  const cpuPrice = pf.cpu.pricePerCore * cpuPercent / 100 / 30 * duration;
  const ramPrice = pf.ram.pricePerGb * ramMB / 1024 / 30 * duration;

  const toPay = parseFloat(((cpuPrice + ramPrice)).toFixed(2));

  return { totalCents: toPay, cents: { cpu: cpuPrice, ram: ramPrice } };
}

function calculateDiscount(days: number, totalPrice: number) {
  let percent = 0;
  if (days >= 180) {
    percent = 15; // 15% discount for 6 months
  } else if (days >= 90) {
    percent = 10; // 10% discount for 3 months
  }
  const amount = totalPrice * (percent / 100);
  return { amount: parseFloat(amount.toFixed(2)), percent };
}