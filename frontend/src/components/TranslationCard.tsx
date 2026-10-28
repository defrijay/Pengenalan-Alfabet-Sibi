/**
 * components/TranslationCard.tsx
 * Kartu penampil hasil klasifikasi huruf SIBI saat ini secara langsung (real-time).
 */

import React from 'react';

interface TranslationCardProps {
    currentSign: string;
    isHandInArea: boolean;
    isCameraActive: boolean;
}

export const TranslationCard: React.FC<TranslationCardProps> = ({
    currentSign,
    isHandInArea,
    isCameraActive,
}) => {
    return (
        <div className="flex-none bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-center items-center text-center h-36 sm:h-44 relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500"></div>
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-blue-500/5 blur-2xl"></div>

            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 font-bold flex items-center gap-1.5">
                <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                        isHandInArea && isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`}
                ></span>
                Deteksi Saat Ini
            </p>

            <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight break-words w-full px-2 transition-all duration-500 ${
                    isHandInArea && isCameraActive
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent'
                        : 'text-blue-600 dark:text-blue-400'
                }`}
            >
                {currentSign}
            </h2>

            {isHandInArea && isCameraActive && currentSign !== 'Menunggu...' && (
                <div className="absolute -top-1 -right-1 w-3 h-3">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                    <span className="absolute inset-0 rounded-full bg-emerald-400"></span>
                </div>
            )}
        </div>
    );
};
