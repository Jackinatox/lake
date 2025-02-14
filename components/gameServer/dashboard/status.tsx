"use client"

import { GameServerSettings } from "@/models/settings";
import { Box, useTheme } from "@mui/joy";
import { useMediaQuery } from "@mui/material";

interface InfoProps { settings: GameServerSettings }

export function Status({ settings }: InfoProps) {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: isSmallScreen ? 'flex-end' : 'center' }}>
                {settings.status}
            </Box>
        </>
    )
}
