import { PrismaClient } from '@/app/client/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env } from 'next-runtime-env'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const adapter = new PrismaPg({
  connectionString: env("DATABASE_URL")!,
})

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
  log: env("NODE_ENV") === "development" ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma