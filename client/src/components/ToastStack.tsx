'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastData {
    id: number;
    message: string;
    type: ToastType;
}

interface Props {
    toasts: ToastData[];
    onDismiss: (id: number) => void;
}

const STYLES: Record<ToastType, string> = {
    success: 'bg-gray-900 text-white',
    error: 'bg-red-500 text-white',
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
    useEffect(() => {
        const t = setTimeout(() => onDismiss(toast.id), 3000);
        return () => clearTimeout(t);
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${STYLES[toast.type]}`}
        >
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="opacity-60 hover:opacity-100 transition-opacity text-xs leading-none"
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    );
}

export default function ToastStack({ toasts, onDismiss }: Props) {
    if (!toasts.length) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} onDismiss={onDismiss} />
                </div>
            ))}
        </div>
    );
}
