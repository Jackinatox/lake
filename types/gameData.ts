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


export enum GameServerStatus {
  PROVISIONING, // Server created in pt
  ACTIVE,  // Server is installed
  
  PAYMENT_PROCESSING,
  // Errors:
  DOES_NOT_EXIST,
  PAYMENT_FAILED,
  CREATION_FAILED, // Only when pt.createServer fails, not the actual installation
  EXPIRED,
  DELETED
}