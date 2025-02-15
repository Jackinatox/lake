"use client"

import { Button, ButtonGroup, useTheme } from '@mui/joy'
import { useMediaQuery } from '@mui/material';
import { CircleStop, Play, Power as Stop, RotateCcw } from 'lucide-react';
import React from 'react'

interface PowerBtnsProps {
    loading: boolean;
    onStop: () => void;
    onStart: () => void;

}

export function PowerBtns({loading, onStop, onStart}: PowerBtnsProps) {

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <>
            <ButtonGroup  variant='soft' spacing={{ xs: 0, sm: 0.4}} sx={{ display: "flex", justifyContent: isSmallScreen ? 'center' : 'flex-end' }}>
                <Button onClick={onStart} sx={{ width: 110 }} size="sm" color="success" disabled={false} loading={loading}> <Play size={16} /> &nbsp; Start </Button>
                <Button sx={{ width: 110 }} size="sm" color="warning" disabled={false} loading={loading}> <RotateCcw size={16} /> &nbsp; Restart </Button>
                <Button onClick={onStop} sx={{ width: 110 }} size="sm" color="danger" disabled={false} loading={loading}> <Stop size={16} /> &nbsp; Stop </Button>
                <Button sx={{ width: 110 }} size="sm" color="danger" disabled={false} loading={loading}> <CircleStop size={16} /> &nbsp; Kill </Button>
            </ButtonGroup >
        </>
    )
}
