// TypeScript types for Teremok Mini App

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export interface SessionData {
    user: TelegramUser;
    isSubscribed: boolean;
    canStart: boolean;
    cooldownSecondsLeft: number;
    needsContact: boolean;
}

export interface Question {
    id: number;
    text: string;
    options: {
        key: 'a' | 'b' | 'c' | 'd' | 'e';
        text: string;
    }[];
}

export interface TypologyInfo {
    emoji: string;
    title: string;
    essence: string;
    behaviors: string[];
    risks: string[];
    management: string[];
}

export interface TestResult {
    type: string;
    info: TypologyInfo;
    scores: Record<string, number>;
    duration_sec: number;
}

export interface Answer {
    questionId: number;
    answer: 'a' | 'b' | 'c' | 'd' | 'e';
}

export type Screen =
    | 'loading'
    | 'gating'
    | 'start'
    | 'questions'
    | 'cooldown'
    | 'result';

export interface AppState {
    screen: Screen;
    session: SessionData | null;
    questions: Question[];
    currentQuestionIndex: number;
    answers: Answer[];
    attemptId: string | null;
    result: TestResult | null;
    error: string | null;
}
