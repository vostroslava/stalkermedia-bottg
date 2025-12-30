import type { TestMatrix, UserAnswer, CalculatedResult, ResultDefinition } from './types';
import { TestMatrixDirectSchema, TestMatrixScoresSchema, TestMatrixLegacySchema } from './schemas';

/**
 * Парсит и валидирует матрицу теста из JSON
 * Поддерживает 3 формата:
 * - Direct: answers с полем type
 * - Scores: answers с полем scores
 * - Legacy: results_map вместо results array
 */
export function parseTestMatrix(data: unknown): TestMatrix {
    // Попробуем парсить как Direct формат
    const directResult = TestMatrixDirectSchema.safeParse(data);
    if (directResult.success) {
        return directResult.data;
    }

    // Попробуем парсить как Scores формат и конвертировать
    const scoresResult = TestMatrixScoresSchema.safeParse(data);
    if (scoresResult.success) {
        return convertScoresToDirect(scoresResult.data);
    }

    // Попробуем парсить как Legacy формат
    const legacyResult = TestMatrixLegacySchema.safeParse(data);
    if (legacyResult.success) {
        return convertLegacyToDirect(legacyResult.data);
    }

    // Если ничего не подошло - выдаём ошибку
    throw new Error(`Invalid test matrix format. Errors:\n${directResult.error.message}`);
}

/**
 * Конвертирует формат со scores в direct формат
 */
function convertScoresToDirect(data: ReturnType<typeof TestMatrixScoresSchema.parse>): TestMatrix {
    return {
        test_code: data.test_code,
        title: data.title,
        description: data.description,
        results: data.results,
        questions: data.questions.map((q) => ({
            id: q.id,
            text: q.text,
            answers: q.answers.map((a) => {
                // Находим тип с максимальным score
                const maxType = Object.entries(a.scores).reduce(
                    (max, [type, score]) => (score > max.score ? { type, score } : max),
                    { type: '', score: -Infinity }
                );
                return {
                    text: a.text,
                    type: maxType.type,
                };
            }),
        })),
    };
}

/**
 * Конвертирует legacy формат в direct формат
 */
function convertLegacyToDirect(data: ReturnType<typeof TestMatrixLegacySchema.parse>): TestMatrix {
    const results: ResultDefinition[] = Object.entries(data.results_map).map(([type, title]) => ({
        type,
        title,
        description: '',
    }));

    return {
        test_code: data.test_code || 'unknown',
        title: '',
        description: '',
        results,
        questions: data.questions.map((q) => ({
            id: q.id,
            text: q.text,
            answers: q.answers.map((a) => ({
                text: a.text,
                type: a.type || Object.keys(a.scores || {})[0] || '',
            })),
        })),
    };
}

/**
 * Подсчитывает результат теста на основе ответов пользователя
 */
export function calculateResult(answers: UserAnswer[], matrix: TestMatrix): CalculatedResult {
    // 1. Подсчёт баллов по типам
    const scores = new Map<string, number>();
    for (const answer of answers) {
        const type = answer.selectedType;
        scores.set(type, (scores.get(type) || 0) + 1);
    }

    // Конвертируем в объект для возврата
    const scoresObject: Record<string, number> = {};
    scores.forEach((value, key) => {
        scoresObject[key] = value;
    });

    // 2. Найти максимум
    const maxScore = Math.max(...scores.values(), 0);
    if (maxScore === 0) {
        // Нет ответов - вернём первый результат
        const firstResult = matrix.results[0];
        return {
            result_type: firstResult.type,
            result_title: firstResult.title,
            result_description: firstResult.description,
            scores: scoresObject,
        };
    }

    const winners = [...scores.entries()].filter(([_, s]) => s === maxScore);

    if (winners.length === 1) {
        return getResult(winners[0][0], matrix, scoresObject);
    }

    // 3. Tie-break: последние 3 ответа
    const lastThree = answers.slice(-3);
    const lastScores = new Map<string, number>();
    for (const a of lastThree) {
        const type = a.selectedType;
        if (winners.some(([t]) => t === type)) {
            lastScores.set(type, (lastScores.get(type) || 0) + 1);
        }
    }

    // 4. Выбор по частоте в последних 3
    const lastMax = Math.max(...lastScores.values(), 0);
    const lastWinners = [...lastScores.entries()].filter(([_, s]) => s === lastMax);

    if (lastWinners.length === 1) {
        return getResult(lastWinners[0][0], matrix, scoresObject);
    }

    // 5. Fallback: первый в порядке results
    const winnerTypes = winners.map(([t]) => t);
    const orderedResult = matrix.results.find((r) => winnerTypes.includes(r.type));

    if (orderedResult) {
        return getResult(orderedResult.type, matrix, scoresObject);
    }

    // Крайний fallback
    return getResult(winners[0][0], matrix, scoresObject);
}

/**
 * Получает полный результат по типу
 */
function getResult(type: string, matrix: TestMatrix, scores: Record<string, number>): CalculatedResult {
    const resultDef = matrix.results.find((r) => r.type === type);
    if (!resultDef) {
        return {
            result_type: type,
            result_title: type,
            result_description: '',
            scores,
        };
    }

    return {
        result_type: resultDef.type,
        result_title: resultDef.title,
        result_description: resultDef.description,
        scores,
    };
}

/**
 * Валидирует что все типы ответов существуют в results
 */
export function validateMatrixConsistency(matrix: TestMatrix): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const resultTypes = new Set(matrix.results.map((r) => r.type));

    for (const question of matrix.questions) {
        for (const answer of question.answers) {
            if (!resultTypes.has(answer.type)) {
                errors.push(`Question ${question.id}: Answer type "${answer.type}" not found in results`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
