import {
    listDirectory,
    type PteroFileEntry,
} from '@/components/gameserver/FileManager/pteroFileApi';

/**
 * Where the Satisfactory dedicated server writes its world saves (autosaves, manual saves and
 * saves uploaded through the in-game server manager), relative to the Pterodactyl container
 * root. The parent `SaveGames/` folder also holds `ServerSettings.<port>.sav`, which is server
 * config and not a world, so only this folder counts. See docs/satisfactory-interactive-map.md.
 */
export const SATISFACTORY_SAVE_DIR = '/.config/Epic/FactoryGame/Saved/SaveGames/server';

/**
 * A plain file name of a save in `SATISFACTORY_SAVE_DIR`: ends in `.sav`, no path parts.
 * Names are otherwise free text (the game even writes "ö" as U+FFC3 U+FFB6).
 */
export function isSaveFileName(name: string): boolean {
    return (
        name.length > 4 &&
        name.length <= 255 &&
        name.toLowerCase().endsWith('.sav') &&
        !/[/\\\0]/.test(name) &&
        name !== '..'
    );
}

/**
 * The name to show for a save file. The game writes non-ASCII names with each UTF-8 byte
 * sign-extended into U+FF80–U+FFFF ("ö" = C3 B6 becomes U+FFC3 U+FFB6), so such runs are
 * decoded back. A run is only replaced when it is valid UTF-8, which leaves real half-width
 * characters alone. Also drops the `.sav` extension.
 */
export function displaySaveName(fileName: string): string {
    const name = fileName.replace(/\.sav$/i, '');
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return name.replace(/[\uFF80-\uFFFF]+/g, (run) => {
        try {
            return decoder.decode(Uint8Array.from(run, (char) => char.charCodeAt(0) & 0xff));
        } catch {
            return run;
        }
    });
}

/** The `.sav` files of a listing, newest first (autosave or manual save, whichever is newer). */
export function sortSaves(entries: PteroFileEntry[]): PteroFileEntry[] {
    return entries
        .filter(
            (entry) =>
                entry.isFile &&
                isSaveFileName(entry.name) &&
                !Number.isNaN(Date.parse(entry.modifiedAt)),
        )
        .sort((a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt));
}

/**
 * Lists the world saves of a Satisfactory server, newest first. Empty when there are none yet.
 *
 * The save folder only exists once the server has started a session. Pterodactyl answers a
 * missing folder with a 500 (`DaemonConnectionException`), not a 404, so a failed listing is
 * double-checked against the container root: if the root lists fine, the folder is just missing.
 * If the root fails too, the panel or node is unreachable and the original error is rethrown.
 */
export async function listSaves(serverId: string, apiKey: string): Promise<PteroFileEntry[]> {
    try {
        const listing = await listDirectory(serverId, SATISFACTORY_SAVE_DIR, apiKey);
        return sortSaves(listing.data);
    } catch (error) {
        try {
            await listDirectory(serverId, '/', apiKey);
        } catch {
            throw error;
        }
        return [];
    }
}
