/**
 * components/CameraFeed.tsx
 * Bingkai viewfinder teknis kamera webcam beserta marka ROI (Posisi Badan & Area Isyarat)
 * dan HUD telemetri Computer Vision.
 */

import React from 'react';
import { CameraOff, Hand, User } from 'lucide-react';
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
        <div className="relative aspect-video bg-[#09090B] rounded-xl overflow-hidden flex items-center justify-center w-full border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex-1 bg-tech-grid">
            {isCameraActive ? (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover transform scale-x-[-1]"
                    autoPlay
                    playsInline
                    muted
                />
            ) : (
                <div className="text-center flex flex-col items-center px-4">
                    <div className="w-14 h-14 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
                        <CameraOff className="w-6 h-6 text-zinc-500 stroke-[1.5]" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300 tracking-tight">
                        Viewfinder Kamera Nonaktif
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">
                        Klik tombol &quot;Mulai Kamera&quot; di bawah untuk mengaktifkan akuisisi 21-landmark MediaPipe
                    </p>
                </div>
            )}

            {/* Overlay Dua Kotak ROI Teknis (Posisi Badan & Area Isyarat Tangan) */}
            {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-row items-center justify-center p-3 sm:p-8 z-10 gap-3 sm:gap-10">
                    {/* ROI Kiri: Posisi Badan */}
                    <div className="w-[45%] sm:w-[54%] h-[80%] sm:h-[88%] border border-dashed border-zinc-400/40 rounded-lg flex flex-col items-center justify-center relative bg-zinc-950/10">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-zinc-300/70 rounded-tl-md" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-zinc-300/70 rounded-tr-md" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-zinc-300/70 rounded-bl-md" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-zinc-300/70 rounded-br-md" />

                        <div className="flex flex-col items-center opacity-75">
                            <User className="w-5 h-5 sm:w-8 sm:h-8 text-zinc-300 mb-1.5" strokeWidth={1.5} />
                            <span className="bg-zinc-950/85 text-zinc-300 text-[9px] sm:text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded border border-zinc-800">
                                ROI: Posisi Badan
                            </span>
                        </div>
                    </div>

                    {/* ROI Kanan: Area Isyarat Tangan */}
                    <div
                        className={`w-[40%] sm:w-[38%] h-[80%] sm:h-[88%] border border-dashed rounded-lg flex flex-col items-center justify-center relative transition-colors duration-200 ${
                            isHandInArea
                                ? 'border-emerald-400 bg-emerald-950/20'
                                : 'border-zinc-400/40 bg-zinc-950/10'
                        }`}
                    >
                        <div
                            className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-md ${
                                isHandInArea ? 'border-emerald-400' : 'border-zinc-300/70'
                            }`}
                        />
                        <div
                            className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-md ${
                                isHandInArea ? 'border-emerald-400' : 'border-zinc-300/70'
                            }`}
                        />
                        <div
                            className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-md ${
                                isHandInArea ? 'border-emerald-400' : 'border-zinc-300/70'
                            }`}
                        />
                        <div
                            className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-md ${
                                isHandInArea ? 'border-emerald-400' : 'border-zinc-300/70'
                            }`}
                        />

                        <Hand
                            className={`w-6 h-6 sm:w-10 sm:h-10 mb-1.5 transition-colors ${
                                isHandInArea ? 'text-emerald-400' : 'text-zinc-400'
                            }`}
                            strokeWidth={1.5}
                        />

                        <span
                            className={`text-[9px] sm:text-[11px] px-2.5 py-1 rounded font-mono uppercase tracking-wider border ${
                                isHandInArea
                                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                                    : 'bg-zinc-950/85 text-zinc-300 border-zinc-800'
                            }`}
                        >
                            {isHandInArea ? 'ROI: Tangan Terkunci' : 'ROI: Area Isyarat'}
                        </span>
                    </div>
                </div>
            )}

            {/* HUD Telemetri Kiri Atas */}
            <MetricsPanel
                isCameraActive={isCameraActive}
                currentSign={currentSign}
                confidence={confidence}
                performance={performance}
                spatial={spatial}
            />

            {/* Status Akuisisi Kanan Bawah */}
            {isCameraActive && (
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex items-center gap-2 bg-zinc-950/85 px-2.5 py-1 rounded-md border border-zinc-800">
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            isHandInArea ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                        }`}
                    />
                    <span className="text-[10px] text-zinc-300 font-mono uppercase tracking-wider">
                        {isHandInArea ? 'TRACKING: LOCKED' : 'TRACKING: SEARCHING'}
                    </span>
                </div>
            )}
        </div>
    );
};
