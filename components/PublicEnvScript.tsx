export function PublicEnvScript() {
    const publicEnv = Object.fromEntries(
        Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    );
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `window.__ENV = ${JSON.stringify(publicEnv)};`,
            }}
        />
    );
}
