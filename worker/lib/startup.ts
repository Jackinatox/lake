const ENV_VARS_REQUIRED = [
    'DATABASE_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'TELEGRAM_CHAT_ID',
    'TELEGRAM_BOT_TOKEN',
]

export async function verifyEnvVars(): Promise<void> {
    const missingVars: string[] = [];

    for (const varName of ENV_VARS_REQUIRED) {
        if (!process.env[varName]) {
            missingVars.push(varName);
        }
    }

    if (missingVars.length > 0) {
        const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║       🚨 CRITICAL: Missing Required Environment Variable       ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ The following required environment variables are missing:      ║
║                                                                ║
${missingVars.map((v) => `║   • ${v.padEnd(58)} ║`).join('\n')}
║                                                                ║
║ Please set these environment variables before starting the app.║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
        throw new Error(errorMessage);
    }
    console.log(
        `✓ All ${ENV_VARS_REQUIRED.length} required ENV-Vars are present`
    );
}