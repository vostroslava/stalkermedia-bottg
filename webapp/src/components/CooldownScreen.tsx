'use client';

import { useState, useEffect } from 'react';
import { hapticFeedback } from '@/lib/telegram';

interface CooldownScreenProps {
    secondsLeft: number;
    onRefresh: () => void;
    onClose: () => void;
}

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0'),
    ].join(':');
}

export default function CooldownScreen({
    secondsLeft,
    onRefresh,
    onClose,
}: CooldownScreenProps) {
    const [timeLeft, setTimeLeft] = useState(secondsLeft);
    const [refreshing, setRefreshing] = useState(false);

    // Update timer on initial load and when prop changes
    useEffect(() => {
        setTimeLeft(secondsLeft);
    }, [secondsLeft]);

    // Gentle countdown - update every 10 seconds to avoid spam
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 10));
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        hapticFeedback('medium');

        // Call parent to re-check from backend
        onRefresh();

        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex flex-col p-6 animate-fadeIn">
            <div className="flex-1 flex flex-col justify-center text-center">
                {/* Icon */}
                <div className="text-8xl mb-6">⏰</div>

                {/* Title */}
                <h1 className="text-2xl font-bold mb-4">
                    Подождите немного
                </h1>

                <p className="text-secondary mb-8">
                    Тест можно проходить 1 раз в 24 часа.<br />
                    Следующая попытка доступна через:
                </p>

                {/* Timer */}
                <div className="card p-8 mb-8 inline-block mx-auto">
                    <div className="text-5xl font-mono font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Motivation */}
                <div className="card p-6 mb-8">
                    <p className="text-hint text-sm">
                        💡 Пока ждёте, подписывайтесь на наш канал — там много полезных
                        материалов о мотивации и управлении командой!
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 safe-area-bottom">
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="btn-secondary w-full"
                >
                    {refreshing ? '🔄 Проверяю...' : '🔄 Проверить снова'}
                </button>

                <button
                    onClick={onClose}
                    className="btn-ghost w-full"
                >
                    Закрыть
                </button>
            </div>
        </div>
    );
}
