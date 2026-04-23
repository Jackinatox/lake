import { RefundServerAction, RefundType, TicketCategory } from '@/app/client/generated/enums';
import { FTP_PASSWORD_MAX_LENGTH, FTP_PASSWORD_MIN_LENGTH } from '@/app/GlobalConstants';
import type { GameConfig } from '@/models/config';
import {
    ORDER_DURATIONS,
    UPGRADE_DURATIONS,
    integerRangeSchema,
    localeSchema,
    optionalStringSchema,
    orderIdSchema,
    requiredStringSchema,
    serverIdentifierSchema,
    z,
} from './common';

const configuredDurationSchema = z.union(
    ORDER_DURATIONS.map((v) => z.literal(v)) as [
        z.ZodLiteral<(typeof ORDER_DURATIONS)[number]>,
        ...z.ZodLiteral<(typeof ORDER_DURATIONS)[number]>[],
    ],
);
const upgradeDurationSchema = z.union(
    UPGRADE_DURATIONS.map((v) => z.literal(v)) as [
        z.ZodLiteral<(typeof UPGRADE_DURATIONS)[number]>,
        ...z.ZodLiteral<(typeof UPGRADE_DURATIONS)[number]>[],
    ],
);

const baseHardwareConfigSchema = z.object({
    pfGroupId: integerRangeSchema('Performance group', 1, 10_000),
    cpuPercent: integerRangeSchema('CPU', 100, 3_200),
    ramMb: integerRangeSchema('RAM', 512, 262_144),
    diskMb: integerRangeSchema('Disk', 1_024, 2_097_152),
    backupCount: integerRangeSchema('Backups', 0, 50),
    allocations: integerRangeSchema('Allocations', 0, 50),
});

export const configuredHardwareConfigSchema = baseHardwareConfigSchema.extend({
    durationsDays: configuredDurationSchema,
});

export const upgradeHardwareConfigSchema = baseHardwareConfigSchema.extend({
    durationsDays: upgradeDurationSchema,
});

export const minecraftGameSpecificSchema = z.object({
    serverName: requiredStringSchema('Server name', 100),
    maxPlayers: integerRangeSchema('Max players', 1, 200),
    viewDistance: integerRangeSchema('View distance', 2, 32),
    difficulty: z.enum(['peaceful', 'easy', 'normal', 'hard']),
    enablePvp: z.boolean(),
    enableNether: z.boolean(),
    enableCommandBlocks: z.boolean(),
    spawnProtection: integerRangeSchema('Spawn protection', 0, 128),
    allowFlight: z.boolean(),
    flavor: requiredStringSchema('Flavor', 50),
});

export const factorioGameSpecificSchema = z
    .object({
        version: z.enum(['latest', 'experimental', 'custom']),
        customVersion: z.string().trim().max(32, 'Custom version is too long').optional(),
        maxSlots: integerRangeSchema('Max slots', 1, 32_767),
        saveName: requiredStringSchema('Save name', 20),
        serverDescription: requiredStringSchema('Server description', 100),
        autoSaveInterval: integerRangeSchema('Autosave interval', 1, 999),
        autoSaveSlots: integerRangeSchema('Autosave slots', 1, 20),
        afkKick: z.boolean(),
        enabledDLCs: z
            .array(z.enum(['elevated-rails', 'quality', 'space-age']))
            .max(3, 'Too many DLCs')
            .transform((items) => Array.from(new Set(items))),
    })
    .superRefine((value, ctx) => {
        if (value.version === 'custom' && !value.customVersion?.trim()) {
            ctx.addIssue({
                code: 'custom',
                path: ['customVersion'],
                message: 'Custom version is required',
            });
        }
    });

export const satisfactoryGameSpecificSchema = z.object({
    version: z.enum(['release', 'experimental']),
    max_players: integerRangeSchema('Max players', 1, 64),
    num_autosaves: integerRangeSchema('Autosaves', 1, 100),
    upload_crash_report: z.boolean(),
    autosave_interval: integerRangeSchema('Autosave interval', 60, 3_600),
});

export const hytaleGameSpecificSchema = z.object({
    auth_mode: z.enum(['authenticated', 'offline']),
    patchline: z.enum(['release', 'pre-release']),
    accept_early_plugins: z.boolean(),
    allow_op: z.boolean(),
    install_sourcequery_plugin: z.boolean(),
    disable_sentry: z.boolean(),
    use_aot_cache: z.boolean(),
});

const baseGameConfigShape = {
    gameId: z.number().int().positive().optional(),
    eggId: integerRangeSchema('Egg ID', 1, 100_000),
    version: requiredStringSchema('Version', 64),
    dockerImage: requiredStringSchema('Docker image', 255),
} as const;

