import { useEffect, useState } from "react";

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

const ptUrl = process.env.NEXT_PUBLIC_PT_URL;

async function fetchEnvVars(server: string, apiKey: string) {
    const store = getStore(server);
    store.loading = true;
    notify(server);
    try {
        const res = await fetch(`${ptUrl}/api/client/servers/${server}/startup`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
        });
        if (!res.ok) throw new Error("Failed to fetch env vars");
        const data = await res.json();
        if (Array.isArray(data.data)) {
            store.vars = Object.fromEntries(
                data.data
                    .filter((v: any) => v.object === "egg_variable")
                    .map((v: any) => [v.attributes.env_variable, v.attributes.server_value])
            );
        } else {
            store.vars = {};
        }
        store.error = null;
    } catch (err) {
        store.error = err as Error;
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
        const cb = () => setTick(t => t + 1);
        store.subscribers.add(cb);
        if (store.vars === null && !store.loading) {
            void fetchEnvVars(server, apiKey);
        }
        return () => {
            store.subscribers.delete(cb);
        };
    }, [server, apiKey]);

    const setValue = async (value: string) => {
        const res = await fetch(`${ptUrl}/api/client/servers/${server}/startup/variable`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ key, value }),
        });
        if (!res.ok) throw new Error("Update failed");
        store.vars = { ...(store.vars ?? {}), [key]: value };
        notify(server);
    };

    return {
        value: store.vars?.[key] ?? null,
        loading: store.loading,
        error: store.error,
        setValue,
    };
}
