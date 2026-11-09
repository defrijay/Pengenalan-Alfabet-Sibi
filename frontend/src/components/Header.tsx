/**
 * components/Header.tsx
 * Top-bar instrumen teknis untuk navigasi modul aplikasi, indikator status kamera,
 * dan pengalih tema (Light / Dark Mode) bergaya bersih (Linear / Vercel Geist).
 */

import React from 'react';
import { Hand, Sun, Moon, Video, BarChart3, Cpu } from 'lucide-react';

export type ActiveTabType = 'translator' | 'monitoring' | 'iot';

interface HeaderProps {
    isCameraActive: boolean;
    isDarkMode: boolean;
    onToggleDarkMode: () => void;
    activeTab: ActiveTabType;
    onTabChange: (tab: ActiveTabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
    isCameraActive,
    isDarkMode,
    onToggleDarkMode,
    activeTab,
    onTabChange,
}) => {
    return (
        <header className="flex-none flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-[#111113] px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] gap-3 md:gap-4">
            {/* Identitas Sistem */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center border border-zinc-800 dark:border-zinc-200 shrink-0">
                    <Hand className="w-4 h-4 text-zinc-100 dark:text-zinc-900" strokeWidth={2} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            SIBI Translator
                        </h1>
                        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80">
                            S-GCN v2.4
                        </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal tracking-tight">
                        MediaPipe 21-Landmark Spatial Graph Convolutional Network &amp; ESP32 Telemetry
                    </p>
                </div>
            </div>

            {/* Kontrol Navigasi & Status */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                {/* Segmented Control Tabs */}
                <nav
                    aria-label="Navigasi Modul"
                    className="flex flex-wrap items-center bg-zinc-100/90 dark:bg-[#18181B] p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 gap-0.5"
                >
                    <button
                        onClick={() => onTabChange('translator')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === 'translator'
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-zinc-200/60 dark:border-zinc-700/80'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Video className="w-3.5 h-3.5" />
                        <span>Translasi Live</span>
                    </button>
                    <button
                        onClick={() => onTabChange('monitoring')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === 'monitoring'
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-zinc-200/60 dark:border-zinc-700/80'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Log &amp; Uji Cloud</span>
                    </button>
                    <button
                        onClick={() => onTabChange('iot')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            activeTab === 'iot'
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-zinc-200/60 dark:border-zinc-700/80'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Log &amp; Uji Modul IoT</span>
                    </button>
                </nav>

                <div className="flex items-center gap-2">
                    {/* Indikator Status Kamera Minimalis */}
                    <div
                        className={`hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-medium border ${
                            isCameraActive
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-zinc-100/80 dark:bg-[#18181B] text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                        }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-600'
                            }`}
                        />
                        {isCameraActive ? 'CAM:ONLINE' : 'CAM:STANDBY'}
                    </div>

                    {/* Tombol Ganti Tema Ikon Tunggal Bersih */}
                    <button
                        onClick={onToggleDarkMode}
                        aria-label="Ganti Tema Terang / Gelap"
                        title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-zinc-100/80 dark:bg-[#18181B] hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                    >
                        {isDarkMode ? (
                            <Sun className="w-4 h-4 text-zinc-200" />
                        ) : (
                            <Moon className="w-4 h-4 text-zinc-700" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};
