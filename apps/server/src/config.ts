import 'dotenv/config';

interface Config {
    port: number;
    botToken: string;
    channelId: string;
    appsScriptUrl: string;
    appUrl: string;
    nodeEnv: string;
    isDev: boolean;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export function createConfig(): Config {
    const nodeEnv = getEnvOrDefault('NODE_ENV', 'development');
    const isDev = nodeEnv === 'development';

    return {
        port: parseInt(getEnvOrDefault('PORT', '3000'), 10),
        botToken: getEnvOrDefault('BOT_TOKEN', ''),
        channelId: getEnvOrDefault('CHANNEL_ID', '@stalker_media_minsk'),
        appsScriptUrl: getEnvOrDefault('APPS_SCRIPT_URL', ''),
        appUrl: getEnvOrDefault('APP_URL', 'http://localhost:5173'),
        nodeEnv,
        isDev,
    };
}

export const config = createConfig();
