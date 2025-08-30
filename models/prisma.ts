import { Prisma } from "@prisma/client";

export type PerformanceGroup = Prisma.LocationGetPayload<{
  include: { cpu: true; ram: true };
}>;

export type ClientServer = Prisma.GameServerGetPayload<{
  include: { gameData: true };
}>;

export type DbSession = Prisma.GameServerOrderGetPayload<{
  include: { user: { select: { email: true } } };
}>;
