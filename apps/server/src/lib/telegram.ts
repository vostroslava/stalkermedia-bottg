import type { ChatMemberResponse } from '@stalker/shared';
import { config } from '../config';

const TELEGRAM_API_URL = 'https://api.telegram.org';

/**
 * Проверяет членство пользователя в канале
 */
export async function getChatMember(
    chatId: string,
    userId: number
): Promise<{ isMember: boolean; status: string; error?: string }> {
    if (!config.botToken) {
        return {
            isMember: false,
            status: 'unknown',
            error: 'Bot token not configured',
        };
    }

    try {
        const url = `${TELEGRAM_API_URL}/bot${config.botToken}/getChatMember`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                user_id: userId,
            }),
        });

        const data = (await response.json()) as ChatMemberResponse;

        if (!data.ok) {
            // Частые ошибки:
            // - "Bad Request: user not found" - пользователь никогда не был в канале
            // - "Bad Request: chat not found" - канал не найден или бот не имеет доступа
            console.error('Telegram API error:', data.description);

            if (data.description?.includes('user not found')) {
                return { isMember: false, status: 'left' };
            }

            return {
                isMember: false,
                status: 'error',
                error: data.description || 'Failed to check subscription',
            };
        }

        const status = data.result?.status || 'unknown';

        // member, administrator, creator - подписан
        // left, kicked, restricted - не подписан
        const isMember = ['member', 'administrator', 'creator'].includes(status);

        return { isMember, status };
    } catch (error) {
        console.error('Error checking chat member:', error);
        return {
            isMember: false,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Отправляет сообщение пользователю (для уведомлений)
 */
export async function sendMessage(
    chatId: number,
    text: string,
    options?: { parseMode?: 'HTML' | 'Markdown' }
): Promise<boolean> {
    if (!config.botToken) {
        console.error('Bot token not configured');
        return false;
    }

    try {
        const url = `${TELEGRAM_API_URL}/bot${config.botToken}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: options?.parseMode,
            }),
        });

        const data = await response.json();
        return data.ok === true;
    } catch (error) {
        console.error('Error sending message:', error);
        return false;
    }
}
