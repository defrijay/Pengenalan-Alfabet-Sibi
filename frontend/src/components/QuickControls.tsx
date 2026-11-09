/**
 * components/QuickControls.tsx
 * Bar kontrol kamera dengan tombol aksi kontras tinggi tanpa gradasi berlebihan.
 */

import React from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface QuickControlsProps {
    isCameraActive: boolean;
    onToggleCamera: () => void;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
    isCameraActive,
    onToggleCamera,
}) => {
    return (
        <div className="flex-none flex flex-row items-center justify-between bg-white dark:bg-[#111113] px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Pipeline:
                </span>
                <span>MediaPipe Hands (21 Nodes) → S-GCN Classifier</span>
            </div>

            <button
                onClick={onToggleCamera}
                className={`w-full sm:w-auto px-5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isCameraActive
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/70 hover:bg-rose-100 dark:hover:bg-rose-950/60'
                        : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white'
                }`}
            >
                {isCameraActive ? (
                    <CameraOff className="w-4 h-4" />
                ) : (
                    <Camera className="w-4 h-4" />
                )}
                <span>{isCameraActive ? 'Matikan Kamera' : 'Mulai Kamera'}</span>
            </button>
        </div>
    );
};
