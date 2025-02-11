"use client";

import { GameServerSettings } from '@/models/settings';
import { Grid, Button, ButtonGroup, Card } from '@mui/joy'
import { CircleStop, Play, Power as Stop, RotateCcw, Copy } from 'lucide-react';
import React from 'react'

const settings = new GameServerSettings({
    egg: 'Minecraft',
    ver: '1.17.1',
    flavour: 'Paper',
    node: '01',
    wing: '01',
    cpuModel: 'Ryzen 5 5950X',
    vCores: 4,
    mem: 4096,
    addr: 'w1.scyed.com:2134',
});

export function Power() {

    const handleCopy = (event: React.MouseEvent<HTMLButtonElement>) => {
        const textToCopy = (event.currentTarget.previousElementSibling as HTMLButtonElement)?.innerText;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => console.log(`Copied: ${textToCopy}`))
                .catch(err => console.error('Failed to copy: ', err));
        }
    };

    return (
        <>
            <Grid sx={{ display: 'inline-flex' }}>
                <Grid xs={6} sm={6} md={6} lg={6} xl={6}>
                    <ButtonGroup size="sm">
                        <Button color="neutral" variant="outlined"> {settings.addr} </Button>
                        <Button color="neutral" variant="outlined" onClick={handleCopy}> <Copy size={18} /> </Button>
                    </ButtonGroup>
                </Grid>
                
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

export function Info() {

    return (
        <>
            <Card size="sm">
                {settings.egg} {settings.flavour} {settings.ver}
            </Card>
        </>
    )
}
