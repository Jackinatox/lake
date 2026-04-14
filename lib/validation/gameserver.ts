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
        gameId: positiveIntSchema,
        gameConfig: gameConfigSchema,
        deleteFiles: z.boolean().default(true),
    })
    .superRefine((value, ctx) => {
        if (value.gameConfig.gameId != null && value.gameConfig.gameId !== value.gameId) {
            ctx.addIssue({
                code: 'custom',
                path: ['gameConfig', 'gameId'],
                message: 'Game configuration does not match the selected game',
            });
        }
    });
