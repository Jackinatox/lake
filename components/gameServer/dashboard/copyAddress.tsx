"use client"

import { GameServerSettings } from '@/models/settings';
import { Button, ButtonGroup } from '@mui/joy'
import { Copy } from 'lucide-react';
import React from 'react'

interface InfoProps { settings: GameServerSettings }

function copyAddress({ settings }: InfoProps) {

    const handleCopy = (event: React.MouseEvent<HTMLButtonElement>) => {
        const textToCopy = (event.currentTarget.previousElementSibling as HTMLButtonElement)?.innerText;
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => console.log(`Copied: ${textToCopy}`))
                .catch(err => console.error('Failed to copy: ', err));
        }
    };

    return (
        <ButtonGroup size="sm">
            <Button color="neutral" variant="outlined"> {settings.addr} </Button>
            <Button color="neutral" variant="outlined" onClick={handleCopy}> <Copy size={18} /> </Button>
        </ButtonGroup>
    )
}

export default copyAddress