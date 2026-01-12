import { env } from 'next-runtime-env';
import { logger } from '../logger';

type NotificationType = 'Support' | 'FatalError' | 'Error' | 'Info' | 'Warning';

interface TelegramButton {
    text: string;
    url: string;
}

interface SendMessageOptions {
    reply_markup?: {
        inline_keyboard: Array<Array<TelegramButton>>;
    };
}

/**
 * Escapes HTML special characters for Telegram's HTML parse mode
 * Safe for user-generated content
 */
export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Core Telegram message sender
 */
async function sendTelegramMessage(
    message: string,
    options?: SendMessageOptions,
): Promise<boolean> {
    const chat_id = env('TELEGRAM_CHAT_ID');
    const bot_token = env('TELEGRAM_BOT_TOKEN');

    if (!bot_token || !chat_id) {
        logger.warn('Telegram credentials missing - notification skipped', 'TELEGRAM');
        return false;
    }

    const url = `https://api.telegram.org/bot${bot_token}/sendMessage`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chat_id,
                text: message,
                parse_mode: 'HTML',
                ...options,
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            logger.error(
                `Failed to send Telegram notification: ${res.status} - ${body}`,
                'TELEGRAM',
            );
            return false;
        }

        return true;
    } catch (error) {
        logger.error(
            `Telegram API error: ${error instanceof Error ? error.message : String(error)}`,
            'TELEGRAM',
        );
        return false;
    }
}

/**
 * Send support ticket notification
 */
export async function sendSupportTicketNotification(params: {
    category: string;
    userEmail: string;
    subject: string | null;
    message: string;
    ticketUrl?: string;
}): Promise<boolean> {
    const { category, userEmail, subject, message, ticketUrl } = params;

    const text =
        `<b>🎫 New Ticket Created</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Type:</b> <code>${escapeHtml(category)}</code>\n` +
        `<b>User:</b> <code>${escapeHtml(userEmail)}</code>\n` +
        `<b>Subject:</b> ${escapeHtml(subject || 'No subject')}\n\n` +
        `<b>Message:</b>\n` +
        `<pre>${escapeHtml(message)}</pre>`;

    const options: SendMessageOptions | undefined = ticketUrl
        ? {
              reply_markup: {
                  inline_keyboard: [
                      [
                          {
                              text: '🔗 Open Ticket',
                              url: ticketUrl,
                          },
                      ],
                  ],
              },
          }
        : undefined;

    return sendTelegramMessage(text, options);
}

/**
 * Send fatal error notification
 */
export async function sendFatalErrorNotification(params: {
    errorMessage: string;
    context?: string;
    userId?: string;
    gameServerId?: string;
    additionalInfo?: Record<string, unknown>;
}): Promise<boolean> {
    const { errorMessage, context, userId, gameServerId, additionalInfo } = params;

    let text =
        `<b>🚨 FATAL ERROR</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Message:</b> ${escapeHtml(errorMessage)}\n`;

    if (context) {
        text += `<b>Type:</b> <code>${escapeHtml(context)}</code>\n`;
    }

    if (userId) {
        text += `<b>User ID:</b> <code>${escapeHtml(userId)}</code>\n`;
    }

    if (gameServerId) {
        text += `<b>Server ID:</b> <code>${escapeHtml(gameServerId)}</code>\n`;
    }

    if (additionalInfo && Object.keys(additionalInfo).length > 0) {
        text += `\n<b>Additional Info:</b>\n`;
        for (const [key, value] of Object.entries(additionalInfo)) {
            if (value !== undefined && value !== null) {
                const valueStr =
                    typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

                // Truncate long values
                const displayValue =
                    valueStr.length > 300 ? valueStr.substring(0, 300) + '...' : valueStr;

                text += `  • <b>${escapeHtml(key)}:</b> <code>${escapeHtml(displayValue)}</code>\n`;
            }
        }
    }

    return sendTelegramMessage(text);
}

/**
 * Send regular error notification
 */
export async function sendErrorNotification(params: {
    errorMessage: string;
    context?: string;
    userId?: string;
    gameServerId?: string;
    details?: Record<string, unknown>;
}): Promise<boolean> {
    const { errorMessage, context, userId, gameServerId, details } = params;

    let text =
        `<b>⚠️ Error Occurred</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Message:</b> ${escapeHtml(errorMessage)}\n`;

    if (context) {
        text += `<b>Type:</b> <code>${escapeHtml(context)}</code>\n`;
    }

    if (userId) {
        text += `<b>User ID:</b> <code>${escapeHtml(userId)}</code>\n`;
    }

    if (gameServerId) {
        text += `<b>Server ID:</b> <code>${escapeHtml(gameServerId)}</code>\n`;
    }

    if (details && Object.keys(details).length > 0) {
        text += `\n<b>Details:</b>\n`;
        for (const [key, value] of Object.entries(details)) {
            if (value !== undefined && value !== null) {
                const valueStr =
                    typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

                // Truncate long values
                const displayValue =
                    valueStr.length > 300 ? valueStr.substring(0, 300) + '...' : valueStr;

                text += `  • <b>${escapeHtml(key)}:</b> <code>${escapeHtml(displayValue)}</code>\n`;
            }
        }
    }

    return sendTelegramMessage(text);
}

/**
 * Send info notification
 */
export async function sendInfoNotification(params: {
    title: string;
    message: string;
    details?: Record<string, string | number>;
}): Promise<boolean> {
    const { title, message, details } = params;

    let text =
        `<b>ℹ️ ${escapeHtml(title)}</b>\n` + `━━━━━━━━━━━━━━━━━━━━\n` + `${escapeHtml(message)}\n`;

    if (details && Object.keys(details).length > 0) {
        text += `\n`;
        for (const [key, value] of Object.entries(details)) {
            text += `<b>${escapeHtml(key)}:</b> <code>${escapeHtml(String(value))}</code>\n`;
        }
    }

    return sendTelegramMessage(text);
}

/**
 * Send warning notification
 */
export async function sendWarningNotification(params: {
    title: string;
    message: string;
    context?: string;
}): Promise<boolean> {
    const { title, message, context } = params;

    let text =
        `<b>⚠️ Warning: ${escapeHtml(title)}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${escapeHtml(message)}\n`;

    if (context) {
        text += `\n<b>Context:</b> <code>${escapeHtml(context)}</code>\n`;
    }

    return sendTelegramMessage(text);
}

/**
 * Legacy default export for backward compatibility
 * @deprecated Use specific notification functions instead
 */
export default async function sendTelegramNotification(
    type: NotificationType,
    message: string,
    options?: SendMessageOptions,
): Promise<boolean> {
    return sendTelegramMessage(message, options);
}
