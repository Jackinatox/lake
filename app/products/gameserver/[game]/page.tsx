// Component so that the user can select Locations (PGroups)

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationSettings } from '@/models/dbTypes';
import { createClient } from '@/utils/supabase/client';
import React from 'react'

async function Game() {

    let locations: LocationSettings[] = [];

    const currentTime = new Date().getTime();
    const supabase = createClient();
    const { data, error } = await supabase
        .from('Locations')
        .select('id, Name, CPUPrice, RAMPrice, DiskPrice, PortsLimit, BackupsLimit')
        .eq('Enabled', true)
    //.gt('AvailableFrom', currentTime)
    //.lt('AvailableTill', currentTime);

    console.log("data: ", data, "error_: ", error);

    if (!error) {
        locations = data.map(location => ({
            id: location.id,
            Name: location.Name, // Name of "PGroups"
            CPUPrice: location.CPUPrice, // 0.8...2
            RAMPrice: location.RAMPrice, // 0.8...2
            DiskPrice: location.DiskPrice,
            PortsLimit: location.PortsLimit, // 1...5
            BackupsLimit: location.BackupsLimit
        }));
    }

    try {



        return (
            <>
                {locations.map((location) => (
                    <div key={location.id}>
                        {location.Name}
                        {location.CPUPrice}
                        {location.RAMPrice}
                        {location.DiskPrice}
                        {location.PortsLimit}
                        {location.BackupsLimit}

                        <Card className="w-full max-w-md dark:">
                            <CardHeader>
                                <CardTitle>{location.Name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">CPU Preis:</div>
                                    <div className="font-medium">{location.CPUPrice}</div>

                                    <div className="text-muted-foreground">RAM Preis:</div>
                                    <div className="font-medium">{location.RAMPrice}</div>

                                    <div className="text-muted-foreground">Disk Preis:</div>
                                    <div className="font-medium">{location.DiskPrice}</div>

                                    <div className="text-muted-foreground">Ports Limit:</div>
                                    <div className="font-medium">{location.PortsLimit}</div>

                                    <div className="text-muted-foreground">Backups Limit:</div>
                                    <div className="font-medium">{location.BackupsLimit}</div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t pt-4 mt-4">
                                <div className="flex justify-between w-full">
                                    <span className="font-semibold">Gesamtpreis:</span>
                                    <span className="font-bold">{"Auf Anfrage"}</span>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                ))}
            </>
        )



    } catch (e) {
        return (
            <div>{JSON.stringify(e)}</div>
        )
    }
}

export default Game
