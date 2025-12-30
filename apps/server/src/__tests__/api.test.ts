import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Мокаем конфиг
vi.mock('../config', () => ({
    config: {
        port: 3000,
        botToken: 'test_token',
        channelId: '@test_channel',
        googleSheetId: 'test_sheet',
        googleSheetTab: 'results',
        googleServiceAccountJson: null,
        appUrl: 'http://localhost:5173',
        nodeEnv: 'test',
        isDev: true,
    },
}));

// Мокаем Telegram API
vi.mock('../lib/telegram', () => ({
    getChatMember: vi.fn().mockResolvedValue({ isMember: true, status: 'member' }),
}));

// Мокаем Google Sheets
vi.mock('../lib/sheets', () => ({
    appendResultRow: vi.fn().mockResolvedValue({ success: true }),
    checkDuplicateToday: vi.fn().mockResolvedValue({ exists: false }),
}));

import subscriptionRoutes from '../routes/subscription';
import resultsRoutes from '../routes/results';
import testsRoutes from '../routes/tests';

describe('API Routes', () => {
    let app: express.Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/subscription', subscriptionRoutes);
        app.use('/api/results', resultsRoutes);
        app.use('/api/tests', testsRoutes);
    });

    describe('GET /api/subscription/check', () => {
        it('should return subscribed status in dev mode', async () => {
            const response = await request(app)
                .get('/api/subscription/check')
                .expect(200);

            expect(response.body).toHaveProperty('subscribed');
        });
    });

    describe('POST /api/results', () => {
        it('should save result successfully', async () => {
            const response = await request(app)
                .post('/api/results')
                .send({
                    test_code: 'teremok',
                    result_type: 'wolf',
                    result_title: 'Волк',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should reject invalid request body', async () => {
            const response = await request(app)
                .post('/api/results')
                .send({
                    // missing required fields
                    test_code: 'teremok',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid request body');
        });
    });

    describe('GET /api/tests', () => {
        it('should return list of tests', async () => {
            const response = await request(app)
                .get('/api/tests')
                .expect(200);

            expect(response.body).toHaveProperty('tests');
            expect(Array.isArray(response.body.tests)).toBe(true);
        });
    });

    describe('GET /api/tests/:testCode', () => {
        it('should return test matrix for valid code', async () => {
            const response = await request(app)
                .get('/api/tests/teremok')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('test_code', 'teremok');
            expect(response.body.data).toHaveProperty('questions');
        });

        it('should return 404 for invalid test code', async () => {
            const response = await request(app)
                .get('/api/tests/nonexistent')
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });
});
