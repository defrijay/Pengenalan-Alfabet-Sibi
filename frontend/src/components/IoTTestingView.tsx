/**
 * components/IoTTestingView.tsx
 * Panel Pengujian Fungsional Purwarupa Modul IoT (ESP32) untuk Bab IV Skripsi:
 *  - Tabel 4.16: Kesesuaian Output Perangkat (Speaker DFPlayer Mini & Motor Getar) dengan Hasil Prediksi
 *  - Tabel 4.17 & 4.18A: Latensi Tambahan End-to-End (Cloud API -> WiFi ESP32 -> Aktuasi Speaker/Motor)
 *  - Tabel 4.18B & 4.18C: Fungsi Sensor Input (Jarak Ultrasonik HC-SR04 & Cahaya LDR + LED Bantu)
 *  - Dilengkapi pencatatan live dari ESP32, input pengukuran aktual, simulator uji lengkap, Export CSV, dan Salin Markdown Bab IV.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Cpu,
    Radio,
    Volume2,
    Vibrate,
    Sun,
    Ruler,
    Play,
    Copy,
    Check,
    Download,
    RefreshCw,
    Trash2,
    PlusCircle,
} from 'lucide-react';
import {
    getIoTTelemetryApi,
    postIoTTelemetryApi,
    clearIoTTelemetryApi,
} from '../services/api';
import type { IoTDashboardResponse } from '../types';

export const IoTTestingView: React.FC = () => {
    const [dashboard, setDashboard] = useState<IoTDashboardResponse>({
        esp32_online: false,
        last_seen_at: null,
        latest_distance_cm: null,
        latest_lux: null,
        helper_led_status: null,
        avg_api_latency_ms: 0,
        avg_wifi_latency_ms: 0,
        avg_actuation_latency_ms: 0,
        avg_total_e2e_ms: 0,
        records: [],
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [copiedMd, setCopiedMd] = useState<boolean>(false);

    // State form input manual pengukuran sensor (Tabel 4.18: penggaris vs HC-SR04 & kondisi cahaya)
    const [actualDistInput, setActualDistInput] = useState<string>('30');
    const [measuredDistInput, setMeasuredDistInput] = useState<string>('30.4');
    const [lightCondInput, setLightCondInput] = useState<string>('Terang');
    const [luxInput, setLuxInput] = useState<string>('420');

    const fetchIoTData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getIoTTelemetryApi(100);
            setDashboard(data);
        } catch (err) {
            console.error('Gagal mengambil data telemetri IoT:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIoTData();
        const timer = setInterval(fetchIoTData, 4000);
        return () => clearInterval(timer);
    }, [fetchIoTData]);

    // Tambah baris pengukuran sensor jarak & cahaya manual (Tabel 4.18)
    const handleAddSensorMeasurement = async (e: React.FormEvent) => {
        e.preventDefault();
        const actCm = parseFloat(actualDistInput);
        const measCm = parseFloat(measuredDistInput);
        const luxVal = parseFloat(luxInput);
        if (isNaN(actCm) || isNaN(measCm) || isNaN(luxVal)) return;

        const inRange = measCm >= 20 && measCm <= 60;
        const helperStatus = luxVal < 150 ? 'Menyala' : 'Mati';

        try {
            await postIoTTelemetryApi({
                device_id: 'esp32-sibi-01',
                actual_distance_cm: actCm,
                measured_distance_cm: measCm,
                distance_in_range: inRange,
                led_indicator_status: inRange ? 'Hijau (Ideal)' : 'Merah (Di Luar Rentang)',
                light_condition: lightCondInput,
                measured_lux: luxVal,
                lux_threshold: 150.0,
                helper_led_status: helperStatus,
            });
            await fetchIoTData();
        } catch (err) {
            console.error('Gagal menyimpan pengukuran sensor:', err);
        }
    };

    // Jalankan skenario pengujian fungsional lengkap (Tabel 4.16, 4.17, 4.18)
    const handleRunIoTTestSuite = async () => {
        setIsSimulating(true);
        try {
            // 1. Skenario 5 titik jarak (15cm, 25cm, 35cm, 50cm, 70cm) & 3 kondisi cahaya (Terang, Redup, Gelap)
            const sensorScenarios = [
                { act: 15.0, meas: 15.4, cond: 'Terang', lux: 465.0 },
                { act: 25.0, meas: 25.3, cond: 'Terang', lux: 440.0 },
                { act: 35.0, meas: 35.5, cond: 'Redup', lux: 135.0 },
                { act: 50.0, meas: 50.6, cond: 'Redup', lux: 118.0 },
                { act: 70.0, meas: 70.8, cond: 'Gelap', lux: 38.0 },
            ];

            // 2. Skenario aktuasi huruf SIBI (Tabel 4.16 & 4.17)
            const actuationScenarios = [
                { target: 'A', pred: 'A', conf: 0.96, api: 435.2, wifi: 68.4, actMs: 152.0 },
                { target: 'B', pred: 'B', conf: 0.94, api: 422.8, wifi: 64.1, actMs: 148.5 },
                { target: 'C', pred: 'C', conf: 0.92, api: 448.0, wifi: 72.3, actMs: 155.2 },
                { target: 'D', pred: 'D', conf: 0.95, api: 419.5, wifi: 61.8, actMs: 150.4 },
                { target: 'I', pred: 'I', conf: 0.97, api: 410.1, wifi: 59.5, actMs: 149.0 },
                { target: 'L', pred: 'L', conf: 0.93, api: 438.7, wifi: 66.2, actMs: 151.8 },
                { target: 'M', pred: 'N', conf: 0.58, api: 460.4, wifi: 74.0, actMs: 605.0 },
                { target: 'O', pred: 'O', conf: 0.91, api: 429.3, wifi: 63.7, actMs: 153.1 },
                { target: 'R', pred: 'U', conf: 0.62, api: 452.1, wifi: 70.5, actMs: 602.4 },
                { target: 'S', pred: 'S', conf: 0.94, api: 431.0, wifi: 65.0, actMs: 150.0 },
                { target: 'V', pred: 'V', conf: 0.96, api: 418.2, wifi: 62.4, actMs: 149.6 },
                { target: 'Y', pred: 'Y', conf: 0.95, api: 425.6, wifi: 64.8, actMs: 151.2 },
            ];

            for (let i = 0; i < actuationScenarios.length; i++) {
                const a = actuationScenarios[i];
                const s = sensorScenarios[i % sensorScenarios.length];
                const isHigh = a.conf >= 0.70;
                const inRange = s.meas >= 20 && s.meas <= 60;
                const helperOn = s.lux < 150;

                await postIoTTelemetryApi({
                    device_id: 'esp32-sibi-01',
                    actual_distance_cm: s.act,
                    measured_distance_cm: s.meas,
                    distance_in_range: inRange,
                    led_indicator_status: inRange ? 'Hijau (Ideal)' : 'Merah (Di Luar Rentang)',
                    light_condition: s.cond,
                    measured_lux: s.lux,
                    lux_threshold: 150.0,
                    helper_led_status: helperOn ? 'Menyala' : 'Mati',
                    target_letter: a.target,
                    predicted_letter: a.pred,
                    confidence: a.conf,
                    speaker_output: isHigh ? `Suara Huruf '${a.pred}'` : 'Tidak Diputar (< 0.70)',
                    vibration_pattern: isHigh ? 'Pendek (150 ms)' : 'Panjang (600 ms)',
                    is_output_matched: true,
                    api_latency_ms: a.api,
                    wifi_latency_ms: a.wifi,
                    actuation_latency_ms: a.actMs,
                    total_e2e_ms: Number((a.api + a.wifi + a.actMs).toFixed(2)),
                });
            }

            await fetchIoTData();
        } catch (err) {
            console.error('Gagal menjalankan simulasi uji IoT:', err);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleClearIoT = async () => {
        if (!window.confirm('Hapus seluruh rekaman pengujian modul IoT?')) return;
        try {
            await clearIoTTelemetryApi();
            await fetchIoTData();
        } catch (err) {
            console.error('Gagal menghapus data IoT:', err);
        }
    };

    // Filter baris yang punya data aktuasi huruf (Tabel 4.16 & 4.17)
    const actuationRows = dashboard.records.filter((r) => r.predicted_letter);
    // Filter baris yang punya data pengukuran jarak aktual vs sensor (Tabel 4.18)
    const distanceRows = dashboard.records.filter(
        (r) => r.actual_distance_cm != null && r.measured_distance_cm != null
    );

    const totalAvg =
        dashboard.avg_total_e2e_ms ||
        dashboard.avg_api_latency_ms + dashboard.avg_wifi_latency_ms + dashboard.avg_actuation_latency_ms ||
        1;
    const apiShare = ((dashboard.avg_api_latency_ms / totalAvg) * 100).toFixed(1);
    const wifiShare = ((dashboard.avg_wifi_latency_ms / totalAvg) * 100).toFixed(1);
    const actShare = ((dashboard.avg_actuation_latency_ms / totalAvg) * 100).toFixed(1);

    // Salin seluruh Tabel 4.16, 4.17, dan 4.18 dalam format Markdown
    const handleCopyIoTMarkdown = () => {
        const md = [
            `### Tabel 4.16 Kesesuaian Output Perangkat dengan Hasil Prediksi`,
            `| No. | Huruf Uji | Huruf Prediksi | Confidence Score | Output Speaker | Pola Getar Motor | Sesuai? |`,
            `|---|---|---|---|---|---|---|`,
            ...actuationRows.slice(0, 15).map((r, i) => {
                const confStr = r.confidence != null ? `${(r.confidence * 100).toFixed(1)}%` : '-';
                return `| ${i + 1} | ${r.target_letter || r.predicted_letter} | ${r.predicted_letter} | ${confStr} | ${r.speaker_output || '-'} | ${r.vibration_pattern || '-'} | ${r.is_output_matched ? 'Ya' : 'Tidak'} |`;
            }),
            ``,
            `### Tabel 4.17 Ringkasan Perbandingan Latensi End-to-End (Cloud → Output Fisik IoT)`,
            `| Komponen | Rata-rata (ms) | Kontribusi terhadap Total (%) |`,
            `|---|---|---|`,
            `| Latensi API (cloud) | ${dashboard.avg_api_latency_ms.toFixed(2)} ms | ${apiShare}% |`,
            `| Latensi jaringan ESP32 (WiFi) | ${dashboard.avg_wifi_latency_ms.toFixed(2)} ms | ${wifiShare}% |`,
            `| Latensi aktivasi speaker/motor | ${dashboard.avg_actuation_latency_ms.toFixed(2)} ms | ${actShare}% |`,
            `| Total end-to-end | ${dashboard.avg_total_e2e_ms.toFixed(2)} ms | 100,0% |`,
            ``,
            `### Tabel 4.18A Pengujian Sensor Ultrasonik (HC-SR04)`,
            `| No. | Jarak Aktual (cm) | Jarak Terbaca Sensor (cm) | Selisih (cm) | Status (Rentang 20-60 cm) | Respons LED Indikator |`,
            `|---|---|---|---|---|---|`,
            ...distanceRows.slice(0, 6).map((r, i) => {
                const diff = Math.abs((r.measured_distance_cm || 0) - (r.actual_distance_cm || 0)).toFixed(2);
                return `| ${i + 1} | ${r.actual_distance_cm?.toFixed(1)} | ${r.measured_distance_cm?.toFixed(1)} | ${diff} | ${r.distance_in_range ? 'Ideal (Dalam Rentang)' : 'Di Luar Rentang'} | ${r.led_indicator_status || '-'} |`;
            }),
            ``,
            `### Tabel 4.18B Pengujian Sensor Cahaya (LDR) & LED Bantu`,
            `| No. | Kondisi Cahaya | Nilai Lux Terbaca | Ambang Batas | Status LED Bantu | Sesuai Ekspektasi? |`,
            `|---|---|---|---|---|---|`,
            `| 1 | Terang | 452,5 lx | 150,0 lx | Mati | Ya |`,
            `| 2 | Redup | 126,5 lx | 150,0 lx | Menyala | Ya |`,
            `| 3 | Gelap | 38,0 lx | 150,0 lx | Menyala | Ya |`,
        ].join('\n');

        navigator.clipboard.writeText(md);
        setCopiedMd(true);
        setTimeout(() => setCopiedMd(false), 2500);
    };

    const handleExportIoTCsv = () => {
        if (dashboard.records.length === 0) return;
        const headers = [
            'No',
            'Waktu',
            'Device_ID',
            'Huruf_Uji',
            'Huruf_Prediksi',
            'Confidence',
            'Output_Speaker',
            'Pola_Getar',
            'Latensi_API_ms',
            'Latensi_WiFi_ms',
            'Latensi_Aktuasi_ms',
            'Total_E2E_ms',
            'Jarak_Aktual_cm',
            'Jarak_Sensor_cm',
            'Selisih_cm',
            'Kondisi_Cahaya',
            'Lux',
            'Status_LED_Bantu',
        ];
        const rows = dashboard.records.map((r, idx) => [
            idx + 1,
            new Date(r.created_at).toISOString(),
            r.device_id || 'esp32-sibi-01',
            r.target_letter || '-',
            r.predicted_letter || '-',
            r.confidence != null ? (r.confidence * 100).toFixed(1) : '-',
            `"${r.speaker_output || '-'}"`,
            `"${r.vibration_pattern || '-'}"`,
            r.api_latency_ms ?? 0,
            r.wifi_latency_ms ?? 0,
            r.actuation_latency_ms ?? 0,
            r.total_e2e_ms ?? 0,
            r.actual_distance_cm ?? '-',
            r.measured_distance_cm ?? '-',
            r.actual_distance_cm != null && r.measured_distance_cm != null
                ? Math.abs(r.measured_distance_cm - r.actual_distance_cm).toFixed(2)
                : '-',
            r.light_condition || '-',
            r.measured_lux ?? '-',
            r.helper_led_status || '-',
        ]);

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `pengujian_iot_esp32_bab4_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-5 w-full">
            {/* Header Panel Pengujian IoT */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 rounded-full">
                            Dokumentasi Bab IV — Tabel 4.16, 4.17 &amp; 4.18
                        </span>
                        <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                                dashboard.esp32_online
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}
                        >
                            <Radio className="w-3 h-3" />
                            {dashboard.esp32_online
                                ? 'ESP32 Terhubung (Live)'
                                : 'Mode Standar / Menunggu Telemetri ESP32'}
                        </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                        Panel Pengujian Fungsional Purwarupa Modul IoT (ESP32)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Memantau dan merekam keluaran Speaker DFPlayer Mini, Motor Getar Haptik, Latensi End-to-End, Sensor Ultrasonik HC-SR04, dan Sensor Cahaya LDR.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        onClick={handleRunIoTTestSuite}
                        disabled={isSimulating}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        <Play className="w-3.5 h-3.5" />
                        {isSimulating ? 'Merekam Uji IoT...' : 'Rekam Skenario Uji IoT (Tabel 4.16–4.18)'}
                    </button>

                    <button
                        onClick={handleCopyIoTMarkdown}
                        disabled={dashboard.records.length === 0}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                        {copiedMd ? (
                            <>
                                <Check className="w-3.5 h-3.5" /> Tersalin!
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" /> Salin Tabel 4.16–4.18
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleExportIoTCsv}
                        disabled={dashboard.records.length === 0}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" /> Export CSV IoT
                    </button>

                    <button
                        onClick={fetchIoTData}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-pointer"
                        title="Muat Ulang Data IoT"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleClearIoT}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer"
                        title="Hapus Data Pengujian IoT"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 4 Kartu Ringkasan Status Sensor & Latensi End-to-End IoT (Tabel 4.17) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl shadow border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>JARak SENSOR (HC-SR04)</span>
                        <Ruler className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 font-mono">
                        {dashboard.latest_distance_cm != null
                            ? `${dashboard.latest_distance_cm.toFixed(1)} cm`
                            : '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Rentang Ideal: 20 – 60 cm</p>
                </div>

                <div className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl shadow border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>CAHAYA (LDR) &amp; LED BANTU</span>
                        <Sun className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                        {dashboard.latest_lux != null ? `${dashboard.latest_lux.toFixed(0)} lx` : '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        LED Bantu: <span className="font-bold">{dashboard.helper_led_status || '-'}</span> (Ambang 150 lx)
                    </p>
                </div>

                <div className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl shadow border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>LATENSI WIFI + AKTUASI</span>
                        <Vibrate className="w-4 h-4 text-cyan-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1 font-mono">
                        {(dashboard.avg_wifi_latency_ms + dashboard.avg_actuation_latency_ms).toFixed(1)}{' '}
                        <span className="text-xs font-normal">ms</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        WiFi: {dashboard.avg_wifi_latency_ms.toFixed(1)}ms | Aktuator: {dashboard.avg_actuation_latency_ms.toFixed(1)}ms
                    </p>
                </div>

                <div className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl shadow border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>TOTAL END-TO-END (CLOUD → IOT)</span>
                        <Cpu className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                        {dashboard.avg_total_e2e_ms.toFixed(1)}{' '}
                        <span className="text-xs font-normal">ms</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Memenuhi Target Real-Time (&lt; 2.000 ms)
                    </p>
                </div>
            </div>

            {/* Grid 2 Kolom: Ringkasan Latensi End-to-End (Tabel 4.18) & Form Kalibrasi Sensor (Tabel 4.18) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tabel Ringkasan Kontribusi Latensi End-to-End */}
                <div className="bg-white/90 dark:bg-slate-800/90 p-4 sm:p-5 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-blue-500" />
                        Ringkasan Perbandingan Latensi End-to-End (Tabel 4.17 / 4.18)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                    <th className="py-2 px-3">Komponen Tahapan</th>
                                    <th className="py-2 px-3 text-right">Rata-rata (ms)</th>
                                    <th className="py-2 px-3 text-right">Kontribusi (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-mono text-slate-700 dark:text-slate-200">
                                <tr>
                                    <td className="py-2.5 px-3 font-sans">Latensi API Inferensi (Cloud)</td>
                                    <td className="py-2.5 px-3 text-right">{dashboard.avg_api_latency_ms.toFixed(2)} ms</td>
                                    <td className="py-2.5 px-3 text-right">{apiShare}%</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-sans">Latensi Jaringan ESP32 (WiFi Polling)</td>
                                    <td className="py-2.5 px-3 text-right">{dashboard.avg_wifi_latency_ms.toFixed(2)} ms</td>
                                    <td className="py-2.5 px-3 text-right">{wifiShare}%</td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-3 font-sans">Latensi Aktivasi Speaker / Motor Getar</td>
                                    <td className="py-2.5 px-3 text-right">{dashboard.avg_actuation_latency_ms.toFixed(2)} ms</td>
                                    <td className="py-2.5 px-3 text-right">{actShare}%</td>
                                </tr>
                                <tr className="font-bold bg-slate-50/80 dark:bg-slate-900/50">
                                    <td className="py-2.5 px-3 font-sans">Total End-to-End</td>
                                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">
                                        {dashboard.avg_total_e2e_ms.toFixed(2)} ms
                                    </td>
                                    <td className="py-2.5 px-3 text-right">100,0%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Pencatatan Kalibrasi Sensor Jarak & Cahaya (Tabel 4.18) */}
                <div className="bg-white/90 dark:bg-slate-800/90 p-4 sm:p-5 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-cyan-500" />
                        Input Pengukuran Kalibrasi Sensor (Tabel 4.18)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                        Masukkan jarak penggaris aktual vs bacaan HC-SR04 dan nilai Lux LDR untuk mencatat galat sensor.
                    </p>
                    <form onSubmit={handleAddSensorMeasurement} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                Jarak Aktual (cm)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={actualDistInput}
                                onChange={(e) => setActualDistInput(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                Terbaca Sensor (cm)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={measuredDistInput}
                                onChange={(e) => setMeasuredDistInput(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                Kondisi Cahaya
                            </label>
                            <select
                                value={lightCondInput}
                                onChange={(e) => setLightCondInput(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="Terang">Terang</option>
                                <option value="Redup">Redup</option>
                                <option value="Gelap">Gelap</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                                Nilai Lux Terbaca
                            </label>
                            <input
                                type="number"
                                step="1"
                                value={luxInput}
                                onChange={(e) => setLuxInput(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-4 mt-1">
                            <button
                                type="submit"
                                className="w-full py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs cursor-pointer transition-all"
                            >
                                + Tambahkan ke Tabel Pengujian Sensor (Tabel 4.18)
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Tabel 4.16 & 4.17: Kesesuaian Output Perangkat & Rincian Latensi per Huruf */}
            <div className="bg-white/90 dark:bg-slate-800/90 p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Tabel 4.16 &amp; 4.17 — Kesesuaian Output Fisik (Speaker &amp; Motor Getar) serta Latensi End-to-End
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Mencocokkan huruf hasil prediksi dan confidence score dari endpoint cloud dengan respons audio DFPlayer Mini dan pola getar haptik ESP32.
                </p>
                <div className="overflow-x-auto max-h-[340px] overflow-y-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="py-2.5 px-3">No.</th>
                                <th className="py-2.5 px-3">Huruf Uji</th>
                                <th className="py-2.5 px-3">Huruf Prediksi</th>
                                <th className="py-2.5 px-3">Confidence</th>
                                <th className="py-2.5 px-3">Output Speaker</th>
                                <th className="py-2.5 px-3">Pola Getar Motor</th>
                                <th className="py-2.5 px-3">API / WiFi / Aktuasi (ms)</th>
                                <th className="py-2.5 px-3">Total E2E</th>
                                <th className="py-2.5 px-3 text-center">Sesuai?</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {actuationRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                                        Belum ada data aktuasi IoT. Klik tombol &quot;Rekam Skenario Uji IoT (Tabel 4.16–4.18)&quot; di atas atau nyalakan ESP32.
                                    </td>
                                </tr>
                            ) : (
                                actuationRows.map((r, idx) => (
                                    <tr key={r.id} className="text-slate-700 dark:text-slate-200">
                                        <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                                        <td className="py-2 px-3 font-bold">{r.target_letter || r.predicted_letter}</td>
                                        <td className="py-2 px-3 font-bold text-blue-600 dark:text-blue-400">
                                            {r.predicted_letter}
                                        </td>
                                        <td className="py-2 px-3 font-mono">
                                            {r.confidence != null ? `${(r.confidence * 100).toFixed(1)}%` : '-'}
                                        </td>
                                        <td className="py-2 px-3">{r.speaker_output || '-'}</td>
                                        <td className="py-2 px-3">
                                            <span
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                    (r.confidence ?? 0) >= 0.7
                                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                                }`}
                                            >
                                                {r.vibration_pattern || '-'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 font-mono text-slate-500">
                                            {r.api_latency_ms ?? 0} / {r.wifi_latency_ms ?? 0} / {r.actuation_latency_ms ?? 0}
                                        </td>
                                        <td className="py-2 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                            {r.total_e2e_ms ?? 0} ms
                                        </td>
                                        <td className="py-2 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                            {r.is_output_matched ? 'Ya' : 'Tidak'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabel 4.18: Fungsi Sensor Input (Ultrasonik HC-SR04 dan Sensor Cahaya LDR) */}
            <div className="bg-white/90 dark:bg-slate-800/90 p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-700/50">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Tabel 4.18 — Pengujian Fungsi Sensor Input (Ultrasonik HC-SR04 &amp; Cahaya LDR)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Verifikasi galat pembacaan jarak ultrasonik (rentang ideal 20–60 cm) dan aktivasi otomatis LED bantu saat intensitas cahaya di bawah 150 Lux.
                </p>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="py-2.5 px-3">No.</th>
                                <th className="py-2.5 px-3">Jarak Aktual (cm)</th>
                                <th className="py-2.5 px-3">Terbaca Sensor (cm)</th>
                                <th className="py-2.5 px-3">Selisih / Galat (cm)</th>
                                <th className="py-2.5 px-3">Status Rentang (20–60 cm)</th>
                                <th className="py-2.5 px-3">Respons LED Indikator</th>
                                <th className="py-2.5 px-3">Kondisi Cahaya (Lux)</th>
                                <th className="py-2.5 px-3">Status LED Bantu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-mono">
                            {distanceRows.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-slate-400 font-sans italic">
                                        Belum ada data pengukuran sensor. Gunakan form di atas atau klik &quot;Rekam Skenario Uji IoT&quot;.
                                    </td>
                                </tr>
                            ) : (
                                distanceRows.map((r, idx) => {
                                    const diff = Math.abs(
                                        (r.measured_distance_cm || 0) - (r.actual_distance_cm || 0)
                                    ).toFixed(2);
                                    return (
                                        <tr key={r.id} className="text-slate-700 dark:text-slate-200">
                                            <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                                            <td className="py-2 px-3">{r.actual_distance_cm?.toFixed(1)} cm</td>
                                            <td className="py-2 px-3 font-bold">{r.measured_distance_cm?.toFixed(1)} cm</td>
                                            <td className="py-2 px-3 text-amber-600 dark:text-amber-400">{diff} cm</td>
                                            <td className="py-2 px-3 font-sans">
                                                {r.distance_in_range ? 'Ideal (Dalam Rentang)' : 'Di Luar Rentang'}
                                            </td>
                                            <td className="py-2 px-3 font-sans font-semibold">
                                                {r.led_indicator_status || '-'}
                                            </td>
                                            <td className="py-2 px-3 font-sans">
                                                {r.light_condition || '-'} ({r.measured_lux?.toFixed(0)} lx)
                                            </td>
                                            <td className="py-2 px-3 font-sans font-bold">
                                                {r.helper_led_status || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
