import { Router } from 'express';
import { telegramAuthMiddleware } from '../lib/auth';
import { getChatMember } from '../lib/telegram';
import { config } from '../config';

const router = Router();

/**
 * GET /api/subscription/check
 * Проверяет подписку пользователя на канал
 * Query params: channel (optional) - переопределить канал для проверки
 */
router.get('/check', telegramAuthMiddleware, async (req, res) => {
    try {
        const user = req.telegramUser;

        if (!user) {
            res.status(401).json({ subscribed: false, error: 'User not authenticated' });
            return;
        }

        // Берём канал из query или конфига
        const channel = (req.query.channel as string) || config.channelId;

        if (!channel) {
            res.status(400).json({ subscribed: false, error: 'Channel not specified' });
            return;
        }

        const result = await getChatMember(channel, user.id);

        res.json({
            subscribed: result.isMember,
            status: result.status,
            error: result.error,
        });
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({
            subscribed: false,
            error: 'Failed to check subscription',
        });
    }
});

export default router;
