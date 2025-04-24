"use client"

import React, { useState } from 'react'
import ServerConfigurator from './serverConfigurator/ServerConfigurator';
import MinecraftConfig from './games/minecraft';

interface stepMProps {
    game: string;
}

function StepManager({game}: stepMProps) {

    const [step, setStep] = useState(0);
    const [config, setConfig] = useState('');

    return (
        <>

            <div>{game}</div>
            { step === 0 && <ServerConfigurator game={game} setStep={setStep} setConfig={setConfig} />}
            {(step === 1 && game === 'minecraft') && <MinecraftConfig config={config}/>}

        </>
    )
}

export default StepManager