import { GameServer } from "@prisma/client";

type State = 'idle' | 'running' | 'completed' | 'error';

export type WorkerState = {
    expiredServers: Status;
}

export type Status = {
    state: State;
    total: number;
    processed: number;
}


export const workerState: WorkerState = {
    expiredServers: { state: 'idle', total: 0, processed: 0 }
}

