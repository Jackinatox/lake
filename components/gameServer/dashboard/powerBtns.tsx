import { Grid, Button, Box } from '@mui/joy'
import { CircleStop, Play, Power as Stop, RotateCcw } from 'lucide-react';
import React from 'react'

export function PowerBtns() {

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button sx={{ width: 110 }} size="sm" color="success" disabled={false} loading={false}> <Play size={18} /> &nbsp; Start </Button>
                <Button sx={{ width: 110 }} size="sm" color="warning" disabled={false} loading={false}> <RotateCcw size={18} /> &nbsp; Restart </Button>
                <Button sx={{ width: 110 }} size="sm" color="danger" disabled={false} loading={false}> <Stop size={18} /> &nbsp; Stop </Button>
                <Button sx={{ width: 110 }} size="sm" color="danger" disabled={false} loading={false}> <CircleStop size={18} /> &nbsp; Kill </Button>
            </Box >
        </>
    )
}
