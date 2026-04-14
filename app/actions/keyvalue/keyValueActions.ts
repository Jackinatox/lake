'use server';

import { auth } from '@/auth';
import { keyValueUpsertSchema } from '@/lib/validation/adminContent';
import {
    getValidationMessage,
    positiveIntSchema,
} from '@/lib/validation/common';
import prisma from '@/lib/prisma';
import { Prisma } from '@/app/client/generated/client';
import { type KeyValueType } from '@/app/client/generated/enums';
import { headers } from 'next/headers';

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user.role !== 'admin') throw new Error('Unauthorized');
}

export type KeyValueRow = {
    id: number;
    key: string;
    type: KeyValueType;
    string: string | null;
    json: unknown;
    number: number | null;
    boolean: boolean | null;
    note: string | null;
    category: string | null;
    createdAt: Date;
    updatedAt: Date;
};

export async function getKeyValuesAction(): Promise<KeyValueRow[]> {
    await requireAdmin();
    return prisma.keyValue.findMany({ orderBy: { key: 'asc' } });
}

export type UpsertKeyValueInput = {
    id?: number;
    key: string;
    type: KeyValueType;
    string?: string | null;
    json?: unknown;
    number?: number | null;
    boolean?: boolean | null;
    note?: string | null;
    category?: string | null;
};

export async function upsertKeyValueAction(input: UpsertKeyValueInput): Promise<KeyValueRow> {
    await requireAdmin();
    const parsed = (() => {
        try {
            return keyValueUpsertSchema.parse(input);
        } catch (error) {
            throw new Error(getValidationMessage(error));
        }
    })();

    const data = {
        key: parsed.key,
        type: parsed.type,
        string: parsed.type === 'STRING' || parsed.type === 'TEXT' ? (parsed.string ?? null) : null,
        json:
            parsed.type === 'JSON'
                ? ((parsed.json ?? Prisma.JsonNull) as Prisma.InputJsonValue)
                : Prisma.JsonNull,
        number: parsed.type === 'NUMBER' ? (parsed.number ?? null) : null,
        boolean: parsed.type === 'BOOLEAN' ? (parsed.boolean ?? null) : null,
        note: parsed.note ?? null,
        category: parsed.category ?? null,
    };

    if (parsed.id) {
        return prisma.keyValue.update({ where: { id: parsed.id }, data });
    }

    return prisma.keyValue.create({ data });
}

export async function deleteKeyValueAction(id: number): Promise<void> {
    await requireAdmin();
    await prisma.keyValue.delete({ where: { id: positiveIntSchema.parse(id) } });
}
