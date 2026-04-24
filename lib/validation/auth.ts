import { optionalStringSchema, requiredStringSchema, z } from './common';

export const AUTH_NAME_MAX_LENGTH = 80;
export const AUTH_USERNAME_MAX_LENGTH = 30;
export const AUTH_EMAIL_MAX_LENGTH = 254;
export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 128;
export const AUTH_BAN_REASON_MAX_LENGTH = 500;

export const authEmailSchema = z
    .string({ error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .max(AUTH_EMAIL_MAX_LENGTH, `Email must be at most ${AUTH_EMAIL_MAX_LENGTH} characters`)
    .email('Invalid email address');

export const authPasswordSchema = z
    .string({ error: 'Password is required' })
    .min(
        AUTH_PASSWORD_MIN_LENGTH,
        `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters`,
    )
    .max(
        AUTH_PASSWORD_MAX_LENGTH,
        `Password must be at most ${AUTH_PASSWORD_MAX_LENGTH} characters`,
    );

export const authUsernameSchema = z
    .string({ error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(
        AUTH_USERNAME_MAX_LENGTH,
        `Username must be at most ${AUTH_USERNAME_MAX_LENGTH} characters`,
    )
    .regex(/^[A-Za-z0-9._]+$/, 'Username may only contain letters, numbers, ., and _')
    .refine((value) => !value.includes('@'), 'Username must not contain @');

export const authDisplayNameSchema = requiredStringSchema('Name', AUTH_NAME_MAX_LENGTH);
export const authOtpSchema = z
    .string({ error: 'Code is required' })
    .trim()
    .regex(/^[A-Za-z0-9-]{6,64}$/, 'Invalid code');

export const registerFormSchema = z
    .object({
        username: authUsernameSchema,
        email: authEmailSchema,
        password: authPasswordSchema,
        confirmPassword: z.string(),
        turnstileToken: requiredStringSchema('Captcha token', 4096),
    })
    .refine((data) => data.password === data.confirmPassword, {
        error: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const loginFormSchema = z.object({
    identity: z
        .string({ error: 'Email or username is required' })
        .trim()
        .min(1, 'Email or username is required')
        .max(AUTH_EMAIL_MAX_LENGTH, 'Email or username is too long'),
    password: authPasswordSchema,
});

export const forgotPasswordSchema = z.object({
    email: authEmailSchema,
});

export const resetPasswordSchema = z
    .object({
        token: requiredStringSchema('Reset token', 2048),
        newPassword: authPasswordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        error: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const changePasswordSchema = z
    .object({
        currentPassword: authPasswordSchema,
        newPassword: authPasswordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        error: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const usernameUpdateSchema = z.object({
    username: authUsernameSchema,
});

export const banReasonSchema = optionalStringSchema(AUTH_BAN_REASON_MAX_LENGTH);
