'use client';

export default function LoadingScreen() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
            <div className="text-6xl mb-6 animate-bounce-slow">🏠</div>
            <h2 className="text-xl font-semibold mb-2">Теремок</h2>
            <p className="text-secondary text-sm">Загрузка...</p>

            <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    );
}
