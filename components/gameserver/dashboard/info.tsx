"use client"

import { Card } from "@/components/ui/card";
import { GameServerSettings } from "@/models/settings";


interface InfoProps { settings: GameServerSettings }

export function Info({ settings }: InfoProps) {

    return (
        <>
            <Card className="p-2">
                {settings.egg} {settings.flavour} {settings.ver}
            </Card>
        </>
    )
}
