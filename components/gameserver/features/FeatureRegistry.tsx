import {
    EGG_FEATURE_MINECRAFT_EULA,
    EGG_FEATURE_HYTALE_OAUTH,
} from '@/app/GlobalConstants';
import EulaDialog from './EulaDialog';
import HytaleOauthFeature from './HytaleOauthFeature';

/**
 * FEATURE_REGISTRY - Maps feature names from the database to their React components
 * 
 * When adding a new feature:
 * 1. Create the feature component (see EulaDialog.tsx or HytaleOauthFeature.tsx as examples)
 * 2. Add the feature name constant to GlobalConstants.ts
 * 3. Add the mapping here
 * 4. Add the feature to the database via seed or migration
 * 5. Link the feature to the appropriate game(s) in GameDataFeature table
 * 
 * Feature components should:
 * - Be self-contained with their own state management
 * - Use useCustomEvent hook to listen for WebSocket events
 * - Handle internationalization with useTranslations
 * - Clean up subscriptions automatically (useCustomEvent handles this)
 */
export const FEATURE_REGISTRY: Record<string, React.ComponentType<any>> = {
    [EGG_FEATURE_MINECRAFT_EULA]: EulaDialog,
    [EGG_FEATURE_HYTALE_OAUTH]: HytaleOauthFeature,
};
