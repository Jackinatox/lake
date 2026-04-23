import { gameConfigSchema } from './order';
import { positiveIntSchema, requiredStringSchema, serverIdentifierSchema, z } from './common';

export const renameServerSchema = z.object({
    ptServerId: serverIdentifierSchema,
    newName: requiredStringSchema('Server name', 200),
});

export const reinstallServerSchema = z.object({
    ptServerId: serverIdentifierSchema,
    deleteAllFiles: z.boolean(),
});

export const serverStartupSchema = z.object({
    ptServerId: serverIdentifierSchema,
    dockerImage: requiredStringSchema('Docker image', 255),
});

export const changeGameRequestSchema = z
    .object({
        ptServerId: serverIdentifierSchema,
        gameConfig: gameConfigSchema,
        gameEggId: positiveIntSchema,
        deleteFiles: z.boolean().default(true),
        gameSlug: requiredStringSchema('Game slug', 100),
    })
    .superRefine((value, ctx) => {
        if (value.gameConfig.eggId != null && value.gameConfig.eggId !== value.gameEggId) {
            ctx.addIssue({
                code: 'custom',
                path: ['gameConfig', 'eggId'],
                message: 'Game configuration does not match the selected game',
            });
        }
    });
