/**
 * hooks/useCamera.ts
 * Custom hook untuk mengelola siklus hidup MediaStream WebRTC kamera (webcam).
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCameraReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isCameraActive: boolean;
    toggleCamera: () => void;
    error: string | null;
}

export function useCamera(): UseCameraReturn {
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const toggleCamera = useCallback(() => {
        setIsCameraActive((prev) => !prev);
    }, []);

    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            setError(null);
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        facingMode: 'user',
                    },
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Gagal mengakses kamera:', err);
                setError('Tidak dapat mengakses webcam. Pastikan izin kamera telah diberikan.');
                setIsCameraActive(false);
            }
        };

        const stopCamera = () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const mediaStream = videoRef.current.srcObject as MediaStream;
                mediaStream.getTracks().forEach((track) => track.stop());
                videoRef.current.srcObject = null;
            }
        };

        if (isCameraActive) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isCameraActive]);

    return {
        videoRef,
        isCameraActive,
        toggleCamera,
        error,
    };
}
