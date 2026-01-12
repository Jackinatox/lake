import { GameServerType } from '@/app/client/generated/enums';
import { GameConfig } from './config';

export type GameServer = {
    server_owner: boolean;
    identifier: string;
    internal_id: string;
    uuid: string;
    name: string;
    node: string;
    egg_id: number;
    type: GameServerType;
    is_node_under_maintenance: boolean;
    sftp_details: {
        ip: string;
        port: number;
    };
    description: string;
    limits: {
        memory: number;
        swap: number;
        disk: number;
        io: number;
        cpu: number;
        threads: number | null;
        oom_disabled: boolean;
    };
    invocation: string;
    docker_image: string;
    egg_features: string[];
    feature_limits: {
        databases: number;
        allocations: number;
        backups: number;
    };
    status: string | null;
    is_suspended: boolean;
    is_installing: boolean;
    is_transferring: boolean;
    gameDataId: number;
    gameData: GameConfig; // To access current game specific conf
    relationships: {
        allocations: {
            object: string;
            data: Array<{
                object: string;
                attributes: {
                    id: number;
                    ip: string;
                    ip_alias: string | null;
                    port: number;
                    notes: string | null;
                    is_default: boolean;
                };
            }>;
        };
        variables: {
            object: string;
            data: Array<{
                object: string;
                attributes: {
                    name: string;
                    description: string;
                    env_variable: string;
                    default_value: string;
                    server_value: string;
                    is_editable: boolean;
                    rules: string;
                };
            }>;
        };
    };
};
