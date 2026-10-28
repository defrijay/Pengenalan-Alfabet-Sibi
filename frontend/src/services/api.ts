/**
 * services/api.ts
 * Lapisan komunikasi HTTP ke FastAPI backend (Railway / local server).
 * Menyediakan fungsi-fungsi pemanggilan REST API untuk sesi, prediksi GCN, dan feedback.
 */

import type {
    PredictRequestPayload,
    PredictResponse,
    SessionStartResponse,
    SessionEndResponse,
    LatestPredictionResponse,
} from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Memulai sesi translasi baru di backend.
 */
export async function startSessionApi(): Promise<SessionStartResponse> {
    const res = await fetch(`${API_BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        throw new Error(`Gagal memulai sesi: HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Mengakhiri sesi translasi yang sedang berjalan.
 */
export async function endSessionApi(sessionId: string): Promise<SessionEndResponse> {
    const res = await fetch(`${API_BASE_URL}/sessions/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
    });
    if (!res.ok) {
        throw new Error(`Gagal mengakhiri sesi: HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Mengirim 21 titik koordinat landmark tangan ke model GCN untuk inferensi huruf SIBI.
 */
export async function predictSignApi(payload: PredictRequestPayload): Promise<PredictResponse> {
    const res = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error(`Inference /predict gagal: HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Mengambil hasil translasi paling mutakhir (berguna untuk sinkronisasi antarmuka / IoT).
 */
export async function getLatestPredictionApi(sessionId?: string): Promise<LatestPredictionResponse> {
    const url = sessionId
        ? `${API_BASE_URL}/predict/latest?session_id=${sessionId}`
        : `${API_BASE_URL}/predict/latest`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Gagal memuat latest prediction: HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Mengirim feedback koreksi hasil prediksi untuk pengujian atau pencatatan evaluasi.
 */
export async function submitFeedbackApi(
    translationId: number,
    isCorrect: boolean,
    correctedLabel?: string
): Promise<{ status: string; feedback_id: number }> {
    const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            translation_id: translationId,
            is_correct: isCorrect,
            corrected_label: correctedLabel,
        }),
    });
    if (!res.ok) {
        throw new Error(`Gagal menyimpan feedback: HTTP ${res.status}`);
    }
    return res.json();
}
