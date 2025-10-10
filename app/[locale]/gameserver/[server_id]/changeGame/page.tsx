"use server"

import { auth } from '@/auth'
import NotLoggedIn from '@/components/auth/NoAuthMessage'
import NotAllowedMessage from '@/components/auth/NotAllowedMessage'
import { headers } from 'next/headers'
import React from 'react'
import { prisma } from '@/prisma'
import ChangeGameSelect from './ChangeGameSelect'

async function page({ params }: { params: Promise<{ server_id: string }> }) {
    const serverId = (await params).server_id;

    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return <NotLoggedIn />;
    }

    const gameserver = await prisma.gameServer.findFirst({
        where: {
            ptServerId: serverId,
            userId: session.user.id,
            status: {
                notIn: ['CREATION_FAILED', 'DELETED']
            }
        }
    });

    if (!gameserver) {
        return <NotAllowedMessage />
    }


    return (
        <ChangeGameSelect serverId={serverId} />
    )
}

export default page