import { Prisma } from '@/app/client/generated/browser';

export type ResourceTier = Prisma.ResourceTierGetPayload<Record<string, never>>;
export type GameData = Prisma.GameDataGetPayload<Record<string, never>>;

export type HardwareRecommendationSlim = Prisma.HardwareRecommendationGetPayload<{
    select: {
        id: true;
        eggId: true;
        minCpuPercent: true;
        recCpuPercent: true;
        minramMb: true;
        recRamMb: true;
        preSelectedResourceTierId: true;
        note: true;
    };
}>;

export type PerformanceGroup = Prisma.LocationGetPayload<{
    include: { cpu: true; ram: true };
}>;

export type ClientServer = Prisma.GameServerGetPayload<{
    include: { gameData: true };
}>;

export type DbSession = Prisma.GameServerOrderGetPayload<{
    include: { user: { select: { email: true } } };
}>;

export type GameServerAdmin = Prisma.GameServerGetPayload<{
    include: { user: { select: { email: true } }; location: { select: { name: true } } };
}>;

export type PackageWithCPURAM = Prisma.PackageGetPayload<{
    include: { location: { include: { cpu: true; ram: true } } };
}>;

export type ApplicationLogWithRelations = Prisma.ApplicationLogGetPayload<{
    include: {
        user: { select: { id: true; name: true; username: true; email: true } };
        gameServer: { select: { id: true; name: true } };
    };
}>;

export type FreeServerPayment = Prisma.GameServerOrderGetPayload<{
    include: { gameServer: { select: { ptServerId: true; status: true; type: true; id: true } } };
}>;

export type PaymentWithRefunds = Prisma.GameServerOrderGetPayload<{
    include: {
        gameServer: { select: { ptServerId: true; status: true; type: true; id: true } };
        refunds: { select: { amount: true; status: true; type: true; isAutomatic: true } };
    };
}>;

export type RefundableOrder = Prisma.GameServerOrderGetPayload<{
    include: {
        user: { select: { id: true; email: true; name: true; username: true } };
        refunds: true;
        gameServer: { select: { ptServerId: true; name: true; status: true } };
        creationGameData: { select: { name: true } };
    };
}>;

export type RefundWithOrder = Prisma.RefundGetPayload<{
    include: {
        order: {
            include: {
                user: { select: { id: true; email: true; name: true; username: true } };
                creationGameData: { select: { name: true } };
            };
        };
    };
}>;

export type WithdrawalPageOrder = Prisma.GameServerOrderGetPayload<{
    include: {
        gameServer: { select: { ptServerId: true; name: true; status: true; type: true } };
        creationGameData: { select: { name: true } };
        refunds: {
            select: {
                id: true;
                amount: true;
                status: true;
                type: true;
                isAutomatic: true;
                reason: true;
                receiptNumber: true;
                createdAt: true;
                serverAction: true;
            };
        };
    };
}>;

export type ResourceTierDisplay = Prisma.ResourceTierGetPayload<{
    select: {
        id: true;
        name: true;
        diskMB: true;
        backups: true;
        ports: true;
        priceCents: true;
        enabled: true;
    };
}>;
