import { Prisma } from '@/app/client/generated/browser';

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
        user: { select: { id: true; name: true; email: true } };
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
        user: { select: { id: true; email: true; name: true } };
        refunds: true;
        gameServer: { select: { ptServerId: true; name: true; status: true } };
        creationGameData: { select: { name: true } };
    };
}>;

export type RefundWithOrder = Prisma.RefundGetPayload<{
    include: {
        order: {
            include: {
                user: { select: { id: true; email: true; name: true } };
                creationGameData: { select: { name: true } };
            };
        };
    };
}>;
