import { SuspensionType } from '@/app/client/generated/enums';
import { nonEmptyIdSchema, optionalStringSchema, requiredStringSchema, z } from './common';

export const SUSPENSION_REASON_MIN_LENGTH = 10;
export const SUSPENSION_REASON_MAX_LENGTH = 2_000;

/** The reason is emailed to the user verbatim, so a one-word "abuse" is not good enough. */
const suspensionReasonSchema = requiredStringSchema('Reason', SUSPENSION_REASON_MAX_LENGTH).min(
    SUSPENSION_REASON_MIN_LENGTH,
    `Reason must be at least ${SUSPENSION_REASON_MIN_LENGTH} characters — it is sent to the user`,
);

const futureDateSchema = z.coerce
    .date({ error: 'A valid date is required' })
    .refine((date) => date.getTime() > Date.now(), 'The date must be in the future');

/**
 * A server that is deleted when its suspension ends stays suspended at least this long, counted
 * from the start of the suspension. Required for free servers by their terms of use (§ 6: 14 days
 * of data retention, handover on request); paid servers use the same rule to keep it simple.
 */
export const DELETING_SUSPENSION_MIN_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Earliest allowed end date, or null for a suspension that releases the server instead. */
export function minSuspensionEnd({
    deleteAfterExpiry,
    startedAt,
}: {
    deleteAfterExpiry: boolean;
    startedAt: Date;
}): Date | null {
    if (!deleteAfterExpiry) return null;
    return new Date(startedAt.getTime() + DELETING_SUSPENSION_MIN_DAYS * DAY_MS);
}

export const SUSPENSION_TOO_SHORT_MESSAGE = `A server that is deleted afterwards must stay suspended for at least ${DELETING_SUSPENSION_MIN_DAYS} days`;

export const suspendGameServerSchema = z.object({
    gameServerId: nonEmptyIdSchema,
    type: z.nativeEnum(SuspensionType).default(SuspensionType.QUARANTINE),
    reason: suspensionReasonSchema,
    expiresAt: futureDateSchema,
    deleteAfterExpiry: z.boolean(),
});

export const extendSuspensionSchema = z.object({
    suspensionId: nonEmptyIdSchema,
    expiresAt: futureDateSchema,
    note: optionalStringSchema(500),
});

export const liftSuspensionSchema = z.object({
    suspensionId: nonEmptyIdSchema,
});

export type SuspendGameServerInput = z.input<typeof suspendGameServerSchema>;
export type ExtendSuspensionInput = z.input<typeof extendSuspensionSchema>;
