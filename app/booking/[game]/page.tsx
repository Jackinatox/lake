import ServerConfigurator from '@/components/order/serverConfigurator/ServerConfigurator';
import React from 'react'

async function page({ params }: { params: Promise<{ game: string }> }) {
    const game = (await params).game;


    return (
        <>
            <div>{game}</div>
            <ServerConfigurator game={game} />
        </>
    )
}

export default page