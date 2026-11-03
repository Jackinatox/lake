'use client';

import { propertiesFormat } from '@/lib/gameConfig/formats/properties';
import { SlidersHorizontal } from 'lucide-react';
import ConfigFileEditor from '../ConfigFileEditor';
import type { GameConfigPanelProps } from '../types';
import { SERVER_PROPERTIES_PATH } from './constants';
import {
    MINECRAFT_PROPERTY_CATEGORIES,
    MINECRAFT_PROPERTY_EXCLUDED_KEYS,
    MINECRAFT_PROPERTY_FIELDS,
} from './propertiesSchema';

export default function PropertiesPanel({ server, apiKey }: GameConfigPanelProps) {
    return (
        <ConfigFileEditor
            serverId={server.identifier}
            apiKey={apiKey}
            filePath={SERVER_PROPERTIES_PATH}
            format={propertiesFormat}
            fields={MINECRAFT_PROPERTY_FIELDS}
            categories={MINECRAFT_PROPERTY_CATEGORIES}
            excludeKeys={MINECRAFT_PROPERTY_EXCLUDED_KEYS}
            namespace="gameserver.config.minecraft.properties"
            icon={SlidersHorizontal}
        />
    );
}
