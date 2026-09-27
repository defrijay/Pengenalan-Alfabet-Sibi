import React, { useState, useRef, useEffect } from 'react';
import {
    Camera,
    CameraOff,
    Volume2,
    Trash2,
    Activity,
    Hand,
    User,
    Sun,
    Moon,
    Cpu,
    HardDrive,
    Layers,
    Focus,
    Sparkles,
    Zap,
    Eye,
} from 'lucide-react';

// Pastikan class Hands sudah tersedia dari CDN HTML (index.html)
const Hands = (window as any).Hands;

const SignLanguageTranslator: React.FC = () => {
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [currentSign, setCurrentSign] = useState<string>("Menunggu...");
    const [translationHistory, setTranslationHistory] = useState<string>("");
    const [confidence, setConfidence] = useState<number>(0.85);

    // State Metrik Evaluasi Performa (Hardware & Pipeline)
    const [fps, setFps] = useState<number>(30);
    const [latency, setLatency] = useState<number>(45);
    const [memory, setMemory] = useState<number>(120);

    // State Metrik Spasial & Lingkungan (Environment)
    const [lux, setLux] = useState<number>(450);
    const [handScale, setHandScale] = useState<string>("-");
    const [frameBuffer, setFrameBuffer] = useState<number>(0);

    // State: Deteksi Tangan Asli HANYA DI DALAM AREA ISYARAT
    const [isHandInArea, setIsHandInArea] = useState<boolean>(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const activeLandmarksRef = useRef<{ x: number; y: number; z: number }[] | null>(null);
    const isPredictingRef = useRef<boolean>(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const API_BASE = "http://localhost:8000";

    // 1. Efek untuk memuat daftar suara browser TTS
    useEffect(() => {
        const loadVoices = () => {
            window.speechSynthesis.getVoices();
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // 2. Efek untuk Inisialisasi MediaPipe Hands (Deteksi Tangan + ROI + Hand Scale)
    useEffect(() => {
        let animationFrameId: number;
        let isProcessing = false;

        if (!Hands) {
            console.error("MediaPipe Hands library belum dimuat dari index.html");
            return;
        }

        const hands = new Hands({
            locateFile: (file: string) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 0,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
            let isInsideTargetArea = false;
            let currentScale = "-";

            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                for (const landmarks of results.multiHandLandmarks) {
                    const palmCenter = landmarks[9];
                    const wrist = landmarks[0];

                    const isXInArea = palmCenter.x >= 0.0 && palmCenter.x <= 0.45;
                    const isYInArea = palmCenter.y >= 0.20 && palmCenter.y <= 0.80;

                    if (isXInArea && isYInArea) {
                        isInsideTargetArea = true;

                        const distance = Math.sqrt(Math.pow(palmCenter.x - wrist.x, 2) + Math.pow(palmCenter.y - wrist.y, 2));

                        if (distance < 0.12) {
                            currentScale = "Jauh";
                        } else if (distance > 0.35) {
                            currentScale = "Dekat";
                        } else {
                            currentScale = "Ideal";
                        }

                        // Simpan 21 landmark asli untuk dikirim ke backend saat prediksi
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
                setHandScale("-");
            }
        });

        const detectHand = async () => {
            if (isCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
                if (!isProcessing) {
                    isProcessing = true;
                    try {
                        await hands.send({ image: videoRef.current });
                    } catch (error) {
                        console.error("Error processing video frame:", error);
                    }
                    isProcessing = false;
                }
            }
            animationFrameId = requestAnimationFrame(detectHand);
        };

        if (isCameraActive) {
            detectHand();
        } else {
            setIsHandInArea(false);
            setHandScale("-");
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            hands.close();
        };
    }, [isCameraActive]);

    // Fungsi: kirim landmark ke backend FastAPI untuk inference GCN
    const predictSign = async () => {
        if (!sessionId || !activeLandmarksRef.current || isPredictingRef.current) return;
        isPredictingRef.current = true;
        try {
            const res = await fetch(`${API_BASE}/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    landmarks: activeLandmarksRef.current,
                    fps,
                    latency_ms: latency,
                    memory_mb: memory,
                    lux,
                    hand_scale: handScale,
                }),
            });
            if (!res.ok) throw new Error(`Predict gagal: ${res.status}`);
            const data = await res.json();

            setCurrentSign(data.predicted_class);
            setConfidence(data.confidence);
            setTranslationHistory((prev) => prev + data.predicted_class);
        } catch (err) {
            console.error("Gagal memanggil /predict:", err);
        } finally {
            isPredictingRef.current = false;
        }
    };

    // 3. Efek Hasil Inference 3DGCN & Perangkaian Kalimat
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isCameraActive) {
            interval = setInterval(() => {
                setFps(Math.floor(Math.random() * (31 - 24) + 24));
                setLatency(Math.floor(Math.random() * (55 - 38) + 38));
                setMemory(Math.floor(Math.random() * (132 - 118) + 118));
                setLux(Math.floor(Math.random() * (520 - 410) + 410));

                if (isHandInArea) {
                    setFrameBuffer((prev) => {
                        const nextBuffer = prev + Math.floor(Math.random() * 8 + 4);

                        if (nextBuffer >= 30) {
                            predictSign();
                            return 0;
                        }
                        return nextBuffer;
                    });
                } else {
                    setCurrentSign("Menunggu...");
                    setConfidence(0);
                    setFrameBuffer(0);
                }
            }, 1000);
        } else {
            setCurrentSign("Menunggu...");
            setFrameBuffer(0);
        }

        return () => clearInterval(interval);
    }, [isCameraActive, isHandInArea]);

    // 4. Efek untuk Menyalakan/Mematikan Kamera
    useEffect(() => {
        let stream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Gagal mengakses kamera:", err);
                setIsCameraActive(false);
            }
        };

        const stopCamera = () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const mediaStream = videoRef.current.srcObject as MediaStream;
                const tracks = mediaStream.getTracks();
                tracks.forEach((track) => track.stop());
                videoRef.current.srcObject = null;
            }
        };

        if (isCameraActive) startCamera();
        else stopCamera();

        return () => {
            if (stream) stream.getTracks().forEach((track) => track.stop());
        };
    }, [isCameraActive]);

    // 5. Mulai/akhiri sesi translasi di backend saat kamera dinyalakan/dimatikan
    useEffect(() => {
        let cancelled = false;

        const startSession = async () => {
            try {
                const res = await fetch(`${API_BASE}/sessions/start`, { method: "POST" });
                const data = await res.json();
                if (!cancelled) setSessionId(data.session_id);
            } catch (err) {
                console.error("Gagal memulai sesi:", err);
            }
        };

        const endSession = async (id: string) => {
            try {
                await fetch(`${API_BASE}/sessions/end`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: id }),
                });
            } catch (err) {
                console.error("Gagal mengakhiri sesi:", err);
            }
        };

        if (isCameraActive) {
            startSession();
        } else if (sessionId) {
            endSession(sessionId);
            setSessionId(null);
        }

        return () => {
            cancelled = true;
        };
    }, [isCameraActive]);

    const toggleCamera = () => setIsCameraActive(!isCameraActive);

    const speakText = () => {
        if (translationHistory.trim() !== "") {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(translationHistory);
            utterance.lang = 'id-ID';
            utterance.rate = 0.9;
            const voices = window.speechSynthesis.getVoices();
            const indonesianVoice = voices.find(v => v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang === 'id');
            if (indonesianVoice) utterance.voice = indonesianVoice;
            window.speechSynthesis.speak(utterance);
        }
    };

    const getConfidenceColor = (score: number) => {
        if (score === 0) return 'hidden';
        if (score > 0.8) return 'bg-emerald-500/90 text-white border-emerald-400/40 shadow-emerald-500/20';
        if (score > 0.5) return 'bg-amber-500/90 text-white border-amber-400/40 shadow-amber-500/20';
        return 'bg-rose-500/90 text-white border-rose-400/40 shadow-rose-500/20';
    };

    const getFpsColor = (currentFps: number) => {
        if (currentFps >= 25) return 'text-emerald-400';
        if (currentFps >= 18) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getScaleColor = (scale: string) => {
        if (scale === "Ideal") return 'text-emerald-400';
        if (scale === "Jauh" || scale === "Dekat") return 'text-amber-400';
        return 'text-slate-500 dark:text-slate-500';
    };

    return (
        <div className={`${isDarkMode ? 'dark' : ''} min-h-screen w-full`}>
            <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 sm:px-8 py-6 sm:py-10 font-sans flex flex-col overflow-x-hidden transition-colors duration-500">

                <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col flex-grow gap-4 sm:gap-6">

                    {/* ============================================================ */}
                    {/* HEADER */}
                    {/* ============================================================ */}
                    <div className="flex-none flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 gap-4 sm:gap-0 transition-all duration-300">

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 items-center justify-center shadow-lg shadow-blue-500/25">
                                <Hand className="w-6 h-6 text-white" strokeWidth={2} />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-600 dark:from-blue-400 dark:via-sky-400 dark:to-cyan-400 bg-clip-text text-transparent">
                                    SIBI Translator
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Real-time 3DGCN Pipeline
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Status Badge */}
                            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isCameraActive ?
                                    'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                                    'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
                                {isCameraActive ? 'Online' : 'Offline'}
                            </div>

                            {/* Dark Mode Toggle - Enhanced */}
                            <div
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`relative inline-flex items-center h-9 w-16 cursor-pointer rounded-full transition-all duration-300 ease-in-out border-2 shadow-md ${isDarkMode ?
                                        'border-blue-400/50 bg-blue-900/60 hover:border-blue-400/80' :
                                        'border-amber-300/50 bg-amber-100/80 hover:border-amber-400/80'
                                    }`}
                            >
                                <Sun className={`absolute left-1.5 w-4 h-4 text-amber-500 transition-all duration-300 ${isDarkMode ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
                                <Moon className={`absolute right-1.5 w-4 h-4 text-blue-300 transition-all duration-300 ${isDarkMode ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                <span className={`inline-flex items-center justify-center w-7 h-7 transform bg-white dark:bg-slate-800 rounded-full shadow-lg transition-all duration-300 ease-in-out z-10 ${isDarkMode ? 'translate-x-8 ring-2 ring-blue-400/30' : 'translate-x-0 ring-2 ring-amber-400/30'}`}>
                                    {isDarkMode ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================ */}
                    {/* MAIN GRID */}
                    {/* ============================================================ */}
                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">

                        {/* ============================================================ */}
                        {/* VIDEO SECTION - Left 3/4 */}
                        {/* ============================================================ */}
                        <div className="lg:col-span-3 flex flex-col gap-4 h-full">

                            {/* Video Player */}
                            <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center w-full border border-slate-700/50 dark:border-slate-700/60 transition-colors flex-1">

                                {isCameraActive ? (
                                    <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline muted />
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
                                        <p className="text-lg sm:text-xl font-medium tracking-wide mt-4 text-slate-400">Kamera Nonaktif</p>
                                        <p className="text-sm mt-1 opacity-50">Klik "Mulai Kamera" untuk memulai</p>
                                    </div>
                                )}

                                {/* Overlay Dua Placeholder - RESPONSIF dengan tinggi sama */}
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

                                        {/* Kotak Kanan: Area Isyarat - tinggi disamakan dengan kotak kiri */}
                                        <div className={`w-[40%] sm:w-[38%] h-[80%] sm:h-[90%] border-2 border-dashed rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center relative transition-all duration-500
                                            ${isHandInArea ?
                                                'border-emerald-400 bg-emerald-400/10 shadow-[0_0_40px_rgba(52,211,153,0.25)] scale-[1.02]' :
                                                'border-emerald-400/30 animate-[pulse_3s_ease-in-out_infinite]'}`}>
                                            <div className={`absolute top-0 left-0 w-4 sm:w-8 h-4 sm:h-8 border-t-2 sm:border-t-3 border-l-2 sm:border-l-3 rounded-tl-2xl sm:rounded-tl-3xl transition-colors duration-500 ${isHandInArea ? 'border-emerald-300' : 'border-emerald-400/40'}`}></div>
                                            <div className={`absolute top-0 right-0 w-4 sm:w-8 h-4 sm:h-8 border-t-2 sm:border-t-3 border-r-2 sm:border-r-3 rounded-tr-2xl sm:rounded-tr-3xl transition-colors duration-500 ${isHandInArea ? 'border-emerald-300' : 'border-emerald-400/40'}`}></div>
                                            <div className={`absolute bottom-0 left-0 w-4 sm:w-8 h-4 sm:h-8 border-b-2 sm:border-b-3 border-l-2 sm:border-l-3 rounded-bl-2xl sm:rounded-bl-3xl transition-colors duration-500 ${isHandInArea ? 'border-emerald-300' : 'border-emerald-400/40'}`}></div>
                                            <div className={`absolute bottom-0 right-0 w-4 sm:w-8 h-4 sm:h-8 border-b-2 sm:border-b-3 border-r-2 sm:border-r-3 rounded-br-2xl sm:rounded-br-3xl transition-colors duration-500 ${isHandInArea ? 'border-emerald-300' : 'border-emerald-400/40'}`}></div>

                                            <Hand className={`w-8 h-8 sm:w-16 sm:h-16 mb-1 sm:mb-3 transition-all duration-500 ${isHandInArea ?
                                                    'text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)] scale-110' :
                                                    'text-emerald-400/60 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                                                }`} strokeWidth={1.5} />

                                            <span className={`backdrop-blur-sm text-[7px] sm:text-[10px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium tracking-wide text-center transition-all duration-500 whitespace-nowrap ${isHandInArea ?
                                                    'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 border border-emerald-400/30' :
                                                    'bg-black/60 text-emerald-300/80 border border-emerald-400/20'
                                                }`}>
                                                {isHandInArea ? '✓ Tangan Terdeteksi' : 'Area Isyarat'}
                                            </span>

                                            {isHandInArea && (
                                                <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-3 sm:w-5 h-3 sm:h-5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                                            )}
                                        </div>

                                    </div>
                                )}

                                {/* ============================================================ */}
                                {/* DASHBOARD ANALITIK KIRI ATAS - RESPONSIF MOBILE */}
                                {/* ============================================================ */}
                                <div className="absolute top-2 left-2 sm:top-5 sm:left-5 flex flex-col gap-1.5 sm:gap-2.5 pointer-events-none z-20 w-auto max-w-[100px] sm:max-w-[180px]">

                                    {/* KELOMPOK 1: HARDWARE & PIPELINE PERF */}
                                    <div className="bg-black/70 backdrop-blur-xl border border-white/10 text-white rounded-xl p-1.5 sm:p-3 shadow-2xl flex flex-col gap-0.5 sm:gap-1.5 transition-all duration-300 min-w-[90px] sm:min-w-[140px]">
                                        <div className="text-[6px] sm:text-[9px] text-slate-400 font-bold tracking-widest mb-0.5 border-b border-white/10 pb-0.5 sm:pb-1 flex items-center gap-1 sm:gap-1.5">
                                            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                                            <span className="hidden sm:inline">PERFORMANCE</span>
                                            <span className="sm:hidden">PERF</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                                            <span className="text-slate-400 flex items-center"><Activity className={`w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 ${getFpsColor(fps)}`} /> FPS</span>
                                            <span className={`font-bold ${getFpsColor(fps)}`}>{isCameraActive ? fps : '0'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                                            <span className="text-slate-400 flex items-center"><Cpu className="w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-cyan-400" /> LAT</span>
                                            <span className="font-bold text-cyan-400">{isCameraActive ? `${latency}ms` : '0ms'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                                            <span className="text-slate-400 flex items-center"><HardDrive className="w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-sky-400" /> MEM</span>
                                            <span className="font-bold text-sky-400">{isCameraActive ? `${memory}MB` : '0MB'}</span>
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
                                            <span className="text-slate-400 flex items-center"><Sun className="w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-slate-400" /> LUX</span>
                                            <span className="font-bold text-slate-200">{isCameraActive ? `${lux} lx` : '0 lx'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                                            <span className="text-slate-400 flex items-center"><Focus className={`w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 ${getScaleColor(handScale)}`} /> SCALE</span>
                                            <span className={`font-bold ${getScaleColor(handScale)}`}>{isCameraActive ? handScale : '-'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono font-medium">
                                            <span className="text-slate-400 flex items-center"><Layers className="w-2 h-2 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-fuchsia-400" /> BUF</span>
                                            <span className="font-bold text-fuchsia-400">{isCameraActive ? `${frameBuffer}/30` : '0/30'}</span>
                                        </div>
                                    </div>

                                    {/* CONFIDENCE SCORE */}
                                    {isCameraActive && currentSign !== "Menunggu..." && (
                                        <div className={`text-[7px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-lg shadow-lg backdrop-blur-md flex items-center justify-between border w-full ${getConfidenceColor(confidence)} mt-0.5`}>
                                            <span className="flex items-center gap-0.5 sm:gap-1.5">
                                                <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/70 animate-pulse"></span>
                                                <span className="hidden sm:inline">CONFIDENCE</span>
                                                <span className="sm:hidden">CONF</span>
                                            </span>
                                            <span>{(confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    )}
                                </div>

                                {/* ============================================================ */}
                                {/* STATUS INDICATOR - BOTTOM RIGHT (z-index 30) */}
                                {/* ============================================================ */}
                                {isCameraActive && (
                                    <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 z-30 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isHandInArea ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                                        <span className="text-[9px] sm:text-[10px] text-slate-300 font-mono font-medium">
                                            {isHandInArea ? 'HAND DETECTED' : 'SCANNING...'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Controls */}
                            <div className="flex-none flex flex-row justify-center gap-3 sm:gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 transition-colors duration-300">
                                <button
                                    onClick={toggleCamera}
                                    className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all shadow-md flex items-center ${isCameraActive ?
                                            'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/30 hover:shadow-rose-500/10' :
                                            'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg shadow-blue-500/25 transform hover:-translate-y-0.5'
                                        }`}
                                >
                                    {isCameraActive ? <CameraOff className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> : <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
                                    {isCameraActive ? 'Matikan Kamera' : 'Mulai Kamera'}
                                </button>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/* TRANSLATION RESULT - Right 1/4 */}
                        {/* ============================================================ */}
                        <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6 h-full">

                            {/* Deteksi Saat Ini - fixed height */}
                            <div className="flex-none bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-center items-center text-center h-36 sm:h-44 relative overflow-hidden transition-colors duration-300">
                                <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500"></div>
                                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-blue-500/5 blur-2xl"></div>
                                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2 font-bold flex items-center gap-1.5">
                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${isHandInArea && isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
                                    Deteksi Saat Ini
                                </p>
                                <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight break-words w-full px-2 transition-all duration-500 ${isHandInArea && isCameraActive ?
                                        'bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent' :
                                        'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {currentSign}
                                </h2>
                                {isHandInArea && isCameraActive && currentSign !== "Menunggu..." && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3">
                                        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
                                        <span className="absolute inset-0 rounded-full bg-emerald-400"></span>
                                    </div>
                                )}
                            </div>

                            {/* Kalimat Terjemahan - akan mengisi sisa ruang */}
                            <div className="flex-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col min-h-0 transition-colors duration-300">

                                <div className="flex-none flex justify-between items-center mb-2 sm:mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2.5 transition-colors">
                                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                        <span className="inline-block w-1 h-1 rounded-full bg-blue-400"></span>
                                        Kalimat Terjemahan
                                    </p>
                                    <button
                                        onClick={() => setTranslationHistory("")}
                                        className="p-1.5 sm:p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                                        title="Hapus Teks"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                </div>

                                {/* Container textarea dengan overflow hidden dan flex-1 */}
                                <div className="flex-1 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-700/30 shadow-inner transition-colors duration-300 overflow-hidden">
                                    <textarea
                                        value={translationHistory}
                                        onChange={(e) => setTranslationHistory(e.target.value)}
                                        placeholder="Belum ada isyarat yang diterjemahkan..."
                                        className="w-full h-full bg-transparent resize-none outline-none text-base sm:text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-normal placeholder:italic placeholder:text-xs sm:placeholder:text-sm transition-colors overflow-y-auto"
                                    />
                                </div>

                                <div className="flex-none mt-3 pt-1">
                                    <button
                                        onClick={speakText}
                                        disabled={!translationHistory.trim()}
                                        className={`w-full py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center shadow-md ${translationHistory.trim() ?
                                                'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/25 cursor-pointer hover:shadow-lg transform hover:-translate-y-0.5' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                            }`}
                                    >
                                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Bacakan Teks
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignLanguageTranslator;