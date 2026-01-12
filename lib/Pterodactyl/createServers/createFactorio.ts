import { FactorioConfig } from '@/models/gameSpecificConfig/FactorioConfig';

export function createFactorioEnvVars(gameConfig: FactorioConfig) {
    const startAndVars = {
        environment: {
            FACTORIO_VERSION: gameConfig.version,
        },
        startup:
            './Engine/Binaries/Linux/*-Linux-Shipping FactoryGame ?listen -Port={{SERVER_PORT}} -ReliablePort={{RELIABLE_PORT}}',
    };
}
