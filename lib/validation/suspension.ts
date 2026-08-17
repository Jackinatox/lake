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
