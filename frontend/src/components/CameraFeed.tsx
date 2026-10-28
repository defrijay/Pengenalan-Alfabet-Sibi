/**
 * components/CameraFeed.tsx
 * Tampilan video webcam beserta overlay Target Area (ROI Isyarat dan Posisi Badan),
 * serta placeholder visual ketika kamera sedang tidak aktif.
 */

import React from 'react';
import { CameraOff, Eye, Hand, User } from 'lucide-react';
import { MetricsPanel } from './MetricsPanel';
import type { PerformanceMetrics, SpatialMetrics } from '../types';

interface CameraFeedProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isCameraActive: boolean;
    isHandInArea: boolean;
    currentSign: string;
    confidence: number;
    performance: PerformanceMetrics;
    spatial: SpatialMetrics;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
    videoRef,
    isCameraActive,
    isHandInArea,
    currentSign,
    confidence,
    performance,
    spatial,
}) => {
    return (
        <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center w-full border border-slate-700/50 dark:border-slate-700/60 transition-colors flex-1">
            {isCameraActive ? (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform scale-x-[-1]"
                    autoPlay
                    playsInline
                    muted
                />
            ) : (
                <div className="text-center text-slate-500 dark:text-slate-500 flex flex-col items-center transition-colors">
                    <div className="relative">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-800/50 dark:bg-slate-800/50 flex items-center justify-center border-2 border-slate-700/50">
                            <CameraOff className="w-12 h-12 sm:w-16 sm:h-16 opacity-40 stroke-[1.5]" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center">
                            <Eye className="w-3 h-3 text-slate-400" />
                        </div>
                    </div>
                    <p className="text-lg sm:text-xl font-medium tracking-wide mt-4 text-slate-400">
                        Kamera Nonaktif
                    </p>
                    <p className="text-sm mt-1 opacity-50">
                        Klik &quot;Mulai Kamera&quot; untuk memulai translasi
                    </p>
                </div>
            )}

            {/* Overlay Dua Placeholder Target Area */}
            {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-row items-center justify-center p-2 sm:p-8 z-10 gap-2 sm:gap-12">
                    {/* Kotak Kiri: Area Wajah & Badan */}
                    <div className="w-[45%] sm:w-[55%] h-[80%] sm:h-[90%] border-2 border-dashed border-blue-400/30 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center relative transition-all duration-700 bg-blue-500/5 backdrop-blur-[2px]">
                        <div className="absolute top-0 left-0 w-4 sm:w-8 h-4 sm:h-8 border-t-2 sm:border-t-3 border-l-2 sm:border-l-3 border-blue-400/40 rounded-tl-2xl sm:rounded-tl-3xl"></div>
                        <div className="absolute top-0 right-0 w-4 sm:w-8 h-4 sm:h-8 border-t-2 sm:border-t-3 border-r-2 sm:border-r-3 border-blue-400/40 rounded-tr-2xl sm:rounded-tr-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-4 sm:w-8 h-4 sm:h-8 border-b-2 sm:border-b-3 border-l-2 sm:border-l-3 border-blue-400/40 rounded-bl-2xl sm:rounded-bl-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-4 sm:w-8 h-4 sm:h-8 border-b-2 sm:border-b-3 border-r-2 sm:border-r-3 border-blue-400/40 rounded-br-2xl sm:rounded-br-3xl"></div>

                        <div className="flex flex-col items-center opacity-60">
                            <User className="w-5 h-5 sm:w-10 sm:h-10 text-blue-300/70 mb-1 sm:mb-2" strokeWidth={1.5} />
                            <span className="bg-black/60 backdrop-blur-md text-blue-300/80 text-[8px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold shadow-lg text-center border border-blue-400/20 whitespace-nowrap">
                                Posisi Badan
                            </span>
                        </div>
                    </div>

                    {/* Kotak Kanan: Area Isyarat Tangan */}
                    <div
                        className={`w-[40%] sm:w-[38%] h-[80%] sm:h-[90%] border-2 border-dashed rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center relative transition-all duration-500 ${
                            isHandInArea
                                ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_40px_rgba(52,211,153,0.25)] scale-[1.02]'
                                : 'border-emerald-400/30 animate-[pulse_3s_ease-in-out_infinite]'
                        }`}
                    >
                        <div
                            className={`absolute top-0 left-0 w-4 sm:w-8 h-4 sm:h-8 border-t-2 sm:border-t-3 border-l-2 sm:border-l-3 rounded-tl-2xl sm:rounded-tl-3xl transition-colors duration-500 ${
                                isHandInArea ? 'border-emerald-300' : 'border-emerald-400/40'
                            }`}
                        ></div>
                        <div
                            className={`absolute top-0 right-0 w-4 sm:w-8 h-4 sm:h-8 border-t-2 sm:border-t-3 border-r-2 sm:border-r-3 rounded-tr-2xl sm:rounded-tr-3xl transition-colors duration-500 ${
                                isHandInArea ? 'border-emerald-300' : 'border-emerald-400/40'
                            }`}
                        ></div>
                        <div
                            className={`absolute bottom-0 left-0 w-4 sm:w-8 h-4 sm:h-8 border-b-2 sm:border-b-3 border-l-2 sm:border-l-3 rounded-bl-2xl sm:rounded-bl-3xl transition-colors duration-500 ${
                                isHandInArea ? 'border-emerald-300' : 'border-emerald-400/40'
                            }`}
                        ></div>
                        <div
                            className={`absolute bottom-0 right-0 w-4 sm:w-8 h-4 sm:h-8 border-b-2 sm:border-b-3 border-r-2 sm:border-r-3 rounded-br-2xl sm:rounded-br-3xl transition-colors duration-500 ${
                                isHandInArea ? 'border-emerald-300' : 'border-emerald-400/40'
                            }`}
                        ></div>

                        <Hand
                            className={`w-8 h-8 sm:w-16 sm:h-16 mb-1 sm:mb-3 transition-all duration-500 ${
                                isHandInArea
                                    ? 'text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-110'
                                    : 'text-emerald-400/60 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                            }`}
                            strokeWidth={1.5}
                        />

                        <span
                            className={`backdrop-blur-sm text-[7px] sm:text-[10px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium tracking-wide text-center transition-all duration-500 whitespace-nowrap ${
                                isHandInArea
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 border border-emerald-400/30'
                                    : 'bg-black/60 text-emerald-300/80 border border-emerald-400/20'
                            }`}
                        >
                            {isHandInArea ? '✓ Tangan Terdeteksi' : 'Area Isyarat'}
                        </span>

                        {isHandInArea && (
                            <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-3 sm:w-5 h-3 sm:h-5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                        )}
                    </div>
                </div>
            )}

            {/* Dashboard Analitik Kiri Atas */}
            <MetricsPanel
                isCameraActive={isCameraActive}
                currentSign={currentSign}
                confidence={confidence}
                performance={performance}
                spatial={spatial}
            />

            {/* Indikator Status Kanan Bawah */}
            {isCameraActive && (
                <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            isHandInArea ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                    ></span>
                    <span className="text-[9px] sm:text-[10px] text-slate-300 font-mono font-medium">
                        {isHandInArea ? 'HAND DETECTED' : 'SCANNING...'}
                    </span>
                </div>
            )}
        </div>
    );
};
