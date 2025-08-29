import { createPtClient } from '@/lib/Pterodactyl/ptAdminClient';
import { prisma } from '@/prisma';
import React from 'react'

async function page() {
    const pt = createPtClient();
    const gameServer = await prisma.gameServer.findUnique({ where: { id: "cmesysugj0001bpamwx4r2xv9" }, include: { user: true } });


    const ptServer = await pt.getServer(gameServer.ptAdminId.toString());
    return (
        <div>{JSON.stringify(ptServer)}</div>
    )
}

export default page