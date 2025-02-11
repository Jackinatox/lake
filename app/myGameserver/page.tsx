import React from 'react'
import { Grid } from '@mui/joy'
import { Info, Power } from './dashboard/components'
import Console from '@/components/gameServer/Console'

function Dashboard() {
    return (
        <>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                
                <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Power />
                </Grid>
                <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Console></Console>
                </Grid>           
                <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Info />
                </Grid>

            </Grid >
        </>
    )
}

export default Dashboard