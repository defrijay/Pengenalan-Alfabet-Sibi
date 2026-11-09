/**
 * components/HistoryCard.tsx
 * Kartu akumulasi teks hasil deteksi alfabet SIBI beserta kontrol penghapusan
 * dan sintesis suara Text-to-Speech (TTS).
 */

import React from 'react';
import { Trash2, Volume2 } from 'lucide-react';

interface HistoryCardProps {
    translationHistory: string;
    onHistoryChange: (newHistory: string) => void;
    onClearHistory: () => void;
    onSpeakText: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
    translationHistory,
    onHistoryChange,
    onClearHistory,
    onSpeakText,
}) => {
    const charCount = translationHistory.length;

    return (
        <div className="flex-1 bg-white dark:bg-[#111113] p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col min-h-[240px]">
            <div className="flex-none flex justify-between items-center mb-3 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Akumulasi Terjemahan
                    </span>
                    <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {charCount} char
                    </span>
                </div>
                <button
                    onClick={onClearHistory}
                    disabled={!translationHistory}
                    className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Bersihkan Teks"
                    aria-label="Hapus Seluruh Teks"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Area Teks Terjemahan */}
            <div className="flex-1 bg-zinc-50 dark:bg-[#18181B] rounded-lg p-3 border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
                <textarea
                    value={translationHistory}
                    onChange={(e) => onHistoryChange(e.target.value)}
                    placeholder="Belum ada isyarat yang diterjemahkan..."
                    className="w-full h-full bg-transparent resize-none outline-none text-sm sm:text-base text-zinc-900 dark:text-zinc-100 font-mono leading-relaxed placeholder:text-zinc-400 dark:placeholder:text-zinc-600 placeholder:font-sans overflow-y-auto"
                />
            </div>

            {/* Tombol Sintesis Suara (TTS) */}
            <div className="flex-none mt-3">
                <button
                    onClick={onSpeakText}
                    disabled={!translationHistory.trim()}
                    className={`w-full py-2.5 px-4 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        translationHistory.trim()
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white cursor-pointer'
                            : 'bg-zinc-100 dark:bg-[#18181B] text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                    }`}
                >
                    <Volume2 className="w-4 h-4" />
                    <span>Bacakan Kalimat (TTS)</span>
                </button>
            </div>
        </div>
    );
};
