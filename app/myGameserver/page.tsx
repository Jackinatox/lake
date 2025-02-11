import React from 'react'
import { Grid } from '@mui/joy'
import { Info, Power } from './dashboard/components'

function Dashboard() {
    return (
        <>
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                
                <Grid>
                    <Power />
                </Grid>

                <Grid xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Info />
                </Grid>

            </Grid >
        </>
    )
}

export default Dashboard