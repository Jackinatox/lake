'use client';

import { FEATURE_REGISTRY } from './FeatureRegistry';
import type { EggFeature } from '@/app/client/generated/browser';

interface DynamicFeaturesProps {
    features: EggFeature[];
}

/**
 * DynamicFeatures - Renders feature components based on the features array
 * 
 * This component iterates through the features array (loaded from the database)
 * and renders the corresponding feature components from the FEATURE_REGISTRY.
 * 
 * If a feature is in the database but not in the registry, a warning is logged
 * to the console for debugging purposes.
 * 
 * @param features - Array of EggFeature objects
 */
export default function DynamicFeatures({ features }: DynamicFeaturesProps) {
    return (
        <>
            {features.map((feature) => {
                const Component = FEATURE_REGISTRY[feature.name];
                
                if (!Component) {
                    console.warn(
                        `[DynamicFeatures] Feature component not found in registry: "${feature.name}" (ID: ${feature.id})`,
                    );
                    return null;
                }
                
                // Render the feature component with its id as key
                return <Component key={feature.id} />;
            })}
        </>
    );
}
