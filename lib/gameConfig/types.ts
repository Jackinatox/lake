/**
 * Game-agnostic description of a config file the dashboard can edit with a form.
 * The UI (`components/gameserver/gameConfig/ConfigFileEditor.tsx`) only talks to these types,
 * so a new file format only needs a new `ConfigFormat` implementation.
 */

/**
 * Parses and serializes one file format. Values are always handled as strings; the
 * field schema decides how they are rendered (switch, number input, select …).
 *
 * `set` must return a new document and must leave untouched parts of the file
 * (comments, ordering, formatting) exactly as they were.
 */
export interface ConfigFormat<Doc = unknown> {
    parse(text: string): Doc;
    keys(doc: Doc): string[];
    get(doc: Doc, key: string): string | undefined;
    set(doc: Doc, key: string, value: string): Doc;
    serialize(doc: Doc): string;
}

export type ConfigFieldType = 'boolean' | 'number' | 'enum' | 'string';

export interface ConfigFieldOption {
    value: string;
    /** i18n id under `<namespace>.options.<fieldId>.<optionId>` */
    id: string;
}

export interface ConfigField {
    /** Key as it appears in the file, e.g. `max-players` or `query.port`. */
    key: string;
    /**
     * camelCase i18n id. next-intl splits keys on `.`, so file keys like `query.port`
     * cannot be used as message keys directly. Labels live under
     * `<namespace>.fields.<id>.label` / `.description`.
     */
    id: string;
    type: ConfigFieldType;
    category: string;
    min?: number;
    max?: number;
    options?: ConfigFieldOption[];
    /** Managed by the hosting panel (ports, IPs): shown read-only. */
    locked?: boolean;
    /** Show `<namespace>.fields.<id>.warning` next to the field. */
    warning?: boolean;
}

export interface ConfigCategory {
    /** i18n id under `<namespace>.categories.<id>` */
    id: string;
}

/**
 * Pseudo-category for keys present in the file but not described by any field. It has no tab;
 * these keys show up in search results.
 */
export const OTHER_CATEGORY_ID = 'other';
