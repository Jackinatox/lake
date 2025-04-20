import { Message } from '@/components/form-message';
import ServerConfigurator from '@/components/order/serverConfigurator/ServerConfigurator';
import React from 'react'

async function page({ params, searchParams }: { params: Promise<{ game: string }>, searchParams: Promise<Message> }) {
    const game = (await params).game;
    const message = await searchParams;

    return (
        <>
            <div>{game}</div>
            <ServerConfigurator game={game} message={message} />
        </>
    )
}

export default page