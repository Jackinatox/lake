"use server"

import { Button, Table } from '@mui/joy';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClientServer } from 'pterodactyl.js';
import React from 'react'

interface serverProps {
    servers: ClientServer[]
}


function ServersTable({servers}: serverProps) {
    return (
        <>
            {JSON.stringify(servers[0])}
            <Table aria-label="user table" borderAxis="both" variant="outlined" sx={{ tableLayout: "auto" }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>CPU</th>
                        <th>Memory (MB)</th>
                        <th>Disk (MB)</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {servers.map((server) => (
                        <tr key={server.identifier}>
                            <td>{server.identifier}</td>
                            <td>{server.name}</td>
                            <td>{server.limits.cpu}</td>
                            <td>{server.limits.memory}</td>
                            <td>{server.limits.disk}</td>
                            <td>{<Button><Link href={`/dashboard/gameServer/${server.identifier}`}> Connect </Link></Button>}</td>
                        </tr>
                    ))}
                </tbody>
            </Table >
        </>
    )
}

export default ServersTable