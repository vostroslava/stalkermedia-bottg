import { useState, useEffect } from 'react';
import { checkSubscription, getTestMatrix } from '../lib/api';
import type { TestMatrix } from '@stalker/shared';

interface SubscribeProps {
    testCode: string;
    onVerified: () => void;
    onBack: () => void;
    onSetMatrix: (matrix: TestMatrix) => void;
}

const CHANNEL_URL = 'https://t.me/stalker_media_minsk';

function Subscribe({ testCode, onVerified, onBack, onSetMatrix }: SubscribeProps) {
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialCheckDone, setInitialCheckDone] = useState(false);

    // Автопроверка при первой загрузке
    useEffect(() => {
        async function initialCheck() {
            try {
                setChecking(true);

                // Загружаем матрицу параллельно с проверкой подписки
                const [subResult, testResult] = await Promise.all([
                    checkSubscription(),
                    getTestMatrix(testCode),
                ]);

                if (testResult.success && testResult.data) {
                    onSetMatrix(testResult.data);
                }

                if (subResult.subscribed) {
                    onVerified();
                    return;
                }
            } catch (err) {
                // Игнорируем ошибки первичной проверки
                console.log('Initial check failed:', err);
            } finally {
                setChecking(false);
                setInitialCheckDone(true);
            }
        }

        initialCheck();
    }, [testCode, onVerified, onSetMatrix]);

    const handleCheck = async () => {
        setError(null);
        setChecking(true);

        try {
            const [subResult, testResult] = await Promise.all([
                checkSubscription(),
                getTestMatrix(testCode),
            ]);

            if (testResult.success && testResult.data) {
                onSetMatrix(testResult.data);
            }

            if (subResult.subscribed) {
                onVerified();
            } else {
                setError('Подписка не найдена. Подпишитесь на канал и попробуйте снова.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка проверки подписки');
        } finally {
            setChecking(false);
        }
    };

    const handleOpenChannel = () => {
        // Пробуем открыть через Telegram deep link
        const tgLink = CHANNEL_URL.replace('https://t.me/', 'tg://resolve?domain=');
        window.open(tgLink, '_blank');

        // Fallback на обычную ссылку
        setTimeout(() => {
            window.open(CHANNEL_URL, '_blank');
        }, 500);
    };

    if (checking && !initialCheckDone) {
        return (
            <div className="loader">
                <div className="loader__spinner" />
            </div>
        );
    }

    return (
        <div className="subscribe">
            <div className="subscribe__icon">🔔</div>
            <h2 className="subscribe__title">Подпишитесь на канал</h2>
            <p className="subscribe__text">
                Чтобы пройти тест, подпишитесь на наш Telegram-канал.
                Там вы найдёте много полезной информации о командах и управлении.
            </p>

            {error && (
                <p style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                </p>
            )}

            <div className="subscribe__buttons">
                <button className="btn btn--primary" onClick={handleOpenChannel}>
                    📢 Перейти в канал
                </button>

                <button
                    className="btn btn--secondary"
                    onClick={handleCheck}
                    disabled={checking}
                >
                    {checking ? 'Проверяю...' : '✓ Я подписался — проверить'}
                </button>

                <button className="btn btn--ghost" onClick={onBack}>
                    ← Назад
                </button>
            </div>
        </div>
    );
}

export default Subscribe;
