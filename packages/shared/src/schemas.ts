import { z } from 'zod';

// ================== Answer Schema ==================

export const AnswerSchema = z.object({
    text: z.string().min(1, 'Answer text is required'),
    type: z.string().min(1, 'Answer type is required'),
});

// Alternative format with scores (for compatibility)
export const AnswerWithScoresSchema = z.object({
    text: z.string().min(1, 'Answer text is required'),
    scores: z.record(z.string(), z.number()),
});

// ================== Question Schema ==================

export const QuestionSchema = z.object({
    id: z.string().min(1, 'Question ID is required'),
    text: z.string().min(1, 'Question text is required'),
    answers: z.array(AnswerSchema).min(2, 'At least 2 answers required'),
});

export const QuestionWithScoresSchema = z.object({
    id: z.string().min(1, 'Question ID is required'),
    text: z.string().min(1, 'Question text is required'),
    answers: z.array(AnswerWithScoresSchema).min(2, 'At least 2 answers required'),
});

// ================== Result Definition Schema ==================

export const ResultDefinitionSchema = z.object({
    type: z.string().min(1, 'Result type is required'),
    title: z.string().min(1, 'Result title is required'),
    description: z.string().default(''),
});

// ================== Test Matrix Schema ==================

// Format A: Direct type in answers
export const TestMatrixDirectSchema = z.object({
    test_code: z.string().min(1, 'Test code is required'),
    title: z.string().min(1, 'Test title is required'),
    description: z.string().default(''),
    results: z.array(ResultDefinitionSchema).min(1, 'At least 1 result required'),
    questions: z.array(QuestionSchema).min(1, 'At least 1 question required'),
});

// Format B: Scores in answers
export const TestMatrixScoresSchema = z.object({
    test_code: z.string().min(1, 'Test code is required'),
    title: z.string().min(1, 'Test title is required'),
    description: z.string().default(''),
    results: z.array(ResultDefinitionSchema).min(1, 'At least 1 result required'),
    questions: z.array(QuestionWithScoresSchema).min(1, 'At least 1 question required'),
});

// Legacy format C: results_map instead of results array
export const TestMatrixLegacySchema = z.object({
    test_code: z.string().optional(),
    questions: z.array(z.object({
        id: z.string(),
        text: z.string(),
        answers: z.array(z.object({
            text: z.string(),
            type: z.string().optional(),
            scores: z.record(z.string(), z.number()).optional(),
        })),
    })),
    results_map: z.record(z.string(), z.string()),
});

// ================== API Request Schemas ==================

export const UserAnswerSchema = z.object({
    questionId: z.string().min(1),
    selectedType: z.string().min(1),
});

export const SaveResultRequestSchema = z.object({
    test_code: z.string().min(1, 'Test code is required'),
    result_type: z.string().min(1, 'Result type is required'),
    result_title: z.string().min(1, 'Result title is required'),
    phone: z.string().optional(),
    answers: z.array(UserAnswerSchema).optional(),
});

export const SubscriptionCheckQuerySchema = z.object({
    channel: z.string().optional(),
});

// ================== Type exports ==================

export type AnswerSchemaType = z.infer<typeof AnswerSchema>;
export type QuestionSchemaType = z.infer<typeof QuestionSchema>;
export type ResultDefinitionSchemaType = z.infer<typeof ResultDefinitionSchema>;
export type TestMatrixSchemaType = z.infer<typeof TestMatrixDirectSchema>;
export type UserAnswerSchemaType = z.infer<typeof UserAnswerSchema>;
export type SaveResultRequestSchemaType = z.infer<typeof SaveResultRequestSchema>;
