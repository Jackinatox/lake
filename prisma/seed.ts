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
} from '../app/GlobalConstants';

async function main() {
    await prisma.gameData.create({
        data: {
            data: JSON.parse(
                '{"flavors": [{"id": 3, "name": "Vanilla", "egg_id": 2, "versions": [{"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.16.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.6.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.3.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.3.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.0", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}]}, {"id": 2, "name": "Fabric", "egg_id": 16, "versions": [{"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.16.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}]}, {"id": 1, "name": "Paper", "egg_id": 1, "versions": [{"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.16.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}]}, {"id": 0, "name": "Forge", "egg_id": 3, "versions": [{"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.19", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.18", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.17.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.16.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.16.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.15", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.14.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.13.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.12", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.11", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.7.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_8"}, {"version": "1.6.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.6.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.4.0", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.2.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}, {"version": "1.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_7"}]}, {"id": 5, "name": "Neoforge", "egg_id": 20, "versions": [{"version": "1.21.11", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.10", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.9", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.8", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.7", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.1", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.21.0", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.6", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.5", "docker_image": "ghcr.io/pterodactyl/yolks:java_21"}, {"version": "1.20.4", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.3", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}, {"version": "1.20.2", "docker_image": "ghcr.io/pterodactyl/yolks:java_17"}]}]}'
            ),
            name: 'Minecraft',
        },
    });

    await prisma.gameData.create({
        data: {
            data: {
                id: 0,
                docker_image: 'ghcr.io/parkervcp/games:source',
                experimental: true,
            },
            name: 'Satisfactory',
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

    // Legal Content Keys
    await prisma.keyValue.create({
        data: {
            key: LEGAL_IMPRESSUM_DE,
            string: '# Impressum\n\nBitte fügen Sie hier Ihre Impressum-Informationen ein.',
            note: 'German Impressum (legal imprint) content',
        },
    });

    await prisma.keyValue.create({
        data: {
            key: LEGAL_IMPRESSUM_EN,
            string: '# Imprint\n\nPlease add your imprint information here.',
            note: 'English Imprint (legal imprint) content',
        },
    });

    await prisma.keyValue.create({
        data: {
            key: LEGAL_AGB_DE,
            string: '# Allgemeine Geschäftsbedingungen\n\nBitte fügen Sie hier Ihre AGB ein.',
            note: 'German Terms and Conditions (AGB) content',
        },
    });

    await prisma.keyValue.create({
        data: {
            key: LEGAL_AGB_EN,
            string: '# Terms and Conditions\n\nPlease add your terms and conditions here.',
            note: 'English Terms and Conditions content',
        },
    });

    await prisma.keyValue.create({
        data: {
            key: LEGAL_DATENSCHUTZ_DE,
            string: '# Datenschutzerklärung\n\nBitte fügen Sie hier Ihre Datenschutzerklärung ein.',
            note: 'German Privacy Policy (Datenschutz) content',
        },
    });

    await prisma.keyValue.create({
        data: {
            key: LEGAL_DATENSCHUTZ_EN,
            string: '# Privacy Policy\n\nPlease add your privacy policy here.',
            note: 'English Privacy Policy content',
        },
    });

    // Free Tier Configuration
    await prisma.keyValue.create({
        data: {
            key: FREE_TIER_CPU_PERCENT,
            number: 200,
            note: 'CPU allocation for free tier servers',
        },
    });

    await prisma.keyValue.create({
        data: {
            key: FREE_TIER_RAM_MB,
            number: 2048,
            note: 'RAM allocation for free tier servers',
        },
    });

    await prisma.keyValue.create({
        data: {
            key: FREE_TIER_STORAGE_MB,
            number: 10240,
            note: 'Storage allocation for free tier servers',
        },
    });

    await prisma.keyValue.create({
        data: {
            key: FREE_TIER_DURATION_DAYS,
            number: 7,
            note: 'Duration for free tier servers',
        },
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
