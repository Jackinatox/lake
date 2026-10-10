import 'server-only';

import { readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * Small per-game icons live at `public/images/{light,dark}/games/icons/<slug>.webp` — the
 * layout `ThemeImage` expects, so a caller passes the theme-less path
 * `games/icons/<slug>.webp` and the component picks the light or dark file. See
 * `docs/game-images.md`.
 *
 * This module answers one question for the server: does a given slug actually have an icon?
 * Rendering `<Image>` for a missing file would leave a broken image in the UI, and a game can
 * be added to `GameData` before anyone draws its icon.
 */

const ICON_DIR = path.join(process.cwd(), 'public', 'images', 'light', 'games', 'icons');

let cached: Set<string> | null = null;

/** Slugs that have an icon. Read once per process in production, every call in dev. */
export function gameIconSlugs(): Set<string> {
    if (cached && process.env.NODE_ENV === 'production') return cached;

    try {
        cached = new Set(
            readdirSync(ICON_DIR)
                .filter((file) => file.endsWith('.webp'))
                .map((file) => file.replace(/\.webp$/, '')),
        );
    } catch {
        // No icon directory (or no filesystem access) — callers simply render no icons.
        cached = new Set();
    }

    return cached;
}

export function hasGameIcon(slug: string): boolean {
    return gameIconSlugs().has(slug);
}
