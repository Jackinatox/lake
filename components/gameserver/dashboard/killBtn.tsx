"use client";

import { Button, ButtonGroup, DialogContent, DialogTitle, Modal, ModalDialog } from '@mui/joy';
import React, { useEffect, useState } from 'react';

interface PowerBtnsProps {
    loading: boolean;
    onStop: () => void;
    onKill: () => void;
    state: string;
}

export default function KillBtn({ loading, onStop, onKill, state }: PowerBtnsProps) {

    const [buttonText, setButtonText] = useState('Stop');
    const [isModalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (state === 'offline') {
            setButtonText('Stop');
        }
    }, [state]);

    const handleStop = () => {
        if (buttonText === 'Stop') {
            onStop();
            setButtonText('Kill');
        } else if (buttonText === 'Kill') {
            setModalOpen(true);
        }
    };

    const handleKill = () => {
        onKill();
        setButtonText('Stop');
        setModalOpen(false);
    };

    return (
        <>
            <Button disabled={state === 'offline'} loading={loading} sx={{ width: 90 }} size="sm" color="danger" onClick={handleStop}>
                {buttonText}
            </Button>

            <Modal open={isModalOpen} onClose={() => setModalOpen(false)} aria-labelledby="modal-title" aria-describedby="modal-description">
                <ModalDialog>
                    <DialogTitle>Kill?</DialogTitle>
                    <DialogContent>Sure to force stop the server?</DialogContent>

                    <ButtonGroup variant="solid" spacing={2} sx={{ display: "flex" }}>
                    <Button onClick={() => setModalOpen(false)} color="neutral">Cancel</Button>
                    <Button onClick={handleKill} color="danger">Kill</Button>
                </ButtonGroup>
            </ModalDialog>
        </Modal >
        </>
    );
}
