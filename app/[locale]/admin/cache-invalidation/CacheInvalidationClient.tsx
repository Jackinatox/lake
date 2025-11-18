'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { CACHE_GROUPS } from './cache-groups';
import { invalidateCacheAction } from './cache-invalidation-action';
import { useToast } from '@/hooks/use-toast';

export default function CacheInvalidationClient() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleInvalidateAll = async () => {
        setIsLoading(true);
        try {
            const allKeys = Object.values(CACHE_GROUPS).flatMap((g) => [...g.keys]);
            await invalidateCacheAction(allKeys);
            toast({
                title: 'Success',
                description: `Invalidated ${allKeys.length} cache keys`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to invalidate cache',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvalidateGroup = async (groupKey: keyof typeof CACHE_GROUPS) => {
        setIsLoading(true);
        try {
            const keys = CACHE_GROUPS[groupKey].keys;
            await invalidateCacheAction([...keys]);
            toast({
                title: 'Success',
                description: `Invalidated group: ${CACHE_GROUPS[groupKey].name}`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to invalidate cache group',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvalidateKey = async (key: string) => {
        setIsLoading(true);
        try {
            await invalidateCacheAction([key]);
            toast({
                title: 'Success',
                description: `Invalidated key: ${key}`,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to invalidate cache key',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Global Invalidation */}
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                <CardHeader>
                    <CardTitle className="text-lg">Invalidate All Cache</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Clears all cache keys across all groups.
                    </p>
                    <Button
                        onClick={handleInvalidateAll}
                        disabled={isLoading}
                        variant="destructive"
                        className="w-full sm:w-auto"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {isLoading ? 'Invalidating...' : 'Invalidate All'}
                    </Button>
                </CardContent>
            </Card>

            {/* Cache Groups */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Cache Groups</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Object.entries(CACHE_GROUPS).map(([groupKey, group]) => (
                            <div
                                key={groupKey}
                                className="flex items-center justify-between gap-3 p-2 rounded border border-border hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{group.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {group.keys.join(', ')}
                                    </p>
                                </div>
                                <Button
                                    onClick={() =>
                                        handleInvalidateGroup(groupKey as keyof typeof CACHE_GROUPS)
                                    }
                                    disabled={isLoading}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Individual Keys */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Individual Keys</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(CACHE_GROUPS)
                            .flatMap((g) => g.keys)
                            .map((key) => (
                                <Badge
                                    key={key}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-secondary/80 transition-colors px-3 py-1.5"
                                    onClick={() => handleInvalidateKey(key)}
                                    title={`Click to invalidate: ${key}`}
                                >
                                    {key}
                                </Badge>
                            ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
