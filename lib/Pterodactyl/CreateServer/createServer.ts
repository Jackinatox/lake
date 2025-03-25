import { PTServerConf } from "@/models/Pterodactyl/ServerModel";

interface createServerProps{
    PtUserId: number,
    server: PTServerConf,
}

async function createServer(params: createServerProps) {
    
}