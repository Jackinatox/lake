"use client"

import { Button, ButtonGroup, useTheme } from '@mui/joy'
import { useMediaQuery } from '@mui/material';
import { CircleStop, Play, Power as Stop, RotateCcw } from 'lucide-react';
import React from 'react'

export function PowerBtns() {

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <>
            <ButtonGroup  variant='soft' spacing={{ xs: 0, sm: 0.4}} sx={{ display: "flex", justifyContent: isSmallScreen ? 'center' : 'flex-end' }}>
                <Button sx={{ width: 110 }} size="sm" color="success" disabled={false} loading={false}> <Play size={16} /> &nbsp; Start </Button>
                <Button sx={{ width: 110 }} size="sm" color="warning" disabled={false} loading={false}> <RotateCcw size={16} /> &nbsp; Restart </Button>
                <Button sx={{ width: 110 }} size="sm" color="danger" disabled={false} loading={false}> <Stop size={16} /> &nbsp; Stop </Button>
                <Button sx={{ width: 110 }} size="sm" color="danger" disabled={false} loading={false}> <CircleStop size={16} /> &nbsp; Kill </Button>
            </ButtonGroup >
        </>
    )
}
