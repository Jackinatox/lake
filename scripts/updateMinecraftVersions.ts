import prisma from '@/lib/prisma';

try {
    const newMinecraftVersions = await fetch(
        'https://tea.scyed.de/Scyed/GameDataJsons/releases/download/latest/MinecraftVersions.json',
        {
            headers: {
                Authorization: `token ${process.env.GITTEA_MINECRAFT_JSONTOKEN}`,
            },
        },
    );
    if (!newMinecraftVersions.ok) {
        throw new Error(
            `Failed to fetch Minecraft versions: ${newMinecraftVersions.status} ${newMinecraftVersions.statusText}`,
        );
    }

    console.log('fetched latest minecraft json');

    const json = await newMinecraftVersions.json();

    await prisma.gameData.update({
        where: {
            slug: 'minecraft',
        },
        data: {
            data: json,
        },
    });

    console.log('updated minecraft json in db');
} catch (error) {
    console.error('Error updating Minecraft versions:', error);
}

export {};
