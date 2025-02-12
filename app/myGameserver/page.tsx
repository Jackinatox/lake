import React from 'react'
import { Grid } from '@mui/joy'
import { Info, Power } from './dashboard/components'
import Console from '@/components/gameServer/Console'

function Dashboard() {
    return (
        <>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                
                <Grid size={12}>
                    <Power />
                </Grid>
                <Grid size={12}>
                    <Console></Console>
                </Grid>           
                <Grid size={12}>
                    <Info />
                </Grid>

            </Grid >
        </>
    )
}

export default Dashboard