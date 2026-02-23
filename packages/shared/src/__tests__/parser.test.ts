import { describe, it, expect } from 'vitest';
import { parseTestMatrix, calculateResult, validateMatrixConsistency } from '../parser';
import type { TestMatrix, UserAnswer } from '../types';

describe('parseTestMatrix', () => {
    it('should parse direct format correctly', () => {
        const input = {
            test_code: 'test1',
            title: 'Test Title',
            description: 'Test Description',
            results: [
                { type: 'type_a', title: 'Type A', description: 'Desc A' },
                { type: 'type_b', title: 'Type B', description: 'Desc B' },
            ],
            questions: [
                {
                    id: 'q1',
                    text: 'Question 1',
                    answers: [
                        { text: 'Answer A', type: 'type_a' },
                        { text: 'Answer B', type: 'type_b' },
                    ],
                },
            ],
        };

        const result = parseTestMatrix(input);

        expect(result.test_code).toBe('test1');
        expect(result.title).toBe('Test Title');
        expect(result.questions).toHaveLength(1);
        expect(result.questions[0].answers[0].type).toBe('type_a');
    });

    it('should parse scores format and convert to direct', () => {
        const input = {
            test_code: 'test2',
            title: 'Test With Scores',
            description: '',
            results: [
                { type: 'wolf', title: 'Wolf', description: '' },
                { type: 'fox', title: 'Fox', description: '' },
            ],
            questions: [
                {
                    id: 'q1',
                    text: 'Question 1',
                    answers: [
                        { text: 'Answer A', scores: { wolf: 2, fox: 0 } },
                        { text: 'Answer B', scores: { wolf: 0, fox: 1 } },
                    ],
                },
            ],
        };

        const result = parseTestMatrix(input);

        expect(result.questions[0].answers[0].type).toBe('wolf');
        expect(result.questions[0].answers[1].type).toBe('fox');
    });

    it('should throw error for invalid format', () => {
        const input = { invalid: 'data' };

        expect(() => parseTestMatrix(input)).toThrow();
    });
});

describe('calculateResult', () => {
    const testMatrix: TestMatrix = {
        test_code: 'test',
        title: 'Test',
        description: '',
        results: [
            { type: 'wolf', title: 'Волк', description: 'Волк описание' },
            { type: 'fox', title: 'Лиса', description: 'Лиса описание' },
            { type: 'bear', title: 'Медведь', description: 'Медведь описание' },
        ],
        questions: [
            { id: 'q1', text: 'Q1', answers: [] },
            { id: 'q2', text: 'Q2', answers: [] },
            { id: 'q3', text: 'Q3', answers: [] },
            { id: 'q4', text: 'Q4', answers: [] },
            { id: 'q5', text: 'Q5', answers: [] },
        ],
    };

    it('should return type with highest score', () => {
        const answers: UserAnswer[] = [
            { questionId: 'q1', selectedType: 'wolf' },
            { questionId: 'q2', selectedType: 'wolf' },
            { questionId: 'q3', selectedType: 'fox' },
        ];

        const result = calculateResult(answers, testMatrix);

        expect(result.result_type).toBe('wolf');
        expect(result.result_title).toBe('Волк');
        expect(result.scores.wolf).toBe(2);
        expect(result.scores.fox).toBe(1);
    });

    it('should apply tie-break using last 3 answers', () => {
        const answers: UserAnswer[] = [
            { questionId: 'q1', selectedType: 'wolf' },
            { questionId: 'q2', selectedType: 'wolf' },
            { questionId: 'q3', selectedType: 'fox' },
            { questionId: 'q4', selectedType: 'fox' },
            { questionId: 'q5', selectedType: 'fox' }, // last 3: fox, fox, wolf -> fox wins
        ];

        const result = calculateResult(answers, testMatrix);

        expect(result.result_type).toBe('fox');
    });

    it('should use order from results array as final fallback', () => {
        const answers: UserAnswer[] = [
            { questionId: 'q1', selectedType: 'wolf' },
            { questionId: 'q2', selectedType: 'fox' },
            { questionId: 'q3', selectedType: 'bear' }, // all tied, last 3 all different
        ];

        const result = calculateResult(answers, testMatrix);

        // wolf is first in results array
        expect(result.result_type).toBe('wolf');
    });

    it('should return first result when no answers', () => {
        const result = calculateResult([], testMatrix);

        expect(result.result_type).toBe('wolf');
    });
});

describe('validateMatrixConsistency', () => {
    it('should return valid for consistent matrix', () => {
        const matrix: TestMatrix = {
            test_code: 'test',
            title: 'Test',
            description: '',
            results: [
                { type: 'a', title: 'A', description: '' },
                { type: 'b', title: 'B', description: '' },
            ],
            questions: [
                {
                    id: 'q1',
                    text: 'Q1',
                    answers: [
                        { text: 'Ans A', type: 'a' },
                        { text: 'Ans B', type: 'b' },
                    ],
                },
            ],
        };

        const result = validateMatrixConsistency(matrix);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should detect missing result types', () => {
        const matrix: TestMatrix = {
            test_code: 'test',
            title: 'Test',
            description: '',
            results: [{ type: 'a', title: 'A', description: '' }],
            questions: [
                {
                    id: 'q1',
                    text: 'Q1',
                    answers: [
                        { text: 'Ans A', type: 'a' },
                        { text: 'Ans B', type: 'missing_type' },
                    ],
                },
            ],
        };

        const result = validateMatrixConsistency(matrix);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('missing_type');
    });
});
