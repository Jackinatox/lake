import { PrismaClient, LogLevel, LogType, Prisma } from "@prisma/client";
import { prisma } from "@/prisma";

/**
 * Unified application logger that writes to ApplicationLog table.
 * Can be easily swapped to different backends (file, cloud logging, etc.) later.
 */

export interface LogContext {
    // Request context
    method?: string;
    path?: string;
    userAgent?: string;
    ipAddress?: string;

    // User context
    userId?: string;

    // Game server context
    gameServerId?: string;

    // Additional structured data
    details?: Record<string, any>;
}

export interface LogEntry extends LogContext {
    message: string;
    level: LogLevel;
    type: LogType;
}

class Logger {
    private prisma: PrismaClient;

    constructor(prismaClient: PrismaClient) {
        this.prisma = prismaClient;
    }

    /**
     * Core logging method - all other methods call this
     */
    private async log(entry: LogEntry): Promise<void> {
        try {
            console.log(`[${entry.level}] [${entry.type}] ${entry.message}`, entry.details);
            await this.prisma.applicationLog.create({
                data: {
                    level: entry.level,
                    type: entry.type,
                    message: entry.message,
                    details: entry.details ? (entry.details as Prisma.InputJsonValue) : Prisma.JsonNull,
                    method: entry.method || null,
                    path: entry.path || null,
                    userAgent: entry.userAgent || null,
                    ipAddress: entry.ipAddress || null,
                    userId: entry.userId || null,
                    gameServerId: entry.gameServerId || null,
                },
            });
        } catch (error) {
            console.error("Failed to write to ApplicationLog:", error);
            console.error("Original log entry:", entry);
        }
    }

    /**
     * Log an informational message
     */
    async info(
        message: string,
        type: LogType = "SYSTEM",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level: "INFO",
            type,
            ...context,
        });
    }

    /**
     * Log a warning
     */
    async warn(
        message: string,
        type: LogType = "SYSTEM",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level: "WARN",
            type,
            ...context,
        });
    }

    /**
     * Log an error
     */
    async error(
        message: string,
        type: LogType = "SYSTEM",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level: "ERROR",
            type,
            ...context,
        });
    }

    /**
     * Log a fatal error
     */
    async fatal(
        message: string,
        type: LogType = "SYSTEM",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level: "FATAL",
            type,
            ...context,
        });
    }

    /**
     * Log system events
     */
    async system(
        message: string,
        level: LogLevel = "INFO",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level,
            type: "SYSTEM",
            ...context,
        });
    }

    /**
     * Log authentication events
     */
    async auth(
        message: string,
        level: LogLevel = "INFO",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level,
            type: "AUTHENTICATION",
            ...context,
        });
    }

    /**
     * Log payment events
     */
    async payment(
        message: string,
        level: LogLevel = "INFO",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level,
            type: "PAYMENT",
            ...context,
        });
    }

    /**
     * Log game server events
     */
    async gameServer(
        message: string,
        level: LogLevel = "INFO",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level,
            type: "GAME_SERVER",
            ...context,
        });
    }

    /**
     * Log email events
     */
    async email(
        message: string,
        level: LogLevel = "INFO",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level,
            type: "EMAIL",
            ...context,
        });
    }

    /**
     * Log support ticket events
     */
    async ticket(
        message: string,
        level: LogLevel = "INFO",
        context?: LogContext
    ): Promise<void> {
        await this.log({
            message,
            level,
            type: "SUPPORT_TICKET",
            ...context,
        });
    }

    /**
     * Helper to extract request context from Next.js Request object
     */
    extractRequestContext(request: Request): Partial<LogContext> {
        return {
            method: request.method,
            path: new URL(request.url).pathname,
            userAgent: request.headers.get("user-agent") || undefined,
            ipAddress:
                request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                request.headers.get("x-real-ip") ||
                undefined,
        };
    }

    /**
     * Helper to extract request context from Next.js headers
     */
    extractHeadersContext(headers: Headers): Partial<LogContext> {
        return {
            userAgent: headers.get("user-agent") || undefined,
            ipAddress:
                headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                headers.get("x-real-ip") ||
                undefined,
        };
    }

    /**
     * Helper to log errors with stack trace
     */
    async logError(
        error: Error | unknown,
        type: LogType = "SYSTEM",
        context?: LogContext
    ): Promise<void> {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        await this.error(errorMessage, type, {
            ...context,
            details: {
                ...context?.details,
                stack: errorStack,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
            },
        });
    }

    /**
     * Query logs with filters
     */
    async query(filters: {
        level?: LogLevel;
        type?: LogType;
        userId?: string;
        gameServerId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }) {
        const where: any = {};

        if (filters.level) where.level = filters.level;
        if (filters.type) where.type = filters.type;
        if (filters.userId) where.userId = filters.userId;
        if (filters.gameServerId) where.gameServerId = filters.gameServerId;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        return await this.prisma.applicationLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: filters.limit || 100,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                gameServer: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    },
                },
            },
        });
    }

    /**
     * Get recent errors (useful for monitoring)
     */
    async getRecentErrors(limit: number = 50) {
        return await this.query({
            level: "ERROR",
            limit,
        });
    }

    /**
     * Get logs for a specific user
     */
    async getUserLogs(userId: string, limit: number = 100) {
        return await this.query({
            userId,
            limit,
        });
    }

    /**
     * Get logs for a specific game server
     */
    async getGameServerLogs(gameServerId: string, limit: number = 100) {
        return await this.query({
            gameServerId,
            limit,
        });
    }
}

// Export singleton instance
export const logger = new Logger(prisma);

// Export class for testing or custom instances
export { Logger };
