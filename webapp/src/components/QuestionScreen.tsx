'use client';

import { useState, useCallback } from 'react';
import { Question, Answer } from '@/types';
import { hapticFeedback } from '@/lib/telegram';

interface QuestionScreenProps {
    questions: Question[];
    currentIndex: number;
    answers: Answer[];
    onAnswer: (questionId: number, answer: 'a' | 'b' | 'c' | 'd' | 'e') => void;
    onBack: () => void;
    loading: boolean;
}

export default function QuestionScreen({
    questions,
    currentIndex,
    answers,
    onAnswer,
    onBack,
    loading,
}: QuestionScreenProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [animating, setAnimating] = useState(false);

    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    // Find previous answer for this question
    const previousAnswer = answers.find(a => a.questionId === question?.id);

    const handleSelect = useCallback((key: 'a' | 'b' | 'c' | 'd' | 'e') => {
        if (loading || animating) return;

        setSelectedOption(key);
        setAnimating(true);
        hapticFeedback('light');

        // Delay for animation
        setTimeout(() => {
            onAnswer(question.id, key);
            setSelectedOption(null);
            setAnimating(false);
        }, 300);
    }, [loading, animating, question, onAnswer]);

    const handleBack = () => {
        if (currentIndex > 0) {
            hapticFeedback('light');
            onBack();
        }
    };

    if (!question) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-4 animate-fadeIn">
            {/* Header with progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={handleBack}
                        disabled={currentIndex === 0}
                        className={`text-link text-sm ${currentIndex === 0 ? 'opacity-30' : ''}`}
                    >
                        ← Назад
                    </button>
                    <span className="font-medium">
                        {currentIndex + 1} / {questions.length}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-secondary-bg rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Question */}
            <div className="flex-1">
                <div className="card p-6 mb-6">
                    <p className="text-lg font-medium leading-relaxed">
                        {question.text}
                    </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {question.options.map((option) => {
                        const isSelected = selectedOption === option.key;
                        const wasPrevious = previousAnswer?.answer === option.key;

                        return (
                            <button
                                key={option.key}
                                onClick={() => handleSelect(option.key as 'a' | 'b' | 'c' | 'd' | 'e')}
                                disabled={loading || animating}
                                className={`
                  w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                                        ? 'border-amber-500 bg-amber-500/10 scale-[0.98]'
                                        : wasPrevious
                                            ? 'border-amber-500/50 bg-amber-500/5'
                                            : 'border-transparent bg-secondary-bg hover:bg-hint/10'
                                    }
                  ${loading || animating ? 'opacity-50' : ''}
                `}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isSelected || wasPrevious
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-hint/20'
                                        }
                  `}>
                                        {option.key.toUpperCase()}
                                    </span>
                                    <span className="flex-1 text-base">
                                        {option.text}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className="text-center text-hint mt-4">
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Сохраняю ответ...
                </div>
            )}
        </div>
    );
}
