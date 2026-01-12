import { SatisfactoryConfig } from '@/models/gameSpecificConfig/SatisfactoryConfig';

export default function createSatisStartup(gameConfig: SatisfactoryConfig) {
    const startAndVars = {
        environment: {
            SRCDS_BETAID: gameConfig.version === 'experimental' ? 'experimental' : 'public',
            MAX_PLAYERS: gameConfig.max_players.toString(),
            NUM_AUTOSAVES: gameConfig.num_autosaves.toString(),
            UPLOAD_CRASH_REPORT: gameConfig.upload_crash_report.toString(),
            AUTOSAVE_INTERVAL: gameConfig.autosave_interval.toString(),
            // HardCoded:
            RELIABLE_PORT: '8888', // Will be replaced by correctPortsForGame
            SRCDS_APPID: '1690800',
        },
        startup:
            './Engine/Binaries/Linux/*-Linux-Shipping FactoryGame ?listen -Port={{SERVER_PORT}} -ReliablePort={{RELIABLE_PORT}}',
    };

    return startAndVars;
}
