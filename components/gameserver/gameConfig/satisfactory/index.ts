import { Map as MapIcon } from 'lucide-react';
import type { GameConfigModule } from '../types';
import InteractiveMapPanel from './InteractiveMapPanel';

/** Satisfactory has nothing to configure here, only the interactive map, so the tab is "Map". */
export const satisfactoryConfig: GameConfigModule = {
    panels: [{ id: 'interactive-map', Component: InteractiveMapPanel }],
    tab: { labelKey: 'map', icon: MapIcon },
};
