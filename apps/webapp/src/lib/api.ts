import type { TestMatrix, SubscriptionCheckResponse, SaveResultResponse } from '@stalker/shared';

// Получаем initData из Telegram WebApp
declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                initData: string;
                initDataUnsafe: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                    };
                };
                ready: () => void;
                expand: () => void;
                close: () => void;
                MainButton: {
                    text: string;
                    show: () => void;
                    hide: () => void;
                    onClick: (callback: () => void) => void;
                    offClick: (callback: () => void) => void;
                };
                themeParams: {
                    bg_color?: string;
                    text_color?: string;
                    hint_color?: string;
                    link_color?: string;
                    button_color?: string;
                    button_text_color?: string;
                };
            };
        };
    }
}

const API_BASE = '/api';

function getInitData(): string {
    return window.Telegram?.WebApp?.initData || '';
}

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
    const initData = getInitData();

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': initData,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

export async function getTests(): Promise<{ tests: Array<{ code: string; title: string; description: string; questionsCount: number }> }> {
    return fetchWithAuth(`${API_BASE}/tests`);
}

export async function getTestMatrix(testCode: string): Promise<{ success: boolean; data?: TestMatrix; error?: string }> {
    return fetchWithAuth(`${API_BASE}/tests/${testCode}`);
}

export async function checkSubscription(channel?: string): Promise<SubscriptionCheckResponse> {
    const params = channel ? `?channel=${encodeURIComponent(channel)}` : '';
    return fetchWithAuth(`${API_BASE}/subscription/check${params}`);
}

export async function saveResult(data: {
    test_code: string;
    result_type: string;
    result_title: string;
    phone?: string;
}): Promise<SaveResultResponse> {
    return fetchWithAuth(`${API_BASE}/results`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function initTelegramApp(): void {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
}

export function getTelegramUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user;
}

export function closeTelegramApp(): void {
    window.Telegram?.WebApp?.close();
}
