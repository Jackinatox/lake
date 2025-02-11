export class GameServerSettings {
    egg?: string;
    ver?: string;
    flavour?: string;
    node?: string;
    wing?: string;
    cpuModel?: string;
    vCores?: number;
    mem?: number;
    addr?: string;

    constructor(data: Partial<GameServerSettings>) {
        Object.assign(this, data);
    }

    getFormattedAddress(): string {
        return this.addr ? `http://${this.addr}` : 'Address not set';
    }
}
