import { minecraftConfig } from './minecraft';
import type { GameConfigModule } from './types';

/**
 * GAME_CONFIG_REGISTRY - Maps a game slug to the panels of its "Config" dashboard tab.
 * Games without an entry don't get the tab at all.
 *
 * When adding a game:
 * 1. Create `components/gameserver/gameConfig/<game>/index.ts` exporting a `GameConfigModule`
 *    (see `minecraft/index.ts`).
 * 2. For a form-based file editor, describe the fields with `ConfigField`s and render
 *    `ConfigFileEditor` with a `ConfigFormat` (`lib/gameConfig/formats/*`; add one if the
 *    file format is new).
 * 3. Add the mapping here and the messages under `gameserver.config.<game>` (en + de).
 *
 * See docs/game-config-editors.md.
 */
export const GAME_CONFIG_REGISTRY: Record<string, GameConfigModule> = {
    minecraft: minecraftConfig,
};

export function getGameConfig(gameSlug: string): GameConfigModule | undefined {
    return GAME_CONFIG_REGISTRY[gameSlug];
}
