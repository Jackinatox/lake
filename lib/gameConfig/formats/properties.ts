import type { ConfigFormat } from '../types';

/**
 * Java `.properties` support (Minecraft `server.properties`).
 *
 * The file is kept as a list of logical lines. Comments, blank lines, ordering and
 * every unchanged entry are written back byte-for-byte; only entries whose value was
 * changed through `set` are re-serialized (as `key=value`, escaped the way
 * `java.util.Properties#store` does, with non-ASCII as `\uXXXX` so it reads back the
 * same regardless of the file encoding the server assumes).
 */

type PropertiesLine =
    | { kind: 'raw'; raw: string }
    | { kind: 'entry'; key: string; value: string; raw: string | null };

export interface PropertiesDocument {
    lines: PropertiesLine[];
    newline: string;
    trailingNewline: boolean;
}

function isWhitespace(ch: string) {
    return ch === ' ' || ch === '\t' || ch === '\f';
}

/** Number of consecutive backslashes directly before the end of `line`. */
function endsWithContinuation(line: string) {
    let count = 0;
    for (let i = line.length - 1; i >= 0 && line[i] === '\\'; i--) count++;
    return count % 2 === 1;
}

function unescape(text: string): string {
    let out = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch !== '\\') {
            out += ch;
            continue;
        }
        const next = text[++i];
        if (next === undefined) break;
        switch (next) {
            case 't':
                out += '\t';
                break;
            case 'n':
                out += '\n';
                break;
            case 'r':
                out += '\r';
                break;
            case 'f':
                out += '\f';
                break;
            case 'u': {
                const hex = text.slice(i + 1, i + 5);
                if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                    out += String.fromCharCode(parseInt(hex, 16));
                    i += 4;
                } else {
                    out += 'u';
                }
                break;
            }
            default:
                out += next;
        }
    }
    return out;
}

function escape(text: string, isKey: boolean): string {
    let out = '';
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const code = ch.charCodeAt(0);
        switch (ch) {
            case ' ':
                out += isKey || i === 0 ? '\\ ' : ' ';
                break;
            case '\\':
                out += '\\\\';
                break;
            case '\t':
                out += '\\t';
                break;
            case '\n':
                out += '\\n';
                break;
            case '\r':
                out += '\\r';
                break;
            case '\f':
                out += '\\f';
                break;
            case '=':
            case ':':
            case '#':
            case '!':
                out += `\\${ch}`;
                break;
            default:
                if (code < 0x20 || code > 0x7e) {
                    out += `\\u${code.toString(16).toUpperCase().padStart(4, '0')}`;
                } else {
                    out += ch;
                }
        }
    }
    return out;
}

/** Splits a logical line (continuations already joined) into key and raw value. */
function splitEntry(logical: string): { key: string; value: string } {
    let i = 0;
    while (i < logical.length && isWhitespace(logical[i])) i++;

    let keyEnd = i;
    let escaped = false;
    for (; keyEnd < logical.length; keyEnd++) {
        const ch = logical[keyEnd];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (ch === '\\') {
            escaped = true;
            continue;
        }
        if (ch === '=' || ch === ':' || isWhitespace(ch)) break;
    }

    let valueStart = keyEnd;
    while (valueStart < logical.length && isWhitespace(logical[valueStart])) valueStart++;
    if (logical[valueStart] === '=' || logical[valueStart] === ':') valueStart++;
    while (valueStart < logical.length && isWhitespace(logical[valueStart])) valueStart++;

    return {
        key: unescape(logical.slice(i, keyEnd)),
        value: unescape(logical.slice(valueStart)),
    };
}

export function parseProperties(text: string): PropertiesDocument {
    const newline = text.includes('\r\n') ? '\r\n' : '\n';
    const trailingNewline = text.endsWith('\n');
    const physical = text.split(/\r?\n/);
    if (trailingNewline) physical.pop();

    const lines: PropertiesLine[] = [];
    for (let i = 0; i < physical.length; i++) {
        const line = physical[i];
        const trimmed = line.replace(/^[ \t\f]+/, '');

        if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!')) {
            lines.push({ kind: 'raw', raw: line });
            continue;
        }

        // Join continuation lines; keep the original physical lines for verbatim output.
        const rawParts = [line];
        let logical = line;
        while (endsWithContinuation(logical) && i + 1 < physical.length) {
            const next = physical[++i];
            rawParts.push(next);
            logical = logical.slice(0, -1) + next.replace(/^[ \t\f]+/, '');
        }

        const { key, value } = splitEntry(logical);
        lines.push({ kind: 'entry', key, value, raw: rawParts.join(newline) });
    }

    return { lines, newline, trailingNewline };
}

export function serializeProperties(doc: PropertiesDocument): string {
    const body = doc.lines
        .map((line) => {
            if (line.kind === 'raw') return line.raw;
            if (line.raw !== null) return line.raw;
            return `${escape(line.key, true)}=${escape(line.value, false)}`;
        })
        .join(doc.newline);
    return doc.trailingNewline || doc.lines.length === 0 ? body + doc.newline : body;
}

export const propertiesFormat: ConfigFormat<PropertiesDocument> = {
    parse: parseProperties,
    serialize: serializeProperties,

    keys(doc) {
        const seen = new Set<string>();
        for (const line of doc.lines) {
            if (line.kind === 'entry') seen.add(line.key);
        }
        return [...seen];
    },

    get(doc, key) {
        // Java's Properties keeps the last occurrence of a duplicated key.
        for (let i = doc.lines.length - 1; i >= 0; i--) {
            const line = doc.lines[i];
            if (line.kind === 'entry' && line.key === key) return line.value;
        }
        return undefined;
    },

    set(doc, key, value) {
        let found = false;
        const lines = doc.lines.map((line) => {
            if (line.kind !== 'entry' || line.key !== key) return line;
            found = true;
            if (line.value === value) return line;
            return { ...line, value, raw: null };
        });
        if (!found) lines.push({ kind: 'entry', key, value, raw: null });
        return { ...doc, lines, trailingNewline: doc.trailingNewline || !found };
    },
};
