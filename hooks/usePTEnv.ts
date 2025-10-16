import { useEffect, useState } from "react";
import { env } from 'next-runtime-env';

type EnvStore = {
    vars: Record<string, string> | null;
    loading: boolean;
    error: Error | null;
    subscribers: Set<() => void>;
};

const stores: Record<string, EnvStore> = {};

function getStore(server: string): EnvStore {
    if (!stores[server]) {
        stores[server] = {
            vars: null,
            loading: false,
            error: null,
            subscribers: new Set(),
        };
    }
    return stores[server];
}

const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');

async function fetchEnvVars(server: string, apiKey: string) {
    const store = getStore(server);
    
    // Validation
    if (!server) {
        const error = new Error("Server ID is required");
        store.error = error;
        notify(server);
        return;
    }
    
    if (!apiKey) {
        const error = new Error("API key is required");
        store.error = error;
        notify(server);
        return;
    }
    
    if (!ptUrl) {
        const error = new Error("NEXT_PUBLIC_PT_URL environment variable is not set");
        store.error = error;
        notify(server);
        return;
    }
    
    store.loading = true;
    store.error = null;
    notify(server);
    
    try {
        const url = `${ptUrl}/api/client/servers/${server}/startup`;
        
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to fetch env vars: ${res.status} ${res.statusText} - ${errorText}`);
        }
        
        const data = await res.json();
        
        if (data && Array.isArray(data.data)) {
            const envVars = data.data.filter((v: any) => v.object === "egg_variable");
            
            store.vars = Object.fromEntries(
                envVars.map((v: any) => [v.attributes.env_variable, v.attributes.server_value])
            );
        } else {
            store.vars = {};
        }
        
        store.error = null;
        
    } catch (err) {
        const error = err as Error;
        store.error = error;
    } finally {
        store.loading = false;
        notify(server);
    }
}

function notify(server: string) {
    const store = getStore(server);
    store.subscribers.forEach(cb => cb());
}

export function usePTEnv(key: string, server: string, apiKey: string) {
    const store = getStore(server);
    const [, setTick] = useState(0);

    useEffect(() => {
        const cb = () => {
            setTick(t => t + 1);
        };
        
        store.subscribers.add(cb);
        
        if (store.vars === null && !store.loading) {
            void fetchEnvVars(server, apiKey);
        }
        
        return () => {
            store.subscribers.delete(cb);
        };
    }, [server, apiKey, key]);

    const setValue = async (value: string) => {
        if (!ptUrl) {
            throw new Error("NEXT_PUBLIC_PT_URL environment variable is not set");
        }
        
        if (!server || !apiKey) {
            throw new Error("Server ID and API key are required for setValue");
        }
        
        try {
            const url = `${ptUrl}/api/client/servers/${server}/startup/variable`;
            
            const res = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ key, value }),
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Update failed: ${res.status} ${res.statusText} - ${errorText}`);
            }
            
            // Update local store
            store.vars = { ...(store.vars ?? {}), [key]: value };
            notify(server);
            
        } catch (error) {
            throw error;
        }
    };

    const currentValue = store.vars?.[key] ?? null;

    return {
        value: currentValue,
        loading: store.loading,
        error: store.error,
        setValue,
    };
}
