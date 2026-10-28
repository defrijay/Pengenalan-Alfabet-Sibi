/**
 * components/MetricsPanel.tsx
 * Panel metrik performa hardware (FPS, Latensi, Memori)
 * serta metrik spasial & lingkungan (Lux, Hand Scale, Buffer).
 */

import React from 'react';
import {
    Activity,
    Cpu,
    HardDrive,
    Zap,
    Sparkles,
    Sun,
    Focus,
    Layers,
} from 'lucide-react';
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
    const getConfidenceColor = (score: number) => {
        if (score === 0) return 'hidden';
        if (score > 0.8)
            return 'bg-emerald-500/90 text-white border-emerald-400/40 shadow-emerald-500/20';
        if (score > 0.5)
            return 'bg-amber-500/90 text-white border-amber-400/40 shadow-amber-500/20';
        return 'bg-rose-500/90 text-white border-rose-400/40 shadow-rose-500/20';
    };

    const getFpsColor = (fps: number) => {
        if (fps >= 25) return 'text-emerald-400';
        if (fps >= 18) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getScaleColor = (scale: string) => {
        if (scale === 'Ideal') return 'text-emerald-400';
        if (scale === 'Jauh' || scale === 'Dekat') return 'text-amber-400';
        return 'text-slate-500 dark:text-slate-500';
    };

    return (
        <div className="absolute top-2 left-2 sm:top-5 sm:left-5 flex flex-col gap-1.5 sm:gap-2.5 pointer-events-none z-20 w-auto max-w-[100px] sm:max-w-[180px]">
            {/* KELOMPOK 1: HARDWARE & PIPELINE PERF */}
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 text-white rounded-xl p-1.5 sm:p-3 shadow-2xl flex flex-col gap-0.5 sm:gap-1.5 transition-all duration-300 min-w-[90px] sm:min-w-[140px]">
                <div className="text-[6px] sm:text-[9px] text-slate-400 font-bold tracking-widest mb-0.5 border-b border-white/10 pb-0.5 sm:pb-1 flex items-center gap-1 sm:gap-1.5">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                    <span className="hidden sm:inline">PERFORMANCE</span>
                    <span className="sm:hidden">PERF</span>
                </div>
                <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                    <span className="text-slate-400 flex items-center">
                        <Activity className={`w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 ${getFpsColor(performance.fps)}`} /> FPS
                    </span>
                    <span className={`font-bold ${getFpsColor(performance.fps)}`}>
                        {isCameraActive ? performance.fps : '0'}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                    <span className="text-slate-400 flex items-center">
                        <Cpu className="w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-cyan-400" /> LAT
                    </span>
                    <span className="font-bold text-cyan-400">
                        {isCameraActive ? `${performance.latency}ms` : '0ms'}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                    <span className="text-slate-400 flex items-center">
                        <HardDrive className="w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-sky-400" /> MEM
                    </span>
                    <span className="font-bold text-sky-400">
                        {isCameraActive ? `${performance.memory}MB` : '0MB'}
                    </span>
                </div>
            </div>

            {/* KELOMPOK 2: SPATIAL & ENVIRONMENT */}
            <div className="bg-black/70 backdrop-blur-xl border border-white/10 text-white rounded-xl p-1.5 sm:p-3 shadow-2xl flex flex-col gap-0.5 sm:gap-1.5 transition-all duration-300 min-w-[90px] sm:min-w-[140px]">
                <div className="text-[6px] sm:text-[9px] text-slate-400 font-bold tracking-widest mb-0.5 border-b border-white/10 pb-0.5 sm:pb-1 flex items-center gap-1 sm:gap-1.5">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                    <span className="hidden sm:inline">SPATIAL & ENV</span>
                    <span className="sm:hidden">ENV</span>
                </div>
                <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                    <span className="text-slate-400 flex items-center">
                        <Sun className="w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-slate-400" /> LUX
                    </span>
                    <span className="font-bold text-slate-200">
                        {isCameraActive ? `${spatial.lux} lx` : '0 lx'}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                    <span className="text-slate-400 flex items-center">
                        <Focus className={`w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 ${getScaleColor(spatial.handScale)}`} /> SCALE
                    </span>
                    <span className={`font-bold ${getScaleColor(spatial.handScale)}`}>
                        {isCameraActive ? spatial.handScale : '-'}
                    </span>
                </div>
                <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                    <span className="text-slate-400 flex items-center">
                        <Layers className="w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-fuchsia-400" /> BUF
                    </span>
                    <span className="font-bold text-fuchsia-400">
                        {isCameraActive ? `${spatial.frameBuffer}/30` : '0/30'}
                    </span>
                </div>
            </div>

            {/* CONFIDENCE SCORE BADGE */}
            {isCameraActive && currentSign !== 'Menunggu...' && (
                <div
                    className={`text-[7px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-lg shadow-lg backdrop-blur-md flex items-center justify-between border w-full ${getConfidenceColor(
                        confidence
                    )} mt-0.5`}
                >
                    <span className="flex items-center gap-0.5 sm:gap-1.5">
                        <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/70 animate-pulse"></span>
                        <span className="hidden sm:inline">CONFIDENCE</span>
                        <span className="sm:hidden">CONF</span>
                    </span>
                    <span>{(confidence * 100).toFixed(0)}%</span>
                </div>
            )}
        </div>
    );
};
