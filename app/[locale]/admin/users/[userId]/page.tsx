"use server";

import { auth } from "@/auth";
import NoAdmin from "@/components/admin/NoAdminMessage";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Builder } from "@avionrx/pterodactyl-js";
import { headers } from "next/headers";
import React from 'react'

const formatUtc = (input: Date | string | number) => {
    const d = new Date(input)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const yyyy = d.getUTCFullYear()
    const mm = pad(d.getUTCMonth() + 1)
    const dd = pad(d.getUTCDate())
    const hh = pad(d.getUTCHours())
    const mi = pad(d.getUTCMinutes())
    const ss = pad(d.getUTCSeconds())
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} UTC`
}

async function User({ params }: { params: Promise<{ userId: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session?.user.role !== "admin") {
        return <NoAdmin />;
    }

    
    const userId = (await params).userId;

    const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
    const apiKey = process.env.PTERODACTYL_API_KEY;

    if (!url || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

    try {
        const user = await client.getUser(userId);

        return (
            <>
                <div className="overflow-auto mt-6">
                    <div className="w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>id</TableHead>
                                    <TableHead>externalId</TableHead>
                                    <TableHead>uuid</TableHead>
                                    <TableHead>internalId</TableHead>
                                    <TableHead>username</TableHead>
                                    <TableHead>email</TableHead>
                                    <TableHead>firstName</TableHead>
                                    <TableHead>lastName</TableHead>
                                    <TableHead>fullName</TableHead>
                                    <TableHead>language</TableHead>
                                    <TableHead>rootAdmin</TableHead>
                                    <TableHead>twoFactor</TableHead>
                                    <TableHead>updatedAt</TableHead>
                                    <TableHead>createdAt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.externalId}</TableCell>
                                    <TableCell>{user.uuid}</TableCell>
                                    <TableCell>{user.internalId}</TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.firstName}</TableCell>
                                    <TableCell>{user.lastName}</TableCell>
                                    <TableCell>{user.fullName}</TableCell>
                                    <TableCell>{user.language}</TableCell>
                                    <TableCell>{user.rootAdmin ? "Yes" : "No"}</TableCell>
                                    <TableCell>{user.twoFactor ? "Yes" : "No"}</TableCell>
                                    <TableCell>{formatUtc(user.updatedAt)}</TableCell>
                                    <TableCell>{formatUtc(user.createdAt)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </>
        )
    } catch (e) {
        return (
            <div>{JSON.stringify(e)}</div>
        )
    }
}

export default User



