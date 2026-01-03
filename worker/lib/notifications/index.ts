/**
 * Notification abstraction layer
 * Provides a unified interface for sending notifications across different providers
 */

import * as telegram from './telegram';

/**
 * Notification provider type
 */
export type NotificationProvider = 'telegram' | 'discord';

/**
 * Get current notification provider from environment
 */
function getProvider(): NotificationProvider {
    const provider = process.env.NOTIFICATION_PROVIDER || 'telegram';
    return provider as NotificationProvider;
}

/**
 * Send notification about new game version
 */
export async function notifyNewVersion(params: {
    gameName: string;
    oldVersion: string;
    newVersion: string;
    branch?: string;
}): Promise<boolean> {
    const provider = getProvider();

    switch (provider) {
        case 'telegram':
            return telegram.sendNewVersionNotification(params);
        case 'discord':
            // TODO: Implement Discord provider
            console.warn('[Notifications] Discord provider not yet implemented');
            return false;
        default:
            console.error(`[Notifications] Unknown provider: ${provider}`);
            return false;
    }
}

/**
 * Send info notification
 */
export async function notifyInfo(params: {
    title: string;
    message: string;
    details?: Record<string, string | number>;
}): Promise<boolean> {
    const provider = getProvider();

    switch (provider) {
        case 'telegram':
            return telegram.sendInfoNotification(params);
        case 'discord':
            console.warn('[Notifications] Discord provider not yet implemented');
            return false;
        default:
            console.error(`[Notifications] Unknown provider: ${provider}`);
            return false;
    }
}

/**
 * Send error notification
 */
export async function notifyError(params: {
    errorMessage: string;
    context?: string;
    details?: Record<string, unknown>;
}): Promise<boolean> {
    const provider = getProvider();

    switch (provider) {
        case 'telegram':
            return telegram.sendErrorNotification(params);
        case 'discord':
            console.warn('[Notifications] Discord provider not yet implemented');
            return false;
        default:
            console.error(`[Notifications] Unknown provider: ${provider}`);
            return false;
    }
}
