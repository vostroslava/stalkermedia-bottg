// Telegram WebApp types and utilities

declare global {
    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
        };
        auth_date?: number;
        hash?: string;
    };
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
        secondary_bg_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    ready: () => void;
    expand: () => void;
    close: () => void;
    enableClosingConfirmation: () => void;
    disableClosingConfirmation: () => void;
    sendData: (data: string) => void;
    openLink: (url: string) => void;
    openTelegramLink: (url: string) => void;
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        isProgressVisible: boolean;
        setText: (text: string) => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
        show: () => void;
        hide: () => void;
        enable: () => void;
        disable: () => void;
        showProgress: (leaveActive?: boolean) => void;
        hideProgress: () => void;
    };
    HapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
    };
    requestContact: (callback: (result: boolean, contact?: {
        phone_number: string;
        first_name: string;
        last_name?: string;
    }) => void) => void;
}

export function getTelegramWebApp(): TelegramWebApp | null {
    if (typeof window === 'undefined') return null;
    return window.Telegram?.WebApp || null;
}

export function getInitData(): string {
    return getTelegramWebApp()?.initData || '';
}

export function getColorScheme(): 'light' | 'dark' {
    return getTelegramWebApp()?.colorScheme || 'light';
}

export function getThemeParams() {
    return getTelegramWebApp()?.themeParams || {};
}

export function hapticFeedback(type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy') {
    const wa = getTelegramWebApp();
    if (!wa?.HapticFeedback) return;

    if (type === 'success' || type === 'warning' || type === 'error') {
        wa.HapticFeedback.notificationOccurred(type);
    } else {
        wa.HapticFeedback.impactOccurred(type);
    }
}

export function openTelegramLink(url: string) {
    const wa = getTelegramWebApp();
    if (wa?.openTelegramLink) {
        wa.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
}

export function sendResultToChat(result: string) {
    const wa = getTelegramWebApp();
    if (wa?.sendData) {
        wa.sendData(result);
    }
}

export function closeApp() {
    const wa = getTelegramWebApp();
    if (wa?.close) {
        wa.close();
    }
}
