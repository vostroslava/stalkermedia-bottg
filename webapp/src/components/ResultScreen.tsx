'use client';

import { TestResult } from '@/types';
import { hapticFeedback, sendResultToChat, closeApp } from '@/lib/telegram';

interface ResultScreenProps {
    result: TestResult;
    canRetry: boolean;
    onRetry: () => void;
}

export default function ResultScreen({
    result,
    canRetry,
    onRetry,
}: ResultScreenProps) {
    const { info, scores, duration_sec } = result;

    const handleShare = () => {
        hapticFeedback('success');

        const text = `🏠 Мой типаж по тесту «Теремок»:\n\n` +
            `${info.emoji} ${info.title}\n\n` +
            `${info.essence}\n\n` +
            `Пройди тест и узнай себя!`;

        // Try to copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }

        // Also try Telegram sendData
        sendResultToChat(JSON.stringify({
            type: 'result',
            typology: info.title,
            emoji: info.emoji,
        }));
    };

    const handleRetry = () => {
        if (canRetry) {
            hapticFeedback('medium');
            onRetry();
        } else {
            hapticFeedback('warning');
        }
    };

    const handleClose = () => {
        hapticFeedback('light');
        closeApp();
    };

    const formatDuration = (sec: number) => {
        const min = Math.floor(sec / 60);
        const s = sec % 60;
        return `${min}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen flex flex-col p-6 pb-8 animate-fadeIn">
            {/* Result Header */}
            <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-bounce-slow">{info.emoji}</div>
                <h1 className="text-3xl font-bold mb-2">
                    {info.title}
                </h1>
                <p className="text-secondary">
                    Ваш рабочий типаж
                </p>
            </div>

            {/* Essence */}
            <div className="card p-6 mb-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20">
                <p className="text-lg leading-relaxed">
                    {info.essence}
                </p>
            </div>

            {/* Sections */}
            <div className="space-y-4 flex-1">
                {/* Behaviors */}
                <div className="card p-5">
                    <h3 className="font-semibold text-sm text-hint mb-3 flex items-center gap-2">
                        <span>🎭</span> Как проявляется
                    </h3>
                    <ul className="space-y-2">
                        {info.behaviors.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-amber-500 mt-1">•</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Risks */}
                <div className="card p-5">
                    <h3 className="font-semibold text-sm text-hint mb-3 flex items-center gap-2">
                        <span>⚠️</span> Риски для команды
                    </h3>
                    <ul className="space-y-2">
                        {info.risks.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-orange-500 mt-1">•</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Management */}
                <div className="card p-5">
                    <h3 className="font-semibold text-sm text-hint mb-3 flex items-center gap-2">
                        <span>📋</span> Как мотивировать и управлять
                    </h3>
                    <ul className="space-y-2">
                        {info.management.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Stats */}
                <div className="card p-4">
                    <div className="flex justify-between text-sm text-hint">
                        <span>⏱️ Время: {formatDuration(duration_sec)}</span>
                        <span>📊 Баллы: {scores[info.title] || 0}</span>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="mt-6 space-y-3 safe-area-bottom">
                <a
                    href="https://t.me/stalkermedia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full text-center block"
                >
                    🎓 Хочу разбор / Практикум Теремок
                </a>

                <div className="flex gap-3">
                    <button
                        onClick={handleShare}
                        className="btn-secondary flex-1"
                    >
                        📤 Поделиться
                    </button>

                    {canRetry ? (
                        <button
                            onClick={handleRetry}
                            className="btn-secondary flex-1"
                        >
                            🔄 Пройти снова
                        </button>
                    ) : (
                        <button
                            onClick={handleClose}
                            className="btn-ghost flex-1"
                        >
                            Закрыть
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
