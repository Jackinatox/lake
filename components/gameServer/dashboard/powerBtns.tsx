import { Grid, Button } from '@mui/joy'
import { CircleStop, Play, Power as Stop, RotateCcw } from 'lucide-react';
import React from 'react'

export function PowerBtns() {

    return (
        <>
            <Grid sx={{ display: 'inline-flex' }}>
                <Grid xs={3} sm={3} md={3} lg={3} xl={3}>
                    <Button sx={{ width: 110 }} size="sm" color="success" disabled={false} loading={false}> <Play size={18} /> &nbsp; Start </Button>
                </Grid>
                <Grid xs={3} sm={3} md={3} lg={3} xl={3}>
                    <Button sx={{ width: 110 }} size="sm" color="warning" disabled={false} loading={false}> <RotateCcw size={18} /> &nbsp; Restart </Button>
                </Grid>
                <Grid xs={3} sm={3} md={3} lg={3} xl={3}>
                    <Button sx={{ width: 110 }} size="sm" color="danger" disabled={false} loading={false}> <Stop size={18} /> &nbsp; Stop </Button>
                </Grid>
                <Grid xs={3} sm={3} md={3} lg={3} xl={3}>
                    <Button sx={{ width: 110 }} size="sm" color="danger" disabled={false} loading={false}> <CircleStop size={18} /> &nbsp; Kill </Button>
                </Grid>
            </Grid>
        </>
    )
}
