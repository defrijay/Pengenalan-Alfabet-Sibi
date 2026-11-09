/**
 * App.tsx
 * Komponen utama (Root Orchestrator) aplikasi SIBI Translator.
 * Menghubungkan modul kamera, pipeline deteksi landmark MediaPipe,
 * antarmuka analitik performa, inferensi cloud 3DGCN, dan sintesis audio TTS.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header, type ActiveTabType } from './components/Header';
import { CameraFeed } from './components/CameraFeed';
import { QuickControls } from './components/QuickControls';
import { TranslationCard } from './components/TranslationCard';
import { HistoryCard } from './components/HistoryCard';
import { CloudMonitoringView } from './components/CloudMonitoringView';
import { IoTTestingView } from './components/IoTTestingView';
import { useCamera } from './hooks/useCamera';
import { useMediaPipeHands } from './hooks/useMediaPipeHands';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { startSessionApi, endSessionApi, predictSignApi } from './services/api';
import type { PerformanceMetrics, SpatialMetrics } from './types';

export const App: React.FC = () => {
    // -------------------------------------------------------------------------
    // 1. State Tema & UI
    // -------------------------------------------------------------------------
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [activeTab, setActiveTab] = useState<ActiveTabType>('translator');
    const [currentSign, setCurrentSign] = useState<string>('Menunggu...');
    const [translationHistory, setTranslationHistory] = useState<string>('');
    const [confidence, setConfidence] = useState<number>(0.85);

    // -------------------------------------------------------------------------
    // 2. State Metrik Monitoring (Hardware & Spasial Lingkungan)
    // -------------------------------------------------------------------------
    const [performance, setPerformance] = useState<PerformanceMetrics>({
        fps: 30,
        latency: 45,
        memory: 120,
    });
    const [spatial, setSpatial] = useState<SpatialMetrics>({
        lux: 450,
        handScale: '-',
        frameBuffer: 0,
    });

    // -------------------------------------------------------------------------
    // 3. Custom Hooks (Kamera, MediaPipe, Audio TTS)
    // -------------------------------------------------------------------------
    const { videoRef, isCameraActive, toggleCamera } = useCamera();
    const { isHandInArea, handScale, activeLandmarksRef } = useMediaPipeHands({
        isCameraActive,
        videoRef,
    });
    const { speak } = useSpeechSynthesis();

    // -------------------------------------------------------------------------
    // 4. Session & Inference Management
    // -------------------------------------------------------------------------
    const [sessionId, setSessionId] = useState<string | null>(null);
    const isPredictingRef = useRef<boolean>(false);

    // Sinkronisasi status handScale dari hook ke state spatial
    useEffect(() => {
        setSpatial((prev) => ({ ...prev, handScale }));
    }, [handScale]);

    // Memulai / mengakhiri sesi backend saat kamera aktif/nonaktif
    useEffect(() => {
        let isCancelled = false;

        if (isCameraActive) {
            startSessionApi()
                .then((data) => {
                    if (!isCancelled) setSessionId(data.session_id);
                })
                .catch((err) => {
                    console.error('Gagal memulai sesi di server, memakai session ID lokal:', err);
                    if (!isCancelled) setSessionId(crypto.randomUUID());
                });
        } else if (sessionId) {
            endSessionApi(sessionId).catch((err) => console.error('Gagal mengakhiri sesi:', err));
            setSessionId(null);
        }

        return () => {
            isCancelled = true;
        };
    }, [isCameraActive]);

    // Fungsi pengiriman inferensi ke backend
    const triggerInference = async () => {
        if (!sessionId || !activeLandmarksRef.current || isPredictingRef.current) return;

        isPredictingRef.current = true;
        const reqStart = window.performance.now();
        try {
            const data = await predictSignApi({
                session_id: sessionId,
                landmarks: activeLandmarksRef.current,
                fps: performance.fps,
                latency_ms: performance.latency,
                memory_mb: performance.memory,
                lux: spatial.lux,
                hand_scale: spatial.handScale,
            });
            const rttMs = Math.max(1, Math.round(window.performance.now() - reqStart));

            setCurrentSign(data.predicted_class);
            setConfidence(data.confidence);
            setTranslationHistory((prev) => prev + data.predicted_class);
            setPerformance((prev) => ({
                ...prev,
                latency: rttMs,
                memory: data.server_memory_mb ? Math.round(data.server_memory_mb) : prev.memory,
            }));
        } catch (err) {
            console.error('Inference error:', err);
        } finally {
            isPredictingRef.current = false;
        }
    };

    // -------------------------------------------------------------------------
    // 5. Loop Interval: Simulasi Metrik Lingkungan & Akumulasi Frame Buffer
    // -------------------------------------------------------------------------
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isCameraActive) {
            interval = setInterval(() => {
                setPerformance({
                    fps: Math.floor(Math.random() * (31 - 24) + 24),
                    latency: Math.floor(Math.random() * (55 - 38) + 38),
                    memory: Math.floor(Math.random() * (132 - 118) + 118),
                });

                setSpatial((prev) => {
                    const newLux = Math.floor(Math.random() * (520 - 410) + 410);

                    if (isHandInArea) {
                        const nextBuffer = prev.frameBuffer + Math.floor(Math.random() * 8 + 4);
                        if (nextBuffer >= 30) {
                            triggerInference();
                            return { ...prev, lux: newLux, frameBuffer: 0 };
                        }
                        return { ...prev, lux: newLux, frameBuffer: nextBuffer };
                    } else {
                        setCurrentSign('Menunggu...');
                        setConfidence(0);
                        return { ...prev, lux: newLux, frameBuffer: 0 };
                    }
                });
            }, 1000);
        } else {
            setCurrentSign('Menunggu...');
            setSpatial((prev) => ({ ...prev, frameBuffer: 0 }));
        }

        return () => clearInterval(interval);
    }, [isCameraActive, isHandInArea, sessionId]);

    // -------------------------------------------------------------------------
    // 6. Render Tampilan
    // -------------------------------------------------------------------------
    return (
        <div className={`${isDarkMode ? 'dark' : ''} min-h-screen w-full`}>
            <div className="min-h-screen w-full bg-[#F8F9FA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 font-sans flex flex-col overflow-x-hidden transition-colors duration-200">
                <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col flex-grow gap-4 sm:gap-5">
                    {/* Header Navigasi Instrumen */}
                    <Header
                        isCameraActive={isCameraActive}
                        isDarkMode={isDarkMode}
                        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    {/* Main Layout: Tab Translasi Live vs Tab Monitoring Pengujian Cloud vs Tab Modul IoT */}
                    {activeTab === 'translator' ? (
                        <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                            {/* Sisi Kiri: Video Feed & Kontrol Kamera (8/12 kolom) */}
                            <section className="lg:col-span-8 xl:col-span-9 flex flex-col gap-3 sm:gap-4 h-full">
                                <CameraFeed
                                    videoRef={videoRef}
                                    isCameraActive={isCameraActive}
                                    isHandInArea={isHandInArea}
                                    currentSign={currentSign}
                                    confidence={confidence}
                                    performance={performance}
                                    spatial={spatial}
                                />
                                <QuickControls
                                    isCameraActive={isCameraActive}
                                    onToggleCamera={toggleCamera}
                                />
                            </section>

                            {/* Sisi Kanan: Hasil Deteksi & Riwayat Kalimat (4/12 kolom) */}
                            <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 h-full">
                                <TranslationCard
                                    currentSign={currentSign}
                                    confidence={confidence}
                                    isHandInArea={isHandInArea}
                                    isCameraActive={isCameraActive}
                                />
                                <HistoryCard
                                    translationHistory={translationHistory}
                                    onHistoryChange={setTranslationHistory}
                                    onClearHistory={() => setTranslationHistory('')}
                                    onSpeakText={() => speak(translationHistory)}
                                />
                            </aside>
                        </main>
                    ) : activeTab === 'monitoring' ? (
                        <main className="flex-grow flex flex-col">
                            <CloudMonitoringView currentSessionId={sessionId} />
                        </main>
                    ) : (
                        <main className="flex-grow flex flex-col">
                            <IoTTestingView />
                        </main>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
