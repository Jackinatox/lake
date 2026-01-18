'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useCustomEvent } from '@/hooks/useServerWebSocket';
import { useServerStatus } from '@/hooks/useServerWebSocket';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

/**
 * HytaleOauthFeature - Listens for Hytale OAuth authentication prompts in console output
 * and displays a modal to help users authenticate.
 *
 * This component demonstrates how to use the WebSocket event system to listen for
 * specific console patterns without modifying the dashboard code.
 */
export default function HytaleOauthFeature() {
    const [visible, setVisible] = useState(false);
    const [oauthUrl, setOauthUrl] = useState('');
    const serverStatus = useServerStatus();
    const serverStatusRef = useRef(serverStatus);
    const t = useTranslations('gameserver');

    // Keep ref in sync with latest serverStatus
    useEffect(() => {
        serverStatusRef.current = serverStatus;
    }, [serverStatus]);

    // Listen for HYTALE_OAUTH custom events
    useCustomEvent('HYTALE_OAUTH', (data: { url: string }) => {
        // Only show when server is starting (not running)
        // Use ref to avoid stale closure
        if (serverStatusRef.current !== 'running') {
            setOauthUrl(data.url);
            setVisible(true);
        }
    });

    const handleLogin = useCallback(() => {
        if (oauthUrl) {
            // TODO: Implement proper OAuth redirect/handling
            // For now, open in new tab
            window.open(oauthUrl, '_blank', 'noopener,noreferrer');
            setVisible(false);
            setOauthUrl('');
        }
    }, [oauthUrl]);

    const handleDismiss = useCallback(() => {
        setVisible(false);
        setOauthUrl('');
    }, []);

    return (
        <Dialog open={visible} onOpenChange={handleDismiss}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('features.hytaleOauth.title')}</DialogTitle>
                    <DialogDescription>{t('features.hytaleOauth.description')}</DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleDismiss}>
                        {t('features.hytaleOauth.cancel')}
                    </Button>
                    <Button onClick={handleLogin} className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {t('features.hytaleOauth.login')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
