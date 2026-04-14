import { ApiKeyPermission, ALL_PERMISSIONS } from '@/lib/apiKeyPermissions';
import { KeyValueType, LogLevel, LogType, TicketStatus, ChangelogEntryType } from '@/app/client/generated/enums';
import {
    dateStringSchema,
    integerRangeSchema,
    nonEmptyIdSchema,
    optionalStringSchema,
    positiveIntSchema,
    requiredStringSchema,
    z,
} from './common';
import { banReasonSchema } from './auth';

const apiKeyPermissionSchema = z.enum(ALL_PERMISSIONS as [ApiKeyPermission, ...ApiKeyPermission[]]);

export const blogSlugSchema = z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(120, 'Slug must be at most 120 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers, and hyphens');

export const blogPostCreateSchema = z.object({
    title: requiredStringSchema('Title', 160),
    slug: blogSlugSchema.optional(),
    content: requiredStringSchema('Content', 100_000),
    category: requiredStringSchema('Category', 60),
    published: z.boolean(),
    listed: z.boolean(),
    publishedAt: dateStringSchema.optional().nullable(),
    changelog: z
        .object({
            text: requiredStringSchema('Changelog text', 10_000),
            type: z.nativeEnum(ChangelogEntryType),
            published: z.boolean(),
            publishedAt: dateStringSchema.optional().nullable(),
        })
        .optional(),
});

export const blogPostUpdateSchema = z
    .object({
        title: requiredStringSchema('Title', 160).optional(),
        slug: blogSlugSchema.optional(),
        content: requiredStringSchema('Content', 100_000).optional(),
        category: requiredStringSchema('Category', 60).optional(),
        published: z.boolean().optional(),
        listed: z.boolean().optional(),
        publishedAt: dateStringSchema.optional().nullable(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');

export const changelogEntryCreateSchema = z.object({
    title: requiredStringSchema('Title', 160),
    text: requiredStringSchema('Text', 10_000),
    type: z.nativeEnum(ChangelogEntryType),
    published: z.boolean(),
    publishedAt: dateStringSchema.optional().nullable(),
    blogPostId: nonEmptyIdSchema.optional().nullable(),
});

export const changelogEntryUpdateSchema = z
    .object({
        title: requiredStringSchema('Title', 160).optional(),
        text: requiredStringSchema('Text', 10_000).optional(),
        type: z.nativeEnum(ChangelogEntryType).optional(),
        published: z.boolean().optional(),
        publishedAt: dateStringSchema.optional().nullable(),
        blogPostId: nonEmptyIdSchema.optional().nullable(),
    })
    .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');

export const keyValueUpsertSchema = z
    .object({
        id: positiveIntSchema.optional(),
        key: z
            .string({ error: 'Key is required' })
            .trim()
            .min(1, 'Key is required')
            .max(120, 'Key must be at most 120 characters')
            .regex(/^[A-Za-z0-9_.:-]+$/, 'Key contains invalid characters'),
        type: z.nativeEnum(KeyValueType),
        string: z.string().max(100_000, 'Text value is too long').optional().nullable(),
        json: z.unknown().optional().nullable(),
        number: z.number().finite('Number must be finite').optional().nullable(),
        boolean: z.boolean().optional().nullable(),
        note: optionalStringSchema(1_000),
        category: optionalStringSchema(30),
    })
    .superRefine((value, ctx) => {
        if ((value.type === 'STRING' || value.type === 'TEXT') && value.string === undefined) {
            ctx.addIssue({
                code: 'custom',
                path: ['string'],
                message: 'String value is required for this type',
            });
        }

        if (value.type === 'NUMBER' && value.number == null) {
            ctx.addIssue({
                code: 'custom',
                path: ['number'],
                message: 'Number value is required for this type',
            });
        }

        if (value.type === 'BOOLEAN' && value.boolean == null) {
            ctx.addIssue({
                code: 'custom',
                path: ['boolean'],
                message: 'Boolean value is required for this type',
            });
        }

        if (value.type === 'JSON' && value.json === undefined) {
            ctx.addIssue({
                code: 'custom',
                path: ['json'],
                message: 'JSON value is required for this type',
            });
        }
    });

export const createApiKeySchema = z.object({
    name: requiredStringSchema('Name', 80),
    permissions: z
        .array(apiKeyPermissionSchema)
        .min(1, 'At least one permission is required')
        .max(ALL_PERMISSIONS.length, 'Too many permissions')
        .transform((permissions) => Array.from(new Set(permissions))),
    rateLimitMax: integerRangeSchema('Rate limit max', 1, 100_000),
    rateLimitTimeWindow: z
        .number()
        .int('Rate limit window must be a whole number')
        .refine(
            (value) =>
                [
                    1_000,
                    2_000,
                    5_000,
                    10_000,
                    30_000,
                    60_000,
                    300_000,
                    900_000,
                    3_600_000,
                    86_400_000,
                ].includes(value),
            'Invalid rate limit window',
        ),
});

export const adminUserSearchSchema = z.object({
    query: z.string().trim().max(200, 'Search query is too long'),
});

export const verifyUserEmailSchema = z.object({
    userId: nonEmptyIdSchema,
});

export const toggleBanUserSchema = z.object({
    userId: nonEmptyIdSchema,
    ban: z.boolean(),
    reason: banReasonSchema,
});

export const pterodactylUserInfoSchema = z.object({
    ptUserId: positiveIntSchema,
});

export const LOG_TIME_RANGES = ['ALL', '1m', '10m', '1h', '1d', '7d', '30d'] as const;

export const logFiltersSchema = z.object({
    search: z.string().trim().max(200, 'Search is too long').optional(),
    level: z.union([z.literal('ALL'), z.nativeEnum(LogLevel)]).optional(),
    type: z.union([z.literal('ALL'), z.nativeEnum(LogType)]).optional(),
    timeRange: z.enum(LOG_TIME_RANGES).optional(),
    page: integerRangeSchema('Page', 1, 10_000).optional(),
    limit: integerRangeSchema('Limit', 1, 100).optional(),
});

export const ticketStatusUpdateSchema = z.object({
    ticketId: positiveIntSchema,
    status: z.nativeEnum(TicketStatus),
});
