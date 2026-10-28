/**
 * types/index.ts
 * Definisi tipe data dan antarmuka (interface) terpusat untuk aplikasi SIBI Translator.
 */

export interface Landmark {
    x: number;
    y: number;
    z: number;
}

export type HandScaleType = 'Jauh' | 'Ideal' | 'Dekat' | '-';

export interface PerformanceMetrics {
    fps: number;
    latency: number;
    memory: number;
}

export interface SpatialMetrics {
    lux: number;
    handScale: HandScaleType;
    frameBuffer: number;
}

export interface PredictRequestPayload {
    session_id: string;
    landmarks: Landmark[];
    fps?: number;
    latency_ms?: number;
    memory_mb?: number;
    lux?: number;
    hand_scale?: string;
}

export interface PredictResponse {
    predicted_class: string;
    confidence: number;
    top_k: Array<[string, number]>;
    translation_id: number;
}

export interface LatestPredictionResponse {
    translation_id?: number | null;
    predicted_class?: string | null;
    confidence?: number | null;
    created_at?: string | null;
}

export interface SessionStartResponse {
    session_id: string;
    started_at: string;
}

export interface SessionEndResponse {
    session_id: string;
    ended_at: string;
    total_translations: number;
}
