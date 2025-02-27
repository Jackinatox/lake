"use client"

import { Button, ButtonGroup, useTheme } from '@mui/joy'
import { useMediaQuery } from '@mui/material';
import React from 'react'
import KillBtn from './killBtn';


interface PowerBtnsProps {
    loading: boolean;
    onStart: () => void;
    onRestart: () => void;
    onStop: () => void;
    onKill: () => void;
    state: string;
}

export function PowerBtns({ loading, onStart, onRestart, onStop, onKill, state }: PowerBtnsProps) {

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <>
            <ButtonGroup variant='soft' spacing={{ xs: 0, sm: 0.5 }} sx={{ display: "flex", justifyContent: isSmallScreen ? 'center' : 'flex-end' }}>

                <Button disabled={state !== 'offline'} loading={loading} sx={{ width: 90 }} size="sm" color="success" onClick={onStart}> Start </Button>
                <Button disabled={state === 'offline'} loading={loading} sx={{ width: 90 }} size="sm" color="warning" onClick={onRestart}> Restart </Button>
                <KillBtn loading={loading} onStop={onStop} onKill={onKill} state={state} />

            </ButtonGroup >
        </>
    )
}
