/**
 * Escapes HTML special characters for Telegram's HTML parse mode
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Core Telegram message sender
 */
async function sendTelegramMessage(message: string): Promise<boolean> {
    const chat_id = process.env.TELEGRAM_CHAT_ID;
    const bot_token = process.env.TELEGRAM_BOT_TOKEN;

    if (!bot_token || !chat_id) {
        console.warn('[Telegram] Credentials missing - notification skipped');
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
            }),
        });

        if (!res.ok) {
            const body = await res.text();
            console.error(`[Telegram] Failed to send notification: ${res.status} - ${body}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error(
            `[Telegram] API error: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
    }
}

/**
 * Send new version notification
 */
export async function sendNewVersionNotification(params: {
    gameName: string;
    oldVersion: string;
    newVersion: string;
    branch?: string;
    releaseUrl?: string;
}): Promise<boolean> {
    const { gameName, oldVersion, newVersion, branch, releaseUrl } = params;

    let text =
        `<b>🎮 New ${escapeHtml(gameName)} Version Available</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Old Version:</b> <code>${escapeHtml(oldVersion)}</code>\n` +
        `<b>New Version:</b> <code>${escapeHtml(newVersion)}</code>\n`;

    if (branch) {
        text += `<b>Branch:</b> <code>${escapeHtml(branch)}</code>\n`;
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
 * Send error notification
 */
export async function sendErrorNotification(params: {
    errorMessage: string;
    context?: string;
    details?: Record<string, unknown>;
}): Promise<boolean> {
    const { errorMessage, context, details } = params;

    let text =
        `<b>⚠️ Worker Error</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<b>Message:</b> ${escapeHtml(errorMessage)}\n`;

    if (context) {
        text += `<b>Context:</b> <code>${escapeHtml(context)}</code>\n`;
    }

    if (details && Object.keys(details).length > 0) {
        text += `\n<b>Details:</b>\n`;
        for (const [key, value] of Object.entries(details)) {
            if (value !== undefined && value !== null) {
                const valueStr =
                    typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

                const displayValue =
                    valueStr.length > 300 ? valueStr.substring(0, 300) + '...' : valueStr;

                text += `  • <b>${escapeHtml(key)}:</b> <code>${escapeHtml(displayValue)}</code>\n`;
            }
        }
    }

    return sendTelegramMessage(text);
}
