'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface EulaDialogProps {
    isOpen: boolean;
    onAcceptEula: () => void;
    setOpen: (open: boolean) => void;
}

function EulaDialog({ isOpen, onAcceptEula, setOpen }: EulaDialogProps) {
    const t = useTranslations();

    return (
        <Dialog
            open={isOpen}
            onOpenChange={() => {
                setOpen(false);
            }}
        >
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
                    <Button
                        variant="outline"
                        onClick={() => {
                            setOpen(false);
                        }}
                    >
                        {t('gameserver.eula.cancel')}
                    </Button>
                    <Button
                        onClick={() => {
                            onAcceptEula();
                            setOpen(false);
                        }}
                    >
                        {t('gameserver.eula.accept')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default EulaDialog;
