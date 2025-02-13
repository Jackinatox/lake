"use server"

import React from 'react'
import { Grid } from '@mui/joy'
import Console from '@/components/gameServer/dashboard/console'
import { GameServerSettings } from '@/models/settings';
import { PowerBtns } from '@/components/gameServer/dashboard/powerBtns';
import { Info } from '@/components/gameServer/dashboard/info';
import CopyAddress from '@/components/gameServer/dashboard/copyAddress';


const settings : GameServerSettings = {
    egg: 'Minecraft',
    ver: '1.17.1',
    flavour: 'Paper',
    node: '01',
    wing: '01',
    cpuModel: 'Ryzen 5 5950X',
    vCores: 4,
    mem: 4096,
    addr: 'w1.scyed.com:2134',
}

function Dashboard() {
    return (
        <>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>

                <Grid xs={6} sm={6} md={6} lg={12} xl={12}>
                    <CopyAddress settings={settings} />
                </Grid>
                <Grid xs={6} sm={6} md={6} lg={12} xl={12}>
                    <PowerBtns />
                </Grid>
                <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
                    {/* <Console></Console> */}
                </Grid>
                <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Info settings={settings} />
                </Grid>

            </Grid >
        </>
    )
}

export default Dashboard