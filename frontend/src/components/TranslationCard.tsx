/**
 * components/TranslationCard.tsx
 * Kartu penampil huruf SIBI yang terdeteksi secara real-time dengan latar grid teknis
 * dan indikator progress bar confidence tipis.
 */

import React from 'react';

interface TranslationCardProps {
    currentSign: string;
    confidence?: number;
    isHandInArea: boolean;
    isCameraActive: boolean;
}

export const TranslationCard: React.FC<TranslationCardProps> = ({
    currentSign,
    confidence = 0,
    isHandInArea,
    isCameraActive,
}) => {
    const isDetected = isHandInArea && isCameraActive && currentSign !== 'Menunggu...';
    const confPercent = isDetected ? Math.round(confidence * 100) : 0;

    return (
        <div className="flex-none bg-white dark:bg-[#111113] p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                            isDetected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'
                        }`}
                    />
                    Deteksi Huruf Saat Ini
                </span>
                <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                    {isDetected ? `${confPercent}% CONF` : 'IDLE'}
                </span>
            </div>

            {/* Kotak Fokus Huruf Berlatar Grid Teknis */}
            <div className="bg-zinc-50 dark:bg-[#18181B] bg-tech-grid border border-zinc-200/80 dark:border-zinc-800 rounded-lg py-6 px-4 flex items-center justify-center min-h-[104px]">
                <h2
                    className={`font-mono tabular-nums font-bold tracking-tight transition-colors ${
                        isDetected
                            ? 'text-4xl sm:text-5xl text-zinc-900 dark:text-zinc-100'
                            : 'text-lg sm:text-xl text-zinc-400 dark:text-zinc-500 font-normal'
                    }`}
                >
                    {currentSign}
                </h2>
            </div>

            {/* Progress Bar Confidence Tipis (h-1.5) */}
            <div className="mt-3">
                <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${
                            confPercent >= 75
                                ? 'bg-emerald-500'
                                : confPercent >= 50
                                ? 'bg-amber-500'
                                : 'bg-zinc-400 dark:bg-zinc-600'
                        }`}
                        style={{ width: `${confPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
