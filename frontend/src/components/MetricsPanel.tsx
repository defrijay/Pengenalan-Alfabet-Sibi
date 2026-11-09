/**
 * components/MetricsPanel.tsx
 * HUD (Heads-Up Display) telemetri teknis di atas viewfinder kamera.
 * Menampilkan FPS, Latensi, Memori, Lux, Skala Jarak, dan Buffer dalam format tabular-nums.
 */

import React from 'react';
import type { PerformanceMetrics, SpatialMetrics } from '../types';

interface MetricsPanelProps {
    isCameraActive: boolean;
    currentSign: string;
    confidence: number;
    performance: PerformanceMetrics;
    spatial: SpatialMetrics;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
    isCameraActive,
    currentSign,
    confidence,
    performance,
    spatial,
}) => {
    const getFpsColor = (fps: number) => {
        if (!isCameraActive) return 'text-zinc-500';
        if (fps >= 25) return 'text-emerald-400';
        if (fps >= 18) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getScaleColor = (scale: string) => {
        if (!isCameraActive) return 'text-zinc-500';
        if (scale === 'Ideal') return 'text-emerald-400';
        if (scale === 'Jauh' || scale === 'Dekat') return 'text-amber-400';
        return 'text-zinc-400';
    };

    return (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-none flex flex-col gap-1.5">
            {/* Baris HUD Telemetri Utama */}
            <div className="bg-zinc-950/85 border border-zinc-800 rounded-md px-2.5 py-1.5 text-[11px] font-mono tabular-nums text-zinc-200 flex flex-wrap items-center divide-x divide-zinc-800 shadow-sm">
                <div className="pr-2.5 flex items-center gap-1.5">
                    <span className="text-zinc-500 uppercase text-[10px]">FPS</span>
                    <span className={`font-semibold ${getFpsColor(performance.fps)}`}>
                        {isCameraActive ? performance.fps : 0}
                    </span>
                </div>
                <div className="px-2.5 flex items-center gap-1.5">
                    <span className="text-zinc-500 uppercase text-[10px]">LAT</span>
                    <span className="font-semibold text-zinc-200">
                        {isCameraActive ? `${performance.latency}ms` : '0ms'}
                    </span>
                </div>
                <div className="px-2.5 hidden sm:flex items-center gap-1.5">
                    <span className="text-zinc-500 uppercase text-[10px]">RAM</span>
                    <span className="font-semibold text-zinc-300">
                        {isCameraActive ? `${performance.memory}MB` : '0MB'}
                    </span>
                </div>
                <div className="px-2.5 flex items-center gap-1.5">
                    <span className="text-zinc-500 uppercase text-[10px]">LUX</span>
                    <span className="font-semibold text-zinc-200">
                        {isCameraActive ? `${spatial.lux}` : '0'}
                    </span>
                </div>
                <div className="px-2.5 flex items-center gap-1.5">
                    <span className="text-zinc-500 uppercase text-[10px]">DIST</span>
                    <span className={`font-semibold ${getScaleColor(spatial.handScale)}`}>
                        {isCameraActive ? spatial.handScale : '-'}
                    </span>
                </div>
                <div className="pl-2.5 flex items-center gap-1.5">
                    <span className="text-zinc-500 uppercase text-[10px]">BUF</span>
                    <span className="font-semibold text-zinc-300">
                        {isCameraActive ? `${spatial.frameBuffer}/30` : '0/30'}
                    </span>
                </div>
            </div>

            {/* Badge Confidence saat huruf terdeteksi */}
            {isCameraActive && currentSign !== 'Menunggu...' && confidence > 0 && (
                <div className="inline-flex items-center gap-2 self-start bg-zinc-950/85 border border-zinc-800 rounded-md px-2.5 py-1 text-[11px] font-mono tabular-nums">
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${
                            confidence >= 0.75 ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                    />
                    <span className="text-zinc-400 text-[10px] uppercase">CONFIDENCE</span>
                    <span
                        className={`font-semibold ${
                            confidence >= 0.75 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                    >
                        {(confidence * 100).toFixed(1)}%
                    </span>
                </div>
            )}
        </div>
    );
};
