import {
    FabricEggId,
    ForgeEggId,
    NeoForgeEggId,
    PaperEggId,
    VanillaEggId,
} from '@/app/GlobalConstants';

// noch verwendet in changeGameAction.ts
export function buildMC_ENVs_and_startup(id: number, minecraftVersion: string) {
    let startAndVars;

    switch (id) {
        case VanillaEggId:
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar',
                },
                startup: 'java -Xms128M -XX:MaxRAMPercentage=90.0 -jar {{SERVER_JARFILE}}',
            };
            break;
        case ForgeEggId: // Forge
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar',
                    BUILD_TYPE: 'latest',
                },
                startup:
                    'java -Xms128M -XX:MaxRAMPercentage=90.0 -Dterminal.jline=false -Dterminal.ansi=true $( [[  ! -f unix_args.txt ]] && printf %s "-jar {{SERVER_JARFILE}}" || printf %s "@unix_args.txt" )',
            };
            break;
        case PaperEggId: // Paper
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar',
                    BUILD_NUMBER: 'latest',
                },
                startup:
                    'java -Xms128M -XX:MaxRAMPercentage=90.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}',
            };
            break;
        case FabricEggId: // Fabric
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar',
                    FABRIC_VERSION: 'latest',
                    LOADER_VERSION: 'latest',
                },
                startup: 'java -Xms128M -XX:MaxRAMPercentage=90.0 -jar {{SERVER_JARFILE}}',
            };
            break;
        case NeoForgeEggId: // NeiForge
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                },
                startup:
                    'java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true @unix_args.txt',
            };
            break;
    }

    return startAndVars;
}
