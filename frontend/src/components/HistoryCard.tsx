/**
 * components/HistoryCard.tsx
 * Kartu perangkaian kalimat hasil akumulasi deteksi alfabet SIBI.
 * Menyediakan fitur penghapusan riwayat dan Text-to-Speech (TTS) suara lokal.
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
    return (
        <div className="flex-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col min-h-0 transition-colors duration-300">
            <div className="flex-none flex justify-between items-center mb-2 sm:mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2.5 transition-colors">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span className="inline-block w-1 h-1 rounded-full bg-blue-400"></span>
                    Kalimat Terjemahan
                </p>
                <button
                    onClick={onClearHistory}
                    className="p-1.5 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    title="Hapus Teks"
                    aria-label="Hapus Seluruh Teks"
                >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
            </div>

            {/* Container textarea teks terjemahan */}
            <div className="flex-1 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700/30 shadow-inner transition-colors duration-300 overflow-hidden">
                <textarea
                    value={translationHistory}
                    onChange={(e) => onHistoryChange(e.target.value)}
                    placeholder="Belum ada isyarat yang diterjemahkan..."
                    className="w-full h-full bg-transparent resize-none outline-none text-base sm:text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-normal placeholder:italic placeholder:text-xs sm:placeholder:text-sm transition-colors overflow-y-auto"
                />
            </div>

            {/* Tombol Bacakan Teks (Text-to-Speech) */}
            <div className="flex-none mt-3 pt-1">
                <button
                    onClick={onSpeakText}
                    disabled={!translationHistory.trim()}
                    className={`w-full py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center shadow-md ${
                        translationHistory.trim()
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/25 cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                    }`}
                >
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Bacakan Teks
                </button>
            </div>
        </div>
    );
};
