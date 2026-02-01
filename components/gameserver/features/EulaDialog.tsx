'use client';

import { useCreds } from '@/contexts/WebSocketContext';
import { useCustomEvent, useSendCommand } from '@/hooks/useServerWebSocket';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog';
import { writeFile } from '../FileManager/pteroFileApi';
import { Spinner } from '@/components/ui/spinner';

/**
 * EulaDialog - Self-contained Minecraft EULA acceptance feature
 *
 * Listens for EULA custom event from WebSocket and displays dialog.
 * When user accepts, it should call an API to write eula=true to eula.txt
 *
 * Feature ID: 1 (Minecraft Eula)
 */
function EulaDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const t = useTranslations();
    const { apiKey, serverId } = useCreds();
    const { sendPowerAction } = useSendCommand();

    // Listen for EULA custom event
    useCustomEvent('EULA', () => {
        setIsOpen(true);
    });

    const handleAcceptEula = async () => {
        console.log('EULA acceptance API call');
        setSubmitting(true);
        try {
            await writeFile(serverId, '/eula.txt', 'eula=true', apiKey);
            await sendPowerAction('kill');
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await sendPowerAction('start');
        } finally {
            setSubmitting(false);
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('gameserver.eula.title')}</DialogTitle>
                    <DialogDescription>
                        {t('gameserver.eula.description')}
                        <Link
                            href="https://www.minecraft.net/de-de/eula"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            {' '}
                            {t('gameserver.eula.eulaLink')}
                        </Link>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        {t('gameserver.eula.cancel')}
                    </Button>
                    <Button onClick={handleAcceptEula}>
                        {submitting && <Spinner className="mr-2" />}
                        {t('gameserver.eula.accept')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default EulaDialog;
