import prisma from '@/lib/prisma';
import {
    LEGAL_IMPRESSUM_DE,
    LEGAL_IMPRESSUM_EN,
    LEGAL_AGB_DE,
    LEGAL_AGB_EN,
    LEGAL_DATENSCHUTZ_DE,
    LEGAL_DATENSCHUTZ_EN,
    FREE_TIER_CPU_PERCENT,
    FREE_TIER_RAM_MB,
    FREE_TIER_STORAGE_MB,
    FREE_TIER_DURATION_DAYS,
    FREE_SERVERS_LOCATION_ID,
    FREE_TIER_MAX_SERVERS,
    EGG_FEATURE_MINECRAFT_EULA,
    EGG_FEATURE_JAVA_VERSION,
    EGG_FEATURE_HYTALE_OAUTH,
    FREE_TIER_BACKUP_COUNT,
    FREE_TIER_ALLOCATIONS,
    LEGAL_PAYMENTS_DE,
    LEGAL_PAYMENTS_EN,
    LEGAL_RETURNS_DE,
    LEGAL_RETURNS_EN,
    CONFIG_KEY_DELETE_GAMESERVER_AFTER_DAYS,
} from '../app/GlobalConstants';

async function main() {
    await prisma.gameData.create({
        data: {
            data: JSON.parse(
                '{"flavors": [{"id": 3, "name": "Vanilla", "egg_id": 2, "versions": [{"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.16.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.6.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.3.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.3.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.0", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}]}, {"id": 2, "name": "Fabric", "egg_id": 16, "versions": [{"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.16.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}]}, {"id": 1, "name": "Paper", "egg_id": 1, "versions": [{"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.16.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}]}, {"id": 0, "name": "Forge", "egg_id": 3, "versions": [{"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.16.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.6.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.0", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}]}, {"id": 5, "name": "Neoforge", "egg_id": 20, "versions": [{"version": "1.21.11", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.0", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}]}]}',
            ),
            name: 'Minecraft',
            slug: 'minecraft',
        },
    });

    await prisma.gameData.create({
        data: {
            data: {
                docker_image: 'ghcr.io/parkervcp/games:source',
                experimental: true,
            },
            name: 'Satisfactory',
            slug: 'satisfactory',
        },
    });

    await prisma.gameData.create({
        data: {
            name: 'Factorio',
            slug: 'factorio',
            data: JSON.parse(
                '{"eggId": 22, "versions": [{"branch": "experimental", "version": "2.0.71"}, {"branch": "experimental", "version": "2.0.70"}, {"branch": "stable", "version": "2.0.69"}, {"branch": "experimental", "version": "2.0.68"}, {"branch": "experimental", "version": "2.0.67"}, {"branch": "stable", "version": "2.0.66"}, {"branch": "experimental", "version": "2.0.65"}, {"branch": "experimental", "version": "2.0.64"}, {"branch": "experimental", "version": "2.0.63"}, {"branch": "experimental", "version": "2.0.62"}, {"branch": "experimental", "version": "2.0.61"}, {"branch": "stable", "version": "2.0.60"}, {"branch": "experimental", "version": "2.0.59"}, {"branch": "experimental", "version": "2.0.58"}, {"branch": "experimental", "version": "2.0.57"}, {"branch": "experimental", "version": "2.0.56"}, {"branch": "stable", "version": "2.0.55"}, {"branch": "experimental", "version": "2.0.54"}, {"branch": "experimental", "version": "2.0.53"}, {"branch": "experimental", "version": "2.0.52"}, {"branch": "experimental", "version": "2.0.51"}, {"branch": "experimental", "version": "2.0.50"}, {"branch": "experimental", "version": "2.0.49"}, {"branch": "experimental", "version": "2.0.48"}, {"branch": "stable", "version": "2.0.47"}, {"branch": "experimental", "version": "2.0.46"}, {"branch": "experimental", "version": "2.0.45"}, {"branch": "experimental", "version": "2.0.44"}, {"branch": "stable", "version": "2.0.43"}, {"branch": "stable", "version": "2.0.42"}, {"branch": "stable", "version": "2.0.41"}, {"branch": "experimental", "version": "2.0.40"}, {"branch": "stable", "version": "2.0.39"}, {"branch": "experimental", "version": "2.0.38"}, {"branch": "experimental", "version": "2.0.37"}, {"branch": "experimental", "version": "2.0.36"}, {"branch": "experimental", "version": "2.0.35"}, {"branch": "experimental", "version": "2.0.34"}, {"branch": "experimental", "version": "2.0.33"}, {"branch": "stable", "version": "2.0.32"}, {"branch": "experimental", "version": "2.0.31"}, {"branch": "stable", "version": "2.0.30"}, {"branch": "experimental", "version": "2.0.29"}, {"branch": "stable", "version": "2.0.28"}, {"branch": "experimental", "version": "2.0.27"}, {"branch": "experimental", "version": "2.0.26"}, {"branch": "experimental", "version": "2.0.25"}, {"branch": "experimental", "version": "2.0.24"}, {"branch": "stable", "version": "2.0.23"}, {"branch": "experimental", "version": "2.0.22"}, {"branch": "stable", "version": "2.0.21"}, {"branch": "stable", "version": "2.0.20"}, {"branch": "experimental", "version": "2.0.19"}, {"branch": "experimental", "version": "2.0.18"}, {"branch": "experimental", "version": "2.0.17"}, {"branch": "experimental", "version": "2.0.16"}, {"branch": "stable", "version": "2.0.15"}, {"branch": "stable", "version": "2.0.14"}, {"branch": "stable", "version": "2.0.13"}, {"branch": "stable", "version": "2.0.12"}, {"branch": "stable", "version": "2.0.11"}, {"branch": "stable", "version": "2.0.10"}, {"branch": "stable", "version": "2.0.9"}, {"branch": "stable", "version": "2.0.8"}, {"branch": "stable", "version": "2.0.7"}, {"branch": "stable", "version": "1.1.110"}, {"branch": "stable", "version": "1.1.109"}, {"branch": "experimental", "version": "1.1.108"}, {"branch": "stable", "version": "1.1.107"}, {"branch": "experimental", "version": "1.1.106"}, {"branch": "experimental", "version": "1.1.105"}, {"branch": "stable", "version": "1.1.104"}, {"branch": "experimental", "version": "1.1.103"}, {"branch": "experimental", "version": "1.1.102"}, {"branch": "stable", "version": "1.1.101"}, {"branch": "stable", "version": "1.1.100"}, {"branch": "experimental", "version": "1.1.99"}, {"branch": "experimental", "version": "1.1.98"}, {"branch": "experimental", "version": "1.1.97"}, {"branch": "experimental", "version": "1.1.96"}, {"branch": "experimental", "version": "1.1.95"}, {"branch": "stable", "version": "1.1.94"}, {"branch": "experimental", "version": "1.1.93"}, {"branch": "experimental", "version": "1.1.92"}, {"branch": "stable", "version": "1.1.91"}, {"branch": "experimental", "version": "1.1.90"}, {"branch": "experimental", "version": "1.1.89"}, {"branch": "experimental", "version": "1.1.88"}, {"branch": "stable", "version": "1.1.87"}, {"branch": "experimental", "version": "1.1.86"}, {"branch": "stable", "version": "1.1.69"}, {"branch": "stable", "version": "1.1.60"}, {"branch": "stable", "version": "1.1.59"}, {"branch": "stable", "version": "1.1.58"}, {"branch": "stable", "version": "1.1.57"}, {"branch": "stable", "version": "1.0.0"}, {"branch": "stable", "version": "0.17.79"}, {"branch": "stable", "version": "0.16.51"}, {"branch": "stable", "version": "0.15.40"}, {"branch": "stable", "version": "0.15.36"}, {"branch": "stable", "version": "0.14.23"}, {"branch": "stable", "version": "0.13.20"}, {"branch": "stable", "version": "0.12.35"}, {"branch": "stable", "version": "0.11.22"}, {"branch": "stable", "version": "0.10.12"}, {"branch": "stable", "version": "0.9.8"}, {"branch": "stable", "version": "0.8.8"}, {"branch": "stable", "version": "0.7.5"}, {"branch": "stable", "version": "0.6.4"}], "dockerImage": "ghcr.io/ptero-eggs/yolks:debian"}',
            ),
            enabled: false,
        },
    });

    await prisma.gameData.create({
        data: {
            data: {
                docker_image: 'ghcr.io/pterodactyl/games:hytale',
                eggId: 23,
            },
            name: 'Hytale',
            slug: 'hytale',
            enabled: false,
        },
    });

    const cpu1 = await prisma.cPU.create({
        data: {
            name: 'R9-5900X',
            cores: 12,
            threads: 24,
            singleScore: 100,
            multiScore: 1000,
            maxThreads: 16,
            minThreads: 1,
            pricePerCore: 75,
        },
    });

    const cpu2 = await prisma.cPU.create({
        data: {
            name: 'R5-7600',
            cores: 6,
            threads: 12,
            singleScore: 100,
            multiScore: 1000,
            maxThreads: 10,
            minThreads: 1,
            pricePerCore: 85,
        },
    });

    const cpu3 = await prisma.cPU.create({
        data: {
            name: 'Proliant',
            cores: 6,
            threads: 12,
            singleScore: 100,
            multiScore: 1000,
            maxThreads: 10,
            minThreads: 1,
            pricePerCore: 85,
        },
    });

    const ram1 = await prisma.rAM.create({
        data: {
            name: 'DDR4',
            speed: 3200,
            pricePerGb: 75,
            minGb: 1,
            maxGb: 24,
        },
    });

    const ram2 = await prisma.rAM.create({
        data: {
            name: 'DDR4',
            speed: 3600,
            pricePerGb: 75,
            minGb: 1,
            maxGb: 24,
        },
    });

    await prisma.location.create({
        data: {
            name: 'Gut - Ryzen 9 5900X',
            diskPrice: 0.5,
            portsLimit: 3,
            backupsLimit: 16,
            enabled: true,
            ptLocationId: 1,
            cpu: { connect: { id: cpu1.id } },
            ram: { connect: { id: ram1.id } },
        },
    });

    await prisma.location.create({
        data: {
            name: 'Besser - Ryzen 5 7600',
            diskPrice: 0.5,
            portsLimit: 3,
            backupsLimit: 16,
            enabled: true,
            ptLocationId: 1,
            cpu: { connect: { id: cpu2.id } },
            ram: { connect: { id: ram2.id } },
        },
    });

    await prisma.location.create({
        data: {
            name: 'Free - Proliant',
            diskPrice: 0.5,
            portsLimit: 3,
            backupsLimit: 16,
            enabled: true,
            ptLocationId: 1,
            freeServer: true,
            cpu: { connect: { id: cpu3.id } },
            ram: { connect: { id: ram2.id } },
        },
    });

    // Legal Content Keys
    await prisma.keyValue.createMany({
        data: [
            {
                key: LEGAL_IMPRESSUM_DE,
                type: 'TEXT',
                string: '# Impressum\n\nBitte fügen Sie hier Ihre Impressum-Informationen ein.',
                note: 'German Impressum (legal imprint) content',
            },
            {
                key: LEGAL_IMPRESSUM_EN,
                type: 'TEXT',
                string: '# Imprint\n\nPlease add your imprint information here.',
                note: 'English Imprint (legal imprint) content',
            },
            {
                key: LEGAL_AGB_DE,
                type: 'TEXT',
                string: '# Allgemeine Geschäftsbedingungen\n\nBitte fügen Sie hier Ihre AGB ein.',
                note: 'German Terms and Conditions (AGB) content',
            },
            {
                key: LEGAL_AGB_EN,
                type: 'TEXT',
                string: '# Terms and Conditions\n\nPlease add your terms and conditions here.',
                note: 'English Terms and Conditions content',
            },
            {
                key: LEGAL_DATENSCHUTZ_DE,
                type: 'TEXT',
                string: '# Datenschutzerklärung\n\nBitte fügen Sie hier Ihre Datenschutzerklärung ein.',
                note: 'German Privacy Policy (Datenschutz) content',
            },
            {
                key: LEGAL_DATENSCHUTZ_EN,
                type: 'TEXT',
                string: '# Privacy Policy\n\nPlease add your privacy policy here.',
                note: 'English Privacy Policy content',
            },
            {
                key: LEGAL_RETURNS_DE,
                type: 'TEXT',
                string: '# Widerrufsbelehrung\n\nBitte fügen Sie hier Ihre Widerrufsbelehrung ein.',
            },
            {
                key: LEGAL_RETURNS_EN,
                type: 'TEXT',
                string: '# Returns\n\nPlease add your returns information here.',
            },
            {
                key: LEGAL_PAYMENTS_DE,
                type: 'TEXT',
                string: '# Zahlungsmethoden\n\nBitte fügen Sie hier Ihre Zahlungsmethoden ein.',
                note: 'German Payments content',
            },
            {
                key: LEGAL_PAYMENTS_EN,
                type: 'TEXT',
                string: '# Payment Methods\n\nPlease add your payment methods here.',
                note: 'English Payments content',
            },
            {
                key: FREE_TIER_CPU_PERCENT,
                type: 'NUMBER',
                number: 200,
                note: 'CPU allocation for free tier servers',
            },
            {
                key: FREE_TIER_RAM_MB,
                type: 'NUMBER',
                number: 2048,
                note: 'RAM allocation for free tier servers',
            },
            {
                key: FREE_TIER_STORAGE_MB,
                type: 'NUMBER',
                number: 10240,
                note: 'Storage allocation for free tier servers',
            },
            {
                key: FREE_TIER_DURATION_DAYS,
                type: 'NUMBER',
                number: 7,
                note: 'Duration for free tier servers',
            },
            {
                key: FREE_SERVERS_LOCATION_ID,
                type: 'NUMBER',
                number: 3,
                note: 'Location ID for free tier servers in this Database, not Pterodactyl -  maybe this is useless',
            },
            {
                key: FREE_TIER_MAX_SERVERS,
                type: 'NUMBER',
                number: 10,
                note: 'Maximum number of free tier servers',
            },
            {
                key: FREE_TIER_BACKUP_COUNT,
                type: 'NUMBER',
                number: 3,
                note: 'Number of backups allowed for free tier servers',
            },
            {
                key: FREE_TIER_ALLOCATIONS,
                type: 'NUMBER',
                number: 2,
                note: 'Number of allocations allowed for free tier servers',
            },
            {
                key: CONFIG_KEY_DELETE_GAMESERVER_AFTER_DAYS,
                type: 'NUMBER',
                number: 90,
                note: 'Number of days after which suspended tier servers will be deleted',
            }
        ],
        skipDuplicates: true,
    });

    await prisma.eggFeature.createMany({
        data: [
            { name: EGG_FEATURE_MINECRAFT_EULA },
            { name: EGG_FEATURE_JAVA_VERSION },
            { name: EGG_FEATURE_HYTALE_OAUTH },
        ],
    });

    await prisma.gameDataFeature.createMany({
        data: [
            {
                featureId: 1,
                gameDataId: 1,
            },
        ],
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
