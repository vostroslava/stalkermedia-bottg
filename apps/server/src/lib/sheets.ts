import { config } from '../config';

export interface ResultRow {
    timestamp: string;
    telegram_id: number;
    telegram_username: string;
    phone: string;
    test_code: string;
    result_type: string;
    result_title: string;
}

/**
 * Отправляет данные результата в Google Sheets через Apps Script
 */
export async function appendResultRow(row: ResultRow): Promise<{ success: boolean; error?: string }> {
    const appsScriptUrl = config.appsScriptUrl;

    if (!appsScriptUrl) {
        // В dev режиме просто логируем
        if (config.isDev) {
            console.log('📝 [DEV] Would send to Apps Script:', row);
            return { success: true };
        }
        return { success: false, error: 'Apps Script URL not configured' };
    }

    try {
        const response = await fetch(appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'tg_bot', // Для различения от других источников
                ...row,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Apps Script error:', text);
            return { success: false, error: `HTTP ${response.status}` };
        }

        const result = await response.json();

        if (result.success) {
            console.log('✅ Row sent to Apps Script:', row.telegram_id, row.test_code);
            return { success: true };
        } else {
            return { success: false, error: result.error || result.message || 'Unknown error' };
        }
    } catch (error) {
        console.error('Error sending to Apps Script:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Проверка дублей не нужна при использовании Apps Script
 * (можно добавить логику в сам скрипт)
 */
export async function checkDuplicateToday(
    telegramId: number,
    testCode: string
): Promise<{ exists: boolean; error?: string }> {
    // Apps Script сам может обрабатывать дубли
    return { exists: false };
}
