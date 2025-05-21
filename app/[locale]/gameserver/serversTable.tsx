"use server"

import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Gamepad2Icon } from 'lucide-react'
import Link from 'next/link'
import { ClientServer } from 'pterodactyl.js'
import React from 'react'

interface serverProps {
    servers: ClientServer[]
}

function ServersTable({ servers }: serverProps) {
    return (
        <>
            <Breadcrumb>
                <BreadcrumbItem>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                        <Gamepad2Icon /> &nbsp; Gameservers
                    </span>
                </BreadcrumbItem>
            </Breadcrumb>

            {/* {JSON.stringify(servers[0])} */}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>CPU</TableHead>
                        <TableHead>Memory (MB)</TableHead>
                        <TableHead>Disk (MB)</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {servers.map((server) => (
                        <TableRow key={server.identifier}>
                            <TableCell>{server.identifier}</TableCell>
                            <TableCell>{server.name}</TableCell>
                            <TableCell>{server.limits.cpu}</TableCell>
                            <TableCell>{server.limits.memory}</TableCell>
                            <TableCell>{server.limits.disk}</TableCell>
                            <TableCell>
                                <Button asChild>
                                    <Link href={`/gameserver/${server.identifier}`}>Connect</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}

export default ServersTable