// TypeScript типы для Telegram Mini App тестов

// ================== Telegram Types ==================

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
}

export interface TelegramWebAppInitData {
    query_id?: string;
    user?: TelegramUser;
    auth_date: number;
    hash: string;
}

export interface ChatMemberResponse {
    ok: boolean;
    result?: {
        status: 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';
        user: TelegramUser;
    };
    error_code?: number;
    description?: string;
}

// ================== Test Matrix Types ==================

export interface Answer {
    text: string;
    type: string;
}

export interface Question {
    id: string;
    text: string;
    answers: Answer[];
}

export interface ResultDefinition {
    type: string;
    title: string;
    description: string;
}

export interface TestMatrix {
    test_code: string;
    title: string;
    description: string;
    results: ResultDefinition[];
    questions: Question[];
}

// ================== User Response Types ==================

export interface UserAnswer {
    questionId: string;
    selectedType: string;
}

export interface TestResult {
    type: string;
    title: string;
    description: string;
}

// ================== API Types ==================

export interface SubscriptionCheckResponse {
    subscribed: boolean;
    error?: string;
}

export interface SaveResultRequest {
    test_code: string;
    result_type: string;
    result_title: string;
    phone?: string;
    answers: UserAnswer[];
}

export interface SaveResultResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export interface TestMatrixResponse {
    success: boolean;
    data?: TestMatrix;
    error?: string;
}

// ================== Calculated Result ==================

export interface CalculatedResult {
    result_type: string;
    result_title: string;
    result_description: string;
    scores: Record<string, number>;
}
