"use server"

import { Message } from '@/components/form-message';
import MinecraftConfig from '@/components/order/games/minecraft';
import ServerConfigurator from '@/components/order/serverConfigurator/ServerConfigurator';
import StepManager from '@/components/order/stepManager';
import React, { useState } from 'react'

async function page({ params, searchParams }: { params: Promise<{ game: string }>, searchParams: Promise<Message> }) {
    const game = (await params).game;
    const message = await searchParams;

    return (
        <>
            <StepManager game={game}/>  
        </>
    )
}

export default page