"use client"

import { GameServerSettings } from "@/models/settings";
import { Card } from "@mui/joy";

interface InfoProps { settings: GameServerSettings }

export function Info({ settings }: InfoProps) {

    return (
        <>
            <Card size="sm">
                {settings.egg} {settings.flavour} {settings.ver}
            </Card>
        </>
    )
}
