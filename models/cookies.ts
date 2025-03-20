export type PerformanceGroup = 'good' | 'better' | 'best';

export type ServerConf = {
    pGroup? : PerformanceGroup;
    CPU? : number;
    RAM? : number;
    Disk? : number;
    Backups? : number;    
}

export const ServerConfCookiesName = 'serverSettings';
