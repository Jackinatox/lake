import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
    FileNotFoundError,
    readFile,
    writeFile,
} from '@/components/gameserver/FileManager/pteroFileApi';

type FileState = {
    content: string | null;
    loading: boolean;
    error: Error | null;
    notFound: boolean;
    /** True once the first fetch finished (successfully or not). */
    loaded: boolean;
};

type FileEntry = {
    state: FileState;
    inflight: Promise<void> | null;
    subscribers: Set<() => void>;
};

const INITIAL_STATE: FileState = {
    content: null,
    loading: false,
    error: null,
    notFound: false,
    loaded: false,
};

// Module-level cache so several components (e.g. the tab attention dot and the panel
// inside the tab) share one fetch and see each other's saves.
const entries: Record<string, FileEntry> = {};

function keyOf(serverId: string, path: string) {
    return `${serverId}:${path}`;
}

function getEntry(key: string): FileEntry {
    if (!entries[key]) {
        entries[key] = { state: INITIAL_STATE, inflight: null, subscribers: new Set() };
    }
    return entries[key];
}

function setState(key: string, patch: Partial<FileState>) {
    const entry = getEntry(key);
    entry.state = { ...entry.state, ...patch };
    entry.subscribers.forEach((cb) => cb());
}

function fetchFile(serverId: string, path: string, apiKey: string): Promise<void> {
    const key = keyOf(serverId, path);
    const entry = getEntry(key);
    if (entry.inflight) return entry.inflight;

    setState(key, { loading: true, error: null });

    entry.inflight = readFile(serverId, path, apiKey)
        .then((content) => {
            setState(key, { content, notFound: false, error: null });
        })
        .catch((err: unknown) => {
            if (err instanceof FileNotFoundError) {
                setState(key, { content: null, notFound: true, error: null });
            } else {
                setState(key, { error: err instanceof Error ? err : new Error(String(err)) });
            }
        })
        .finally(() => {
            entry.inflight = null;
            setState(key, { loading: false, loaded: true });
        });

    return entry.inflight;
}

/**
 * Reads a server file through the Pterodactyl client API and caches it per server + path.
 *
 * Every component using the same `serverId` + `path` shares one cached copy: a `save` from
 * one of them shows up in all of them right away.
 *
 * `revalidateOnMount` re-reads an already cached file when the component mounts (the cached
 * copy is shown meanwhile), so edits made from the console or file manager show up.
 */
export function useServerFile(
    serverId: string,
    path: string,
    apiKey: string,
    { revalidateOnMount = false }: { revalidateOnMount?: boolean } = {},
) {
    const key = keyOf(serverId, path);

    const subscribe = useCallback(
        (cb: () => void) => {
            const entry = getEntry(key);
            entry.subscribers.add(cb);
            return () => {
                entry.subscribers.delete(cb);
            };
        },
        [key],
    );
    const getSnapshot = useCallback(() => getEntry(key).state, [key]);
    const state = useSyncExternalStore(subscribe, getSnapshot, () => INITIAL_STATE);

    useEffect(() => {
        const entry = getEntry(key);
        if ((!entry.state.loaded || revalidateOnMount) && serverId && apiKey) {
            void fetchFile(serverId, path, apiKey);
        }
    }, [key, serverId, path, apiKey, revalidateOnMount]);

    const reload = useCallback(() => fetchFile(serverId, path, apiKey), [serverId, path, apiKey]);

    const save = useCallback(
        async (content: string) => {
            await writeFile(serverId, path, content, apiKey);
            setState(key, { content, notFound: false, error: null, loaded: true });
        },
        [key, serverId, path, apiKey],
    );

    /**
     * Read-modify-write against the *current* file on the server rather than the cached
     * copy, so changes the game server made in the meantime (e.g. via console commands)
     * are not overwritten. `transform` receives `null` when the file does not exist.
     */
    const update = useCallback(
        async (transform: (current: string | null) => string) => {
            let current: string | null;
            try {
                current = await readFile(serverId, path, apiKey);
            } catch (err) {
                if (!(err instanceof FileNotFoundError)) throw err;
                current = null;
            }
            await save(transform(current));
        },
        [serverId, path, apiKey, save],
    );

    return { ...state, reload, save, update };
}
