export function createServer(server: NewServerOptions){
    // TODO: Implement the createServer function
    
}

export interface NewServerOptions {
    externalId?: string;
    name: string;
    user: number;
    description?: string;
    egg: number;
    pack?: number;
    image?: string;
    startup: string;
    limits: ServerLimits;
    featureLimits: ServerFeatureLimits;
    environment: {
        [key: string]: any;
    };
    allocation?: {
        default?: number;
        additional: number[];
    };
    deploy?: {
        locations?: number[];
        dedicatedIp: boolean;
        portRange: any[];
    };
    startWhenInstalled?: boolean;
    skipScripts?: boolean;
    outOfMemoryKiller?: boolean;
}

interface ServerLimits {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
}

interface ServerFeatureLimits {
    databases: number;
    allocations: number;
    backups: number;
    split_limit: number;
}