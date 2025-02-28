"use client"

import { Box, Button, useTheme } from "@mui/joy";
import { useMediaQuery } from "@mui/material";

interface InfoProps { state: string }



export function Status({ state }: InfoProps) {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));



    const getColor = (status: string | undefined) => {

        switch (status) {
            case 'starting': return 'warning'; //verified
            case 'running': return 'success'; //verified
            case 'stopping': return 'warning'; //verified
            case 'offline': return 'danger'; //verified
            default: return 'neutral';
        }
    };

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: isSmallScreen ? 'flex-end' : 'center' }}>
                <Button variant='outlined' color={getColor(state)} size="sm" sx={{ pointerEvents: 'none', width: 90 }}> {state} </Button>
            </Box>
        </>
    )
}
