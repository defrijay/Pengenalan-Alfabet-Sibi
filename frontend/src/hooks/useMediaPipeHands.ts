/**
 * hooks/useMediaPipeHands.ts
 * Custom hook untuk mengintegrasikan library MediaPipe Hands,
 * mendeteksi 21 koordinat sendi tangan, mengukur jarak relatif (hand scale),
 * dan memvalidasi apakah tangan berada di dalam Target Area (ROI Isyarat).
 */

import { useState, useEffect, useRef } from 'react';
import type { Landmark, HandScaleType } from '../types';

interface UseMediaPipeHandsProps {
    isCameraActive: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useMediaPipeHands({ isCameraActive, videoRef }: UseMediaPipeHandsProps) {
    const [isHandInArea, setIsHandInArea] = useState<boolean>(false);
    const [handScale, setHandScale] = useState<HandScaleType>('-');
    const activeLandmarksRef = useRef<Landmark[] | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        let isProcessing = false;

        const Hands = (window as any).Hands;
        if (!Hands) {
            console.error('MediaPipe Hands script belum dimuat. Pastikan index.html memuat hands.js');
            return;
        }

        const hands = new Hands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 0,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
            let isInsideTargetArea = false;
            let currentScale: HandScaleType = '-';

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                for (const landmarks of results.multiHandLandmarks) {
                    const palmCenter = landmarks[9]; // Pangkal jari tengah
                    const wrist = landmarks[0];      // Pergelangan tangan

                    // ROI Area Isyarat (koordinat normalisasi 0.0 s.d. 1.0)
                    const isXInArea = palmCenter.x >= 0.0 && palmCenter.x <= 0.45;
                    const isYInArea = palmCenter.y >= 0.20 && palmCenter.y <= 0.80;

                    if (isXInArea && isYInArea) {
                        isInsideTargetArea = true;

                        // Estimasi jarak tangan ke kamera dari panjang telapak tangan
                        const distance = Math.sqrt(
                            Math.pow(palmCenter.x - wrist.x, 2) + Math.pow(palmCenter.y - wrist.y, 2)
                        );

                        if (distance < 0.12) {
                            currentScale = 'Jauh';
                        } else if (distance > 0.35) {
                            currentScale = 'Dekat';
                        } else {
                            currentScale = 'Ideal';
                        }

                        // Simpan 21 landmark berdimensi (x, y, z) untuk dikirim ke backend GCN
                        activeLandmarksRef.current = landmarks.map((lm: any) => ({
                            x: lm.x,
                            y: lm.y,
                            z: lm.z,
                        }));
                        break;
                    }
                }
            }

            setIsHandInArea(isInsideTargetArea);
            if (isInsideTargetArea) {
                setHandScale(currentScale);
            } else {
                setHandScale('-');
            }
        });

        const detectFrame = async () => {
            if (isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
                if (!isProcessing) {
                    isProcessing = true;
                    try {
                        await hands.send({ image: videoRef.current });
                    } catch (error) {
                        console.error('Error saat MediaPipe memproses video frame:', error);
                    }
                    isProcessing = false;
                }
            }
            animationFrameId = requestAnimationFrame(detectFrame);
        };

        if (isCameraActive) {
            detectFrame();
        } else {
            setIsHandInArea(false);
            setHandScale('-');
            activeLandmarksRef.current = null;
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            hands.close();
        };
    }, [isCameraActive, videoRef]);

    return {
        isHandInArea,
        handScale,
        activeLandmarksRef,
    };
}
