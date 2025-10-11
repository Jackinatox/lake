export function buildMC_ENVs_and_startup(id: number, minecraftVersion: string) {

    let startAndVars;

    switch (id) {
        case 2: // Vanilla
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar'
                },
                startup: 'java -Xms128M -XX:MaxRAMPercentage=90.0 -jar {{SERVER_JARFILE}}',
            };
            break;
        case 3: // Forge
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar',
                    BUILD_TYPE: 'recommended'
                },
                startup: 'java -Xms128M -XX:MaxRAMPercentage=90.0 -Dterminal.jline=false -Dterminal.ansi=true $( [[  ! -f unix_args.txt ]] && printf %s "-jar {{SERVER_JARFILE}}" || printf %s "@unix_args.txt" )'

            };
            break;
        case 1: // Paper
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar',
                    BUILD_NUMBER: 'latest'
                },
                startup: 'java -Xms128M -XX:MaxRAMPercentage=90.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JARFILE}}'
            };
            break;
        case 16: // Fabric
            startAndVars = {
                environment: {
                    MINECRAFT_VERSION: minecraftVersion,
                    SERVER_JARFILE: 'server.jar',
                    FABRIC_VERSION: 'latest',
                    LOADER_VERSION: 'latest'
                },
                startup: 'java -Xms128M -XX:MaxRAMPercentage=90.0 -jar {{SERVER_JARFILE}}'
            };
            break;
    }

    return startAndVars;
}