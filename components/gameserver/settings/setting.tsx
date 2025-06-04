"use client"

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GameServer } from '@/models/gameServerModel';

interface SettingsProps {
    server: GameServer;
    gameId: number;
}


function Settings({server, gameId}: SettingsProps) {

    return (
        <>
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