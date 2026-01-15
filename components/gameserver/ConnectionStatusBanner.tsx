'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useConnectionState } from '@/hooks/useServerWebSocket';

/**
 * Displays a connection status banner when the WebSocket is disconnected or reconnecting.
 * Only shows when there's a connection issue - invisible when connected.
 */
export function ConnectionStatusBanner() {
    const { wsState, isReconnecting, reconnectAttempt, isConnected } = useConnectionState();
    const t = useTranslations('gameserver');

    // Don't show anything when connected
    if (isConnected) return null;

    const isConnecting = wsState === 'CONNECTING' || wsState === 'AUTHENTICATING';

    return (
        <Alert
            variant="destructive"
            className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        >
            <div className="flex items-center gap-2">
                {isConnecting || isReconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <WifiOff className="h-4 w-4" />
                )}
                <AlertDescription className="text-sm">
                    {isReconnecting
                        ? t('connection.reconnecting', { attempt: reconnectAttempt })
                        : isConnecting
                          ? t('connection.connecting')
                          : t('connection.disconnected')}
                </AlertDescription>
            </div>
        </Alert>
    );
}
