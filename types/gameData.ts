export interface GameVersion {
    version: string;
    docker_image: string;
}

export interface GameFlavor {
    id: number;
    name: string;
    egg_id: number;
    versions: GameVersion[];
}

export interface GameData {
    flavors: GameFlavor[];
}
