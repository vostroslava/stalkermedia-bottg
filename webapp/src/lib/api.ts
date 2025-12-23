// API client for Google Apps Script backend

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

interface ApiResponse<T = unknown> {
    success: boolean;
    error?: string;
    [key: string]: unknown;
}

async function postRequest<T>(action: string, data: object = {}): Promise<T> {
    const initData = typeof window !== 'undefined'
        ? window.Telegram?.WebApp?.initData || ''
        : '';

    const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action,
            initData,
            ...data,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
}

async function getRequest<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(GAS_URL);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
}

export const api = {
    // Initialize session
    async init() {
        return postRequest<{
            success: boolean;
            user: {
                telegram_id: number;
                first_name: string;
                username?: string;
            };
            isSubscribed: boolean;
            canStart: boolean;
            cooldownSecondsLeft: number;
            needsContact: boolean;
        }>('init');
    },

    // Check subscription
    async checkSubscription() {
        return postRequest<{
            success: boolean;
            isSubscribed: boolean;
            needsContact: boolean;
        }>('checkSubscription');
    },

    // Save lead contact
    async saveLead(phone: string) {
        return postRequest<{
            success: boolean;
            needsContact: boolean;
        }>('saveLead', { phone });
    },

    // Get questions
    async getQuestions() {
        return getRequest<{
            success: boolean;
            questions: {
                id: number;
                text: string;
                options: { key: string; text: string }[];
            }[];
        }>({ action: 'questions' });
    },

    // Start attempt
    async startAttempt() {
        return postRequest<{
            success: boolean;
            attemptId: string;
            cooldownSecondsLeft?: number;
        }>('startAttempt');
    },

    // Save answer
    async saveAnswer(attemptId: string, questionId: number, answer: string) {
        return postRequest<{
            success: boolean;
        }>('saveAnswer', { attemptId, questionId, answer });
    },

    // Finish attempt
    async finishAttempt(attemptId: string) {
        return postRequest<{
            success: boolean;
            result: {
                type: string;
                info: {
                    emoji: string;
                    title: string;
                    essence: string;
                    behaviors: string[];
                    risks: string[];
                    management: string[];
                };
                scores: Record<string, number>;
                duration_sec: number;
            };
        }>('finishAttempt', { attemptId });
    },
};
