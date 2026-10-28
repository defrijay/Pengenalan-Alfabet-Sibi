/**
 * components/QuickControls.tsx
 * Tombol kontrol utama untuk menyalakan atau mematikan kamera webcam.
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
        <div className="flex-none flex flex-row justify-center gap-3 sm:gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 transition-colors duration-300">
            <button
                onClick={onToggleCamera}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all shadow-md flex items-center cursor-pointer ${
                    isCameraActive
                        ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/30 hover:shadow-rose-500/10'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg shadow-blue-500/25 transform hover:-translate-y-0.5'
                }`}
            >
                {isCameraActive ? (
                    <CameraOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                ) : (
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                )}
                {isCameraActive ? 'Matikan Kamera' : 'Mulai Kamera'}
            </button>
        </div>
    );
};
