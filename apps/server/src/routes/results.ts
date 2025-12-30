import { Router } from 'express';
import { telegramAuthMiddleware } from '../lib/auth';
import { appendResultRow, checkDuplicateToday } from '../lib/sheets';
import { SaveResultRequestSchema } from '@stalker/shared';

const router = Router();

/**
 * POST /api/results
 * Сохраняет результат теста в Google Sheets
 */
router.post('/', telegramAuthMiddleware, async (req, res) => {
    try {
        const user = req.telegramUser;

        if (!user) {
            res.status(401).json({ success: false, error: 'User not authenticated' });
            return;
        }

        // Валидация тела запроса
        const parseResult = SaveResultRequestSchema.safeParse(req.body);

        if (!parseResult.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request body',
                details: parseResult.error.errors,
            });
            return;
        }

        const { test_code, result_type, result_title, phone } = parseResult.data;

        // Проверяем на дубли (логируем, но не блокируем)
        const duplicate = await checkDuplicateToday(user.id, test_code);
        if (duplicate.exists) {
            console.log(`⚠️ Duplicate entry today for user ${user.id}, test ${test_code}`);
        }

        // Добавляем запись
        const result = await appendResultRow({
            timestamp: new Date().toISOString(),
            telegram_id: user.id,
            telegram_username: user.username || '',
            phone: phone || '',
            test_code,
            result_type,
            result_title,
        });

        if (!result.success) {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to save result',
            });
            return;
        }

        res.json({
            success: true,
            message: 'Result saved successfully',
            isDuplicate: duplicate.exists,
        });
    } catch (error) {
        console.error('Error saving result:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

export default router;
