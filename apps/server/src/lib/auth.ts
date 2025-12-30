import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { TelegramUser, TelegramWebAppInitData } from '@stalker/shared';
import { config } from '../config';

/**
 * Расширяем Express Request для хранения данных пользователя
 */
declare global {
    namespace Express {
        interface Request {
            telegramUser?: TelegramUser;
            initData?: TelegramWebAppInitData;
        }
    }
}

/**
 * Парсит initData query string в объект
 */
export function parseInitData(initDataString: string): Record<string, string> {
    const params = new URLSearchParams(initDataString);
    const result: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
        result[key] = value;
    }

    return result;
}

/**
 * Валидирует Telegram WebApp initData по HMAC-SHA256
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initDataString: string, botToken: string): boolean {
    try {
        const params = parseInitData(initDataString);
        const hash = params.hash;

        if (!hash) {
            return false;
        }

        // Удаляем hash и сортируем оставшиеся параметры
        delete params.hash;
        const dataCheckString = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Создаём secret_key = HMAC-SHA256(botToken, "WebAppData")
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Вычисляем хеш данных
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        return calculatedHash === hash;
    } catch (error) {
        console.error('Error validating initData:', error);
        return false;
    }
}

/**
 * Извлекает данные пользователя из initData
 */
export function extractUserFromInitData(initDataString: string): TelegramUser | null {
    try {
        const params = parseInitData(initDataString);
        const userJson = params.user;

        if (!userJson) {
            return null;
        }

        const user = JSON.parse(userJson) as TelegramUser;
        return user;
    } catch (error) {
        console.error('Error extracting user from initData:', error);
        return null;
    }
}

/**
 * Express middleware для валидации Telegram initData
 */
export function telegramAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
    const initData = req.headers['x-telegram-init-data'] as string || req.query.initData as string;

    if (!initData) {
        // В development режиме позволяем работать без initData
        if (config.isDev) {
            req.telegramUser = {
                id: 123456789,
                first_name: 'Dev',
                username: 'dev_user',
            };
            next();
            return;
        }

        res.status(401).json({ error: 'Missing Telegram initData' });
        return;
    }

    // В development режиме пропускаем валидацию, если нет токена
    if (config.isDev && !config.botToken) {
        const user = extractUserFromInitData(initData);
        if (user) {
            req.telegramUser = user;
        } else {
            req.telegramUser = {
                id: 123456789,
                first_name: 'Dev',
                username: 'dev_user',
            };
        }
        next();
        return;
    }

    if (!validateInitData(initData, config.botToken)) {
        res.status(401).json({ error: 'Invalid Telegram initData signature' });
        return;
    }

    const user = extractUserFromInitData(initData);
    if (!user) {
        res.status(401).json({ error: 'Could not extract user from initData' });
        return;
    }

    req.telegramUser = user;
    next();
}
