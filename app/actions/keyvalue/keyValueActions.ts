'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/app/client/generated/client';
import { KeyValueType } from '@/app/client/generated/enums';
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
};

export async function upsertKeyValueAction(input: UpsertKeyValueInput): Promise<KeyValueRow> {
    await requireAdmin();

    const data = {
        key: input.key,
        type: input.type,
        string: input.type === 'STRING' || input.type === 'TEXT' ? (input.string ?? null) : null,
        json:
            input.type === 'JSON'
                ? ((input.json ?? Prisma.JsonNull) as Prisma.InputJsonValue)
                : Prisma.JsonNull,
        number: input.type === 'NUMBER' ? (input.number ?? null) : null,
        boolean: input.type === 'BOOLEAN' ? (input.boolean ?? null) : null,
        note: input.note ?? null,
    };

    if (input.id) {
        return prisma.keyValue.update({ where: { id: input.id }, data });
    }

    return prisma.keyValue.create({ data });
}

export async function deleteKeyValueAction(id: number): Promise<void> {
    await requireAdmin();
    await prisma.keyValue.delete({ where: { id } });
}
