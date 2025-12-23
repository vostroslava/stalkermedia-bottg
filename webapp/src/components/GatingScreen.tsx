'use client';

import { useState } from 'react';
import { hapticFeedback, openTelegramLink } from '@/lib/telegram';

interface GatingScreenProps {
    firstName: string;
    channelUrl: string;
    onSubscriptionCheck: () => Promise<boolean>;
    onContactSave: (phone: string) => Promise<boolean>;
    onContinue: () => void;
}

export default function GatingScreen({
    firstName,
    channelUrl,
    onSubscriptionCheck,
    onContactSave,
    onContinue,
}: GatingScreenProps) {
    const [mode, setMode] = useState<'choice' | 'contact'>('choice');
    const [checking, setChecking] = useState(false);
    const [phone, setPhone] = useState('');
    const [name, setName] = useState(firstName);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubscribe = () => {
        hapticFeedback('light');
        openTelegramLink(channelUrl);
    };

    const handleCheckSubscription = async () => {
        setChecking(true);
        setError('');
        hapticFeedback('medium');

        try {
            const isSubscribed = await onSubscriptionCheck();
            if (isSubscribed) {
                hapticFeedback('success');
                onContinue();
            } else {
                setError('Подписка не найдена. Подпишитесь и нажмите кнопку снова.');
                hapticFeedback('warning');
            }
        } catch {
            setError('Ошибка проверки. Попробуйте позже.');
            hapticFeedback('error');
        } finally {
            setChecking(false);
        }
    };

    const handleSaveContact = async () => {
        if (!phone || phone.length < 10) {
            setError('Введите корректный номер телефона');
            hapticFeedback('warning');
            return;
        }

        setSaving(true);
        setError('');
        hapticFeedback('medium');

        try {
            const saved = await onContactSave(phone);
            if (saved) {
                hapticFeedback('success');
                onContinue();
            } else {
                setError('Ошибка сохранения. Попробуйте позже.');
                hapticFeedback('error');
            }
        } catch {
            setError('Ошибка сохранения. Попробуйте позже.');
            hapticFeedback('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col p-6 animate-fadeIn">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-6xl mb-4">🏠</div>
                <h1 className="text-2xl font-bold mb-2">Добро пожаловать!</h1>
                <p className="text-secondary">
                    {firstName}, для прохождения теста выберите один из вариантов:
                </p>
            </div>

            {mode === 'choice' ? (
                <div className="flex-1 space-y-4">
                    {/* Option A: Subscribe */}
                    <div className="card p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-3xl">📢</span>
                            <div>
                                <h3 className="font-semibold text-lg">Подписаться на канал</h3>
                                <p className="text-secondary text-sm">
                                    Проходите тест без ограничений
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={handleSubscribe}
                                className="btn-secondary w-full"
                            >
                                Перейти в канал →
                            </button>
                            <button
                                onClick={handleCheckSubscription}
                                disabled={checking}
                                className="btn-primary w-full"
                            >
                                {checking ? 'Проверяю...' : '✓ Я подписался'}
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 py-2">
                        <div className="flex-1 h-px bg-hint opacity-30"></div>
                        <span className="text-hint text-sm">или</span>
                        <div className="flex-1 h-px bg-hint opacity-30"></div>
                    </div>

                    {/* Option B: Leave contact */}
                    <div className="card p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-3xl">📱</span>
                            <div>
                                <h3 className="font-semibold text-lg">Оставить контакт</h3>
                                <p className="text-secondary text-sm">
                                    Мы свяжемся с вами с полезными материалами
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMode('contact')}
                            className="btn-secondary w-full"
                        >
                            Указать номер телефона
                        </button>
                    </div>

                    {error && (
                        <div className="text-center text-red-500 text-sm animate-shake">
                            {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1">
                    <div className="card p-6">
                        <button
                            onClick={() => setMode('choice')}
                            className="text-link text-sm mb-4"
                        >
                            ← Назад
                        </button>

                        <h3 className="font-semibold text-lg mb-6">Ваши контактные данные</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-secondary text-sm mb-2">Имя</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field"
                                    placeholder="Ваше имя"
                                />
                            </div>

                            <div>
                                <label className="block text-secondary text-sm mb-2">Телефон</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="input-field"
                                    placeholder="+375 __ ___ __ __"
                                />
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSaveContact}
                                disabled={saving || !phone}
                                className="btn-primary w-full mt-4"
                            >
                                {saving ? 'Сохраняю...' : 'Продолжить →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