export const gameConfigSchema: z.ZodType<GameConfig> = z.union([
    z.object({
        ...baseGameConfigShape,
        gameSlug: z.literal('minecraft'),
        gameSpecificConfig: minecraftGameSpecificSchema,
    }),
    z.object({
        ...baseGameConfigShape,
        gameSlug: z.literal('factorio'),
        gameSpecificConfig: factorioGameSpecificSchema,
    }),
    z.object({
        ...baseGameConfigShape,
        gameSlug: z.literal('satisfactory'),
        gameSpecificConfig: satisfactoryGameSpecificSchema,
    }),
    z.object({
        ...baseGameConfigShape,
        gameSlug: z.literal('hytale'),
        gameSpecificConfig: hytaleGameSpecificSchema,
    }),
]);

export const checkoutConfiguredParamsSchema = z.object({
    type: z.literal('CONFIGURED'),
    locale: localeSchema,
    creationServerConfig: z.object({
        hardwareConfig: configuredHardwareConfigSchema,
        gameConfig: gameConfigSchema,
    }),
    resourceTierId: integerRangeSchema('Resource tier', 1, 10_000),
});

export const checkoutUpgradeParamsSchema = z.object({
    type: z.literal('UPGRADE'),
    locale: localeSchema,
    ptServerId: serverIdentifierSchema,
    resourceTierId: integerRangeSchema('Resource tier', 1, 10_000),
    upgradeConfig: upgradeHardwareConfigSchema,
});

export const checkoutToPayedParamsSchema = z.object({
    type: z.literal('TO_PAYED'),
    locale: localeSchema,
    ptServerId: serverIdentifierSchema,
    hardwareConfig: upgradeHardwareConfigSchema,
});

export const checkoutParamsSchema = z.discriminatedUnion('type', [
    checkoutConfiguredParamsSchema,
    checkoutUpgradeParamsSchema,
    checkoutToPayedParamsSchema,
]);

export const orderCheckoutSearchParamsSchema = z.object({
    orderId: orderIdSchema,
});

export const checkoutReturnSearchParamsSchema = z.object({
    session_id: requiredStringSchema('Session ID', 255),
});

export const hardwareConfiguratorQuerySchema = z.object({
    pf: integerRangeSchema('Performance group', 1, 10_000),
    cpu: integerRangeSchema('CPU cores', 1, 32),
    ram: integerRangeSchema('RAM', 1, 256),
    days: configuredDurationSchema,
    disk: integerRangeSchema('Disk', 10, 1_024).optional(),
    backups: integerRangeSchema('Backups', 2, 20).optional(),
    allocations: integerRangeSchema('Allocations', 2, 20).optional(),
});

export const performanceConfiguratorQuerySchema = z.object({
    pf: integerRangeSchema('Performance group', 1, 10_000),
    cpu: integerRangeSchema('CPU cores', 1, 32),
    ram: integerRangeSchema('RAM', 1, 256),
    days: configuredDurationSchema,
    tier: integerRangeSchema('Resource tier', 1, 10_000),
});

export const PROFILE_TABS = ['account', 'security', 'payments'] as const;
export const profileTabSchema = z.enum(PROFILE_TABS);

export const refundRequestSchema = z.object({
    orderId: orderIdSchema,
});

export const adminRefundSchema = z.object({
    orderId: orderIdSchema,
    amountCents: integerRangeSchema('Amount', 1, 10_000_000),
    type: z.nativeEnum(RefundType),
    serverAction: z.nativeEnum(RefundServerAction),
    reason: z.string().trim().max(1_000, 'Reason is too long').optional(),
    internalNote: z.string().trim().max(2_000, 'Internal note is too long').optional(),
});

export const supportTicketSchema = z.object({
    subject: optionalStringSchema(120),
    description: requiredStringSchema('Message', 2_000),
    category: z.nativeEnum(TicketCategory).optional(),
});

export const ftpPasswordUpdateSchema = z.object({
    serverIdentifier: serverIdentifierSchema,
    password: z
        .string()
        .trim()
        .min(
            FTP_PASSWORD_MIN_LENGTH,
            `Password must be at least ${FTP_PASSWORD_MIN_LENGTH} characters`,
        )
        .max(
            FTP_PASSWORD_MAX_LENGTH,
            `Password must be at most ${FTP_PASSWORD_MAX_LENGTH} characters`,
        )
        .optional(),
});

export const serverRenameSchema = z.object({
    ptServerId: serverIdentifierSchema,
    newName: requiredStringSchema('Server name', 200),
});

export const serverStartupSchema = z.object({
    ptServerId: serverIdentifierSchema,
    dockerImage: requiredStringSchema('Docker image', 255),
});

export const serverActionIdentifierSchema = z.object({
    ptServerId: serverIdentifierSchema,
});
