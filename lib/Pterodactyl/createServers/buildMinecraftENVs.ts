/**
 * Build Minecraft environment variables and startup command based on flavor name.
 * Flavor names come from GameData.data.flavors[].name (e.g. 'Vanilla', 'Paper', 'Forge', 'Fabric', 'Neoforge').
 *
 * @param flavorName - The flavor name string (case-insensitive)
 * @param minecraftVersion - The Minecraft version string
 * @deprecated for new games, store startup/env templates in GameData.data directly
 */
export function buildMC_ENVs_and_startup(flavorName: string, minecraftVersion: string) {
    let startAndVars;

    switch (flavorName.toLowerCase()) {
        case 'vanilla':
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar',
                },
                startup: 'java -Xms128M -XX:MaxRAMPercentage=90.0 -jar {{SERVER_JARFILE}}',
            };
            break;
        case 'forge':
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
        case 'paper':
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
        case 'fabric':
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
        case 'neoforge':
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
