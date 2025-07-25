import { Prisma } from "@prisma/client";

export type PerformanceGroup = Prisma.LocationGetPayload<{ include: { cpu: true, ram: true }}>;

export type ClientServer = Prisma.ServerOrderGetPayload<{include: { gameData: true }}>;