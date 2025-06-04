"use client"

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GameServer } from '@/models/gameServerModel';

export interface SettingsProps {
    server: GameServer;
    gameId: number;
}

const GameSettings: React.FC<{ egg_Id: number }> = ({ egg_Id }) => {
    switch (egg_Id) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            return <div>Minecraft Game Settings</div>;
        case 6:
            return <div>Settings for Game 2</div>;
        default:
            return <div>If you see this, we messed up</div>;
    }
};


function Settings({server, gameId}: SettingsProps) {

    return (
        <>
            <div>
                <GameSettings egg_Id={server.egg_id}></GameSettings>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Setting</TableHead>
                        <TableHead>My Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Server name</TableCell>
                        <TableCell>Client</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Server version (ENV Var)</TableCell>
                        <TableCell>Client</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Game Flavour (egg id, admin only)</TableCell>
                        <TableCell>Admin</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Reinstall</TableCell>
                        <TableCell>Client</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Show StartupCommand</TableCell>
                        <TableCell>Client (should be in /server)</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>DockerImage / Java Version</TableCell>
                        <TableCell>Not sure</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </>
    )
}

export default Settings