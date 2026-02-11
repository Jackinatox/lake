import type { GameConfig } from '@/models/config';

export interface OrderRestoreData {
    gameConfig: GameConfig | null;
    expiresAt: string;
    createdAt: string;
    ramMB: number;
    cpuPercent: number;
    diskMB: number;
    backupCount: number;
    creationLocationId: number;
    type: string;
}

export function calculateOrderDuration(expiresAt: Date | string, createdAt: Date | string): number {
    const expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    return Math.round((expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

export async function fetchOrderForRestore(orderId: string): Promise<OrderRestoreData | null> {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}
