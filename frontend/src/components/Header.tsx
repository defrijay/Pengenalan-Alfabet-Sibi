/**
 * components/Header.tsx
 * Bagian navigasi dan header aplikasi, memuat judul sistem, indikator status online,
 * dan tombol pengganti tema (Dark / Light Mode).
 */

import React from 'react';
import { Hand, Sun, Moon } from 'lucide-react';

interface HeaderProps {
    isCameraActive: boolean;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    isCameraActive,
    isDarkMode,
    onToggleDarkMode,
}) => {
    return (
        <header className="flex-none flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 gap-4 sm:gap-0 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 items-center justify-center shadow-lg shadow-blue-500/25">
                    <Hand className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-600 dark:from-blue-400 dark:via-sky-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        SIBI Translator
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Real-time 3DGCN Pipeline & Dual-Interface IoT
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Status Badge */}
                <div
                    className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isCameraActive
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                    }`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                        }`}
                    ></span>
                    {isCameraActive ? 'Online' : 'Offline'}
                </div>

                {/* Dark Mode Toggle */}
                <button
                    onClick={onToggleDarkMode}
                    aria-label="Toggle Dark Mode"
                    className={`relative inline-flex items-center h-9 w-16 cursor-pointer rounded-full transition-all duration-300 ease-in-out border-2 shadow-md ${
                        isDarkMode
                            ? 'border-blue-400/50 bg-blue-900/60 hover:border-blue-400/80'
                            : 'border-amber-300/50 bg-amber-100/80 hover:border-amber-400/80'
                    }`}
                >
                    <Sun
                        className={`absolute left-1.5 w-4 h-4 text-amber-500 transition-all duration-300 ${
                            isDarkMode ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                        }`}
                    />
                    <Moon
                        className={`absolute right-1.5 w-4 h-4 text-blue-300 transition-all duration-300 ${
                            isDarkMode ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                        }`}
                    />
                    <span
                        className={`inline-flex items-center justify-center w-7 h-7 transform bg-white dark:bg-slate-800 rounded-full shadow-lg transition-all duration-300 ease-in-out z-10 ${
                            isDarkMode
                                ? 'translate-x-8 ring-2 ring-blue-400/30'
                                : 'translate-x-0 ring-2 ring-amber-400/30'
                        }`}
                    >
                        {isDarkMode ? (
                            <Moon className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                        )}
                    </span>
                </button>
            </div>
        </header>
    );
};
