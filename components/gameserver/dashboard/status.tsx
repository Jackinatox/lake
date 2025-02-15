"use client"

import { GameServerSettings } from "@/models/settings";
import { Box, Button, Textarea, useTheme } from "@mui/joy";
import { useMediaQuery } from "@mui/material";

interface InfoProps { settings: GameServerSettings }



export function Status({ settings }: InfoProps) {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));



    const getColor = (status: string | undefined) => {

        switch (status) {
            case 'running': return 'success';
            case 'restarting': return 'warning';
            case 'stopped': return 'danger';
            default: return 'neutral';
        }
    };

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: isSmallScreen ? 'flex-end' : 'center' }}>
                <Button variant='outlined' color={getColor(settings.status)} size="sm" sx={{ pointerEvents: 'none', width: '12ch' }}>
                    {settings.status}
                </Button>
            </Box>
        </>
    )
}
