import { z } from 'zod';

export { z };

export const LOCALES = ['de', 'en'] as const;
export const localeSchema = z.enum(LOCALES);

export const ORDER_DURATIONS = [7, 30, 90, 180] as const;
export const UPGRADE_DURATIONS = [0, 7, 30, 90] as const;

export function requiredStringSchema(field: string, maxLength: number) {
    return z
        .string({ error: `${field} is required` })
        .trim()
        .min(1, `${field} is required`)
        .max(maxLength, `${field} must be at most ${maxLength} characters`);
}

export function optionalStringSchema(maxLength: number) {
    return z
        .string()
        .trim()
        .max(maxLength, `Must be at most ${maxLength} characters`)
        .optional()
        .nullable()
        .transform((value) => {
            if (value == null) return undefined;
            return value.length > 0 ? value : undefined;
        });
}

export function integerRangeSchema(field: string, min: number, max: number) {
    return z
        .number({ error: `${field} must be a number` })
        .int(`${field} must be a whole number`)
        .min(min, `${field} must be at least ${min}`)
        .max(max, `${field} must be at most ${max}`);
}

export const nonEmptyIdSchema = requiredStringSchema('ID', 191);
export const orderIdSchema = requiredStringSchema('Order ID', 191);
export const userIdSchema = requiredStringSchema('User ID', 191);
export const serverIdentifierSchema = z
    .string({ error: 'Server identifier is required' })
    .trim()
    .min(1, 'Server identifier is required')
    .max(64, 'Server identifier must be at most 64 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Server identifier contains invalid characters');
export const positiveIntSchema = z.number().int().positive('Must be a positive whole number');
export const safeFiniteNumberSchema = z.number().finite('Must be a finite number');
export const dateStringSchema = z
    .string()
    .trim()
    .min(1, 'Date is required')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Invalid date');

export function parseDateInput(value?: string | null): Date | undefined {
    if (!value) return undefined;
    return new Date(dateStringSchema.parse(value));
}

export function formatZodError(error: z.ZodError): string {
    return error.issues
        .map((issue) => {
            const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
            return `${path}${issue.message}`;
        })
        .join('; ');
}

export function getValidationMessage(error: unknown): string {
    if (error instanceof z.ZodError) {
        return formatZodError(error);
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Invalid input';
}
