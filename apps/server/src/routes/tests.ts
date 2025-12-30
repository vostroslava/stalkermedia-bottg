import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseTestMatrix, validateMatrixConsistency } from '@stalker/shared';

const router = Router();

// ESM эквивалент __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к папке с матрицами (в корне проекта)
const DATA_DIR = path.resolve(__dirname, '../../../../data');

// Кеш загруженных матриц
const matricesCache = new Map<string, ReturnType<typeof parseTestMatrix>>();

/**
 * Загружает матрицу теста из файла
 */
function loadMatrix(testCode: string): ReturnType<typeof parseTestMatrix> | null {
    // Проверяем кеш
    if (matricesCache.has(testCode)) {
        return matricesCache.get(testCode)!;
    }

    const filename = `matrix_${testCode}.json`;
    const filepath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
        console.error(`Matrix file not found: ${filepath}`);
        return null;
    }

    try {
        const content = fs.readFileSync(filepath, 'utf-8');
        const data = JSON.parse(content);
        const matrix = parseTestMatrix(data);

        // Валидируем консистентность
        const validation = validateMatrixConsistency(matrix);
        if (!validation.valid) {
            console.warn(`Matrix ${testCode} has consistency issues:`, validation.errors);
        }

        // Сохраняем в кеш
        matricesCache.set(testCode, matrix);

        console.log(`✅ Loaded matrix: ${testCode} (${matrix.questions.length} questions)`);
        return matrix;
    } catch (error) {
        console.error(`Error loading matrix ${testCode}:`, error);
        return null;
    }
}

/**
 * Предзагрузка всех матриц при старте
 */
export function preloadMatrices(): void {
    const testCodes = ['teremok', 'formula'];

    for (const code of testCodes) {
        loadMatrix(code);
    }
}

/**
 * GET /api/tests
 * Возвращает список доступных тестов
 */
router.get('/', (req, res) => {
    const tests = [];

    for (const code of ['teremok', 'formula']) {
        const matrix = loadMatrix(code);
        if (matrix) {
            tests.push({
                code: matrix.test_code,
                title: matrix.title,
                description: matrix.description,
                questionsCount: matrix.questions.length,
            });
        }
    }

    res.json({ tests });
});

/**
 * GET /api/tests/:testCode
 * Возвращает полную матрицу теста
 */
router.get('/:testCode', (req, res) => {
    const { testCode } = req.params;

    const matrix = loadMatrix(testCode);

    if (!matrix) {
        res.status(404).json({
            success: false,
            error: `Test "${testCode}" not found`,
        });
        return;
    }

    res.json({
        success: true,
        data: matrix,
    });
});

export default router;
