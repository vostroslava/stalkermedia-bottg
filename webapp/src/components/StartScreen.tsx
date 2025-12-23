'use client';

import { hapticFeedback } from '@/lib/telegram';

interface StartScreenProps {
    firstName: string;
    onStart: () => void;
    loading: boolean;
}

export default function StartScreen({
    firstName,
    onStart,
    loading,
}: StartScreenProps) {
    const handleStart = () => {
        hapticFeedback('medium');
        onStart();
    };

    return (
        <div className="min-h-screen flex flex-col p-6 animate-fadeIn">
            {/* Hero */}
            <div className="flex-1 flex flex-col justify-center text-center">
                <div className="text-8xl mb-6 animate-bounce-slow">🏠</div>

                <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                    Тест «Теремок»
                </h1>

                <p className="text-xl text-secondary mb-8">
                    {firstName}, узнай свой рабочий типаж!
                </p>

                {/* Info cards */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="card p-4 text-center">
                        <div className="text-2xl mb-1">📝</div>
                        <div className="text-sm font-medium">14</div>
                        <div className="text-xs text-hint">вопросов</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl mb-1">⏱️</div>
                        <div className="text-sm font-medium">1-2</div>
                        <div className="text-xs text-hint">минуты</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl mb-1">🎭</div>
                        <div className="text-sm font-medium">7</div>
                        <div className="text-xs text-hint">типажей</div>
                    </div>
                </div>

                {/* Typology preview */}
                <div className="card p-4 mb-8">
                    <p className="text-sm text-hint mb-3">Какой ты сотрудник?</p>
                    <div className="flex justify-center gap-2 text-2xl flex-wrap">
                        <span title="Птица">🐦</span>
                        <span title="Хомяк">🐹</span>
                        <span title="Лиса">🦊</span>
                        <span title="Профи">💼</span>
                        <span title="Волк">🐺</span>
                        <span title="Медведь">🐻</span>
                        <span title="Крыса">🐀</span>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="safe-area-bottom">
                <button
                    onClick={handleStart}
                    disabled={loading}
                    className="btn-primary w-full text-lg py-4"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span>
                            Загрузка...
                        </span>
                    ) : (
                        '🚀 Начать тест'
                    )}
                </button>

                <p className="text-center text-hint text-xs mt-4">
                    Тест можно проходить 1 раз в 24 часа
                </p>
            </div>
        </div>
    );
}
