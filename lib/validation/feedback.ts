import { FeedbackType } from '@/app/client/generated/enums';
import { optionalStringSchema, serverIdentifierSchema, z } from './common';

// Structured survey answers stored in Feedback.data (JSON).
// Known survey keys are validated strictly; the auto-context keys
// (modpackId/modpackVersion/locale) are filled in by the UI.
export const feedbackDataSchema = z.object({
    outcome: z.enum(['worked', 'partial', 'failed']).optional(),
    issues: z
        .array(z.string().trim().max(50, 'Issue must be at most 50 characters'))
        .max(10, 'Too many issues')
        .optional(),
    rating: z
        .number()
        .int('Rating must be a whole number')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5')
        .optional(),
    modpackId: z.string().trim().max(191).optional(),
    modpackVersion: z.string().trim().max(191).optional(),
    locale: z.string().trim().max(10).optional(),
});

export const submitFeedbackSchema = z.object({
    type: z.nativeEnum(FeedbackType),
    ptGameServerId: serverIdentifierSchema.optional(),
    title: optionalStringSchema(200),
    message: optionalStringSchema(5_000),
    data: feedbackDataSchema,
});

export type FeedbackData = z.input<typeof feedbackDataSchema>;
export type SubmitFeedbackInput = z.input<typeof submitFeedbackSchema>;
