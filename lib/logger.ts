import { Prisma, PrismaClient } from '@/app/client/generated/client';
import { LogLevel, LogType } from '@/app/client/generated/enums';
import prisma from '@/lib/prisma';
import { sendErrorNotification, sendFatalErrorNotification } from './Notifications/telegram';


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
     * Formats details for clean console output
     */
    private formatDetailsForConsole(details?: Record<string, any>): string {
        if (!details) return '';

        const cleaned = { ...details };

        // Truncate long stack traces
        if (cleaned.stack && typeof cleaned.stack === 'string') {
            const lines = cleaned.stack.split('\n');
            if (lines.length > 5) {
                cleaned.stack = lines.slice(0, 5).join('\n') + '\n... (truncated)';
            }
        }

        // Format error objects
        if (cleaned.error) {
            if (cleaned.error instanceof Error) {
                cleaned.error = {
                    name: cleaned.error.name,
                    message: cleaned.error.message,
                };
            } else if (typeof cleaned.error === 'string') {
                // Truncate very long error strings
                if (cleaned.error.length > 500) {
                    cleaned.error = cleaned.error.substring(0, 500) + '... (truncated)';
                }
            }
        }

        return JSON.stringify(cleaned, null, 2);
    }

    /**
     * Core logging method - all other methods call this
     */
    private async log(entry: LogEntry): Promise<void> {
        try {
            // Clean console output
            const formattedDetails = this.formatDetailsForConsole(entry.details);
            if (formattedDetails) {
                console.log(`[${entry.level}] [${entry.type}] ${entry.message}\n${formattedDetails}`);
            } else {
                console.log(`[${entry.level}] [${entry.type}] ${entry.message}`);
            }

            await this.prisma.applicationLog.create({
                data: {
                    level: entry.level,
                    type: entry.type,
                    message: entry.message,
                    details: entry.details
                        ? (entry.details as Prisma.InputJsonValue)
                        : Prisma.JsonNull,
                    method: entry.method || null,
                    path: entry.path || null,
                    userAgent: entry.userAgent || null,
                    ipAddress: entry.ipAddress || null,
                    userId: entry.userId || null,
                    gameServerId: entry.gameServerId || null,
                },
            });
        } catch (error) {
            console.error('Failed to write to ApplicationLog:', error);
            console.error('Original log entry:', entry);
        }
    }

    /**
     * Log an informational message
     */
    async info(message: string, type: LogType = 'SYSTEM', context?: LogContext): Promise<void> {
        await this.log({
            message,
            level: 'INFO',
            type,
            ...context,
        });
    }

    /**
     * Log a warning
     */
    async warn(message: string, type: LogType = 'SYSTEM', context?: LogContext): Promise<void> {
        await this.log({
            message,
            level: 'WARN',
            type,
            ...context,
        });
    }

    /**
     * Log an error
     */
    async error(message: string, type: LogType = 'SYSTEM', context?: LogContext): Promise<void> {
        await this.log({
            message,
            level: 'ERROR',
            type,
            ...context,
        });

        // Send Telegram notification with all context
        sendErrorNotification({
            errorMessage: message,
            context: type,
            userId: context?.userId,
            gameServerId: context?.gameServerId,
            details: context?.details ? this.sanitizeDetailsForNotification(context.details) : undefined
        }).catch(err => {
            console.error('Failed to send error notification to Telegram:', err);
        });
    }

    /**
     * Sanitize details for Telegram notifications (remove large objects, truncate long strings)
     */
    private sanitizeDetailsForNotification(details: Record<string, any>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(details)) {
            if (key === 'stack') {
                // Include only first 3 lines of stack trace
                if (typeof value === 'string') {
                    const lines = value.split('\n').slice(0, 3);
                    sanitized[key] = lines.join('\n');
                }
            } else if (typeof value === 'string' && value.length > 200) {
                sanitized[key] = value.substring(0, 200) + '...';
            } else if (typeof value === 'object' && value !== null) {
                // Convert objects to strings but keep them short
                const str = JSON.stringify(value);
                if (str.length > 200) {
                    sanitized[key] = str.substring(0, 200) + '...';
                } else {
                    sanitized[key] = value;
                }
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Log a fatal error
     */
    async fatal(message: string, type: LogType = 'SYSTEM', context?: LogContext): Promise<void> {
        await this.log({
            message,
            level: 'FATAL',
            type,
            ...context,
        });

        // Send Telegram notification with all context
        sendFatalErrorNotification({
            errorMessage: message,
            context: type,
            userId: context?.userId,
            gameServerId: context?.gameServerId,
            additionalInfo: context?.details ? this.sanitizeDetailsForNotification(context.details) : undefined
        }).catch(err => {
            console.error('Failed to send fatal error notification to Telegram:', err);
        });
    }


    /**
     * Helper to extract request context from Next.js Request object
     */
    extractRequestContext(request: Request): Partial<LogContext> {
        return {
            method: request.method,
            path: new URL(request.url).pathname,
            userAgent: request.headers.get('user-agent') || undefined,
            ipAddress:
                request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                request.headers.get('x-real-ip') ||
                undefined,
        };
    }

    /**
     * Helper to extract request context from Next.js headers
     */
    extractHeadersContext(headers: Headers): Partial<LogContext> {
        return {
            userAgent: headers.get('user-agent') || undefined,
            ipAddress:
                headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                headers.get('x-real-ip') ||
                undefined,
        };
    }

    /**
     * Helper to log errors with stack trace
     */
    async logError(
        error: Error | unknown,
        type: LogType = 'SYSTEM',
        context?: LogContext,
    ): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : String(error);
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
            orderBy: { createdAt: 'desc' },
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
            level: 'ERROR',
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
