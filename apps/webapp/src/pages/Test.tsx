import { useState } from 'react';
import type { TestMatrix, UserAnswer, CalculatedResult } from '@stalker/shared';
import { calculateResult } from '@stalker/shared';

interface TestProps {
    testCode: string;
    matrix: TestMatrix;
    onComplete: (result: CalculatedResult) => void;
    onBack: () => void;
}

function Test({ matrix, onComplete, onBack }: TestProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<UserAnswer[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const question = matrix.questions[currentQuestion];
    const totalQuestions = matrix.questions.length;
    const progress = ((currentQuestion) / totalQuestions) * 100;

    const handleSelectAnswer = (type: string) => {
        setSelectedAnswer(type);
    };

    const handleNext = () => {
        if (!selectedAnswer) return;

        const newAnswers: UserAnswer[] = [
            ...answers,
            { questionId: question.id, selectedType: selectedAnswer },
        ];

        setAnswers(newAnswers);
        setSelectedAnswer(null);

        if (currentQuestion < totalQuestions - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Тест завершён
            const result = calculateResult(newAnswers, matrix);
            onComplete(result);
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
            // Восстанавливаем предыдущий ответ
            const prevAnswer = answers[currentQuestion - 1];
            setSelectedAnswer(prevAnswer?.selectedType || null);
            // Удаляем последний ответ
            setAnswers(answers.slice(0, -1));
        }
    };

    return (
        <>
            <div className="progress">
                <div className="progress__bar">
                    <div
                        className="progress__fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="progress__text">
                    Вопрос {currentQuestion + 1} из {totalQuestions}
                </div>
            </div>

            <div className="question">
                <h2 className="question__text">{question.text}</h2>

                <div className="answers">
                    {question.answers.map((answer, index) => (
                        <button
                            key={index}
                            className={`answer ${selectedAnswer === answer.type ? 'answer--selected' : ''}`}
                            onClick={() => handleSelectAnswer(answer.type)}
                        >
                            {answer.text}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-auto">
                <button
                    className="btn btn--primary mb-16"
                    onClick={handleNext}
                    disabled={!selectedAnswer}
                >
                    {currentQuestion < totalQuestions - 1 ? 'Далее →' : 'Завершить тест'}
                </button>

                {currentQuestion > 0 ? (
                    <button className="btn btn--ghost" onClick={handleBack}>
                        ← Предыдущий вопрос
                    </button>
                ) : (
                    <button className="btn btn--ghost" onClick={onBack}>
                        ← Отменить
                    </button>
                )}
            </div>
        </>
    );
}

export default Test;
