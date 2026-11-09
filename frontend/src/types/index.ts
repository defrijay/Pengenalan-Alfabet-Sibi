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
    inference_ms?: number | null;
    server_memory_mb?: number | null;
}

export interface TranslationLogItem {
    id: number;
    session_id: string;
    predicted_class: string;
    confidence: number;
    latency_ms?: number | null;
    fps?: number | null;
    memory_mb?: number | null;
    lux?: number | null;
    hand_scale?: string | null;
    created_at: string;
    is_correct?: boolean | null;
    corrected_label?: string | null;
}

export interface MonitoringStatsResponse {
    total_logs: number;
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    avg_confidence: number;
    server_memory_mb: number;
    logs: TranslationLogItem[];
}

export interface IoTTelemetryRequestPayload {
    translation_id?: number | null;
    device_id?: string;
    actual_distance_cm?: number | null;
    measured_distance_cm?: number | null;
    distance_in_range?: boolean | null;
    led_indicator_status?: string | null;
    light_condition?: string | null;
    measured_lux?: number | null;
    lux_threshold?: number | null;
    helper_led_status?: string | null;
    target_letter?: string | null;
    predicted_letter?: string | null;
    confidence?: number | null;
    speaker_output?: string | null;
    vibration_pattern?: string | null;
    is_output_matched?: boolean | null;
    api_latency_ms?: number | null;
    wifi_latency_ms?: number | null;
    actuation_latency_ms?: number | null;
    total_e2e_ms?: number | null;
}

export interface IoTTelemetryItem extends IoTTelemetryRequestPayload {
    id: number;
    created_at: string;
}

export interface IoTDashboardResponse {
    esp32_online: boolean;
    last_seen_at?: string | null;
    latest_distance_cm?: number | null;
    latest_lux?: number | null;
    helper_led_status?: string | null;
    avg_api_latency_ms: number;
    avg_wifi_latency_ms: number;
    avg_actuation_latency_ms: number;
    avg_total_e2e_ms: number;
    records: IoTTelemetryItem[];
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
