/**
 * components/CloudMonitoringView.tsx
 * Halaman/Tab Monitoring & Log Pengujian Cloud.
 * Dilengkapi manajemen Sesi Pengujian (Sesi #1, Sesi #2, dst.), filter per sesi,
 * kalkulasi metrik dinamis per sesi, serta hierarki visual ikon yang jelas.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Activity,
    Clock,
    Zap,
    Server,
    Gauge,
    CheckCircle2,
    XCircle,
    Download,
    RefreshCw,
    Trash2,
    Play,
    Copy,
    Check,
    Layers,
    Plus,
    Database,
    Vibrate,
    Sun,
} from 'lucide-react';
import {
    getMonitoringLogsApi,
    clearMonitoringLogsApi,
    submitFeedbackApi,
    predictSignApi,
    API_BASE_URL,
} from '../services/api';
import type { MonitoringStatsResponse } from '../types';
import { REAL_SIBI_SAMPLES, REAL_SIBI_LETTERS } from '../services/sampleLandmarks';

interface CloudMonitoringViewProps {
    currentSessionId: string | null;
}

interface ConcurrencyBenchmarkRow {
    concurrency: number;
    totalRequests: number;
    throughput: number;
    p50Ms: number;
    p95Ms: number;
    errorRate: number;
}

interface SessionMeta {
    sessionId: string;
    sessionNumber: number;
    label: string;
    count: number;
    firstTimestamp: string;
}

const calcPercentile = (arr: number[], p: number): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
};

export const CloudMonitoringView: React.FC<CloudMonitoringViewProps> = ({ currentSessionId }) => {
    const [stats, setStats] = useState<MonitoringStatsResponse>({
        total_logs: 0,
        avg_latency_ms: 0,
        p50_latency_ms: 0,
        p95_latency_ms: 0,
        avg_confidence: 0,
        server_memory_mb: 128,
        logs: [],
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('ALL');
    const [activeBenchSessionId, setActiveBenchSessionId] = useState<string>(() =>
        crypto.randomUUID()
    );
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
    const [benchmarkProgress, setBenchmarkProgress] = useState<string>('');
    const [concurrencyResults, setConcurrencyResults] = useState<ConcurrencyBenchmarkRow[]>([]);
    const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const data = await getMonitoringLogsApi(undefined, 500);
            setStats(data);
        } catch (err) {
            console.error('Gagal mengambil log monitoring:', err);
            setErrorMsg(
                `Gagal terhubung ke endpoint ${API_BASE_URL}/logs. Pastikan backend FastAPI aktif.`
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        const timer = setInterval(fetchLogs, 5000);
        return () => clearInterval(timer);
    }, [fetchLogs]);

    // Bangun daftar sesi pengujian secara kronologis (Sesi #1, Sesi #2, ...)
    const sessionMetaList = useMemo<SessionMeta[]>(() => {
        const map = new Map<string, { count: number; earliest: string }>();
        const chronological = [...stats.logs].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        for (const item of chronological) {
            const existing = map.get(item.session_id);
            if (!existing) {
                map.set(item.session_id, { count: 1, earliest: item.created_at });
            } else {
                existing.count += 1;
            }
        }

        const list: SessionMeta[] = [];
        let index = 1;
        for (const [sid, info] of map.entries()) {
            const timeStr = new Date(info.earliest).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
            });
            const isLiveCam = currentSessionId && sid === currentSessionId;
            list.push({
                sessionId: sid,
                sessionNumber: index,
                label: `Sesi #${index}${isLiveCam ? ' (Live Cam)' : ''} — ${timeStr} (${info.count} sampel)`,
                count: info.count,
                firstTimestamp: info.earliest,
            });
            index += 1;
        }
        return list;
    }, [stats.logs, currentSessionId]);

    const sessionNumberMap = useMemo<Record<string, number>>(() => {
        const rec: Record<string, number> = {};
        for (const meta of sessionMetaList) {
            rec[meta.sessionId] = meta.sessionNumber;
        }
        return rec;
    }, [sessionMetaList]);

    const nextSessionNumber = useMemo(() => {
        if (sessionNumberMap[activeBenchSessionId]) {
            return sessionNumberMap[activeBenchSessionId];
        }
        return sessionMetaList.length + 1;
    }, [sessionMetaList, sessionNumberMap, activeBenchSessionId]);

    const filteredLogs = useMemo(() => {
        if (selectedSessionFilter === 'ALL') return stats.logs;
        return stats.logs.filter((l) => l.session_id === selectedSessionFilter);
    }, [stats.logs, selectedSessionFilter]);

    const displayStats = useMemo(() => {
        if (selectedSessionFilter === 'ALL' || filteredLogs.length === 0) {
            if (selectedSessionFilter !== 'ALL' && filteredLogs.length === 0) {
                return {
                    total_logs: 0,
                    avg_latency_ms: 0,
                    p50_latency_ms: 0,
                    p95_latency_ms: 0,
                    avg_confidence: 0,
                    server_memory_mb: stats.server_memory_mb,
                };
            }
            return stats;
        }
        const validLatencies = filteredLogs
            .map((l) => l.latency_ms)
            .filter((v): v is number => v != null && v > 0);
        const avgLat =
            validLatencies.length > 0
                ? validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length
                : 0;
        const p50Lat = calcPercentile(validLatencies, 50);
        const p95Lat = calcPercentile(validLatencies, 95);
        const avgConf =
            filteredLogs.reduce((acc, l) => acc + l.confidence, 0) / filteredLogs.length;
        const latestMem = filteredLogs[0]?.memory_mb ?? stats.server_memory_mb;

        return {
            total_logs: filteredLogs.length,
            avg_latency_ms: avgLat,
            p50_latency_ms: p50Lat,
            p95_latency_ms: p95Lat,
            avg_confidence: avgConf,
            server_memory_mb: latestMem,
        };
    }, [selectedSessionFilter, filteredLogs, stats]);

    const handleCreateNewTestSession = () => {
        const newSid = crypto.randomUUID();
        setActiveBenchSessionId(newSid);
        setSelectedSessionFilter('ALL');
    };

    const handleFeedback = async (translationId: number, isCorrect: boolean) => {
        let correctedLabel: string | undefined = undefined;
        if (!isCorrect) {
            const input = window.prompt('Masukkan huruf sebenarnya (A-Z) jika prediksi salah:', '');
            if (input === null) return;
            correctedLabel = input.trim().toUpperCase().slice(0, 1) || undefined;
        }
        try {
            await submitFeedbackApi(translationId, isCorrect, correctedLabel);
            await fetchLogs();
        } catch (err) {
            console.error('Gagal menyimpan feedback:', err);
        }
    };

    const handleClearLogs = async () => {
        const isSpecific = selectedSessionFilter !== 'ALL';
        const targetLabel = isSpecific
            ? `Sesi #${sessionNumberMap[selectedSessionFilter] || '?'}`
            : 'SELURUH sesi pengujian';
        if (!window.confirm(`Hapus riwayat log untuk ${targetLabel}?`)) return;
        try {
            const targetSession = isSpecific ? selectedSessionFilter : undefined;
            await clearMonitoringLogsApi(targetSession);
            if (isSpecific) setSelectedSessionFilter('ALL');
            await fetchLogs();
        } catch (err) {
            console.error('Gagal menghapus log:', err);
        }
    };

    const runCloudBenchmark = async () => {
        setIsBenchmarking(true);
        setErrorMsg(null);

        const targetBenchSession =
            sessionNumberMap[activeBenchSessionId] != null
                ? crypto.randomUUID()
                : activeBenchSessionId;
        setActiveBenchSessionId(targetBenchSession);

        const tiers = [
            { concurrency: 1, totalRequests: 20 },
            { concurrency: 10, totalRequests: 40 },
            { concurrency: 50, totalRequests: 50 },
        ];
        const results: ConcurrencyBenchmarkRow[] = [];

        try {
            for (const tier of tiers) {
                setBenchmarkProgress(
                    `Sesi #${sessionMetaList.length + 1}: Concurrency ${tier.concurrency} (${tier.totalRequests} req)...`
                );
                const latencies: number[] = [];
                let failures = 0;
                const tStart = performance.now();

                let lastMeasuredRtt = 68;
                for (let i = 0; i < tier.totalRequests; i += tier.concurrency) {
                    const batchSize = Math.min(tier.concurrency, tier.totalRequests - i);
                    const promises = Array.from({ length: batchSize }, async (_, batchOffset) => {
                        const sampleIdx = i + batchOffset;
                        const letterKey = REAL_SIBI_LETTERS[sampleIdx % REAL_SIBI_LETTERS.length];
                        const landmarksSample = REAL_SIBI_SAMPLES[letterKey];
                        const simulatedLux = 410 + (sampleIdx % 8) * 12;
                        const reqStart = performance.now();
                        try {
                            await predictSignApi({
                                session_id: targetBenchSession,
                                landmarks: landmarksSample,
                                latency_ms: lastMeasuredRtt,
                                fps: 30,
                                lux: simulatedLux,
                                hand_scale: 'Ideal',
                            });
                            const rtt = Math.round(performance.now() - reqStart);
                            lastMeasuredRtt = rtt;
                            latencies.push(rtt);
                        } catch {
                            failures += 1;
                        }
                    });
                    await Promise.all(promises);
                }

                const totalSec = (performance.now() - tStart) / 1000;
                const throughput = totalSec > 0 ? tier.totalRequests / totalSec : 0;
                const p50 = calcPercentile(latencies, 50);
                const p95 = calcPercentile(latencies, 95);
                const errRate = (failures / tier.totalRequests) * 100;

                results.push({
                    concurrency: tier.concurrency,
                    totalRequests: tier.totalRequests,
                    throughput: Number(throughput.toFixed(2)),
                    p50Ms: Number(p50.toFixed(2)),
                    p95Ms: Number(p95.toFixed(2)),
                    errorRate: Number(errRate.toFixed(1)),
                });
            }

            setConcurrencyResults(results);
            await fetchLogs();
            setSelectedSessionFilter(targetBenchSession);
        } catch (err) {
            console.error('Benchmark gagal:', err);
            setErrorMsg('Pengujian beban gagal dijalankan. Periksa koneksi ke backend.');
        } finally {
            setIsBenchmarking(false);
            setBenchmarkProgress('');
        }
    };

    const handleExportCsv = () => {
        if (filteredLogs.length === 0) return;
        const headers = [
            'No',
            'Sesi_Ke',
            'ID_Log',
            'Waktu_UTC',
            'Session_ID',
            'Huruf_Prediksi',
            'Confidence_Pct',
            'Latensi_ms',
            'FPS',
            'Server_RAM_MB',
            'Lux',
            'Skala_Jarak',
            'Status_Verifikasi',
            'Label_Koreksi',
        ];
        const rows = filteredLogs.map((log, index) => [
            index + 1,
            `Sesi #${sessionNumberMap[log.session_id] || 1}`,
            log.id,
            new Date(log.created_at).toISOString(),
            log.session_id,
            log.predicted_class,
            (log.confidence * 100).toFixed(2),
            log.latency_ms ?? 0,
            log.fps ?? 0,
            log.memory_mb ?? displayStats.server_memory_mb,
            log.lux ?? 0,
            log.hand_scale ?? '-',
            log.is_correct === true
                ? 'Sesuai'
                : log.is_correct === false
                ? 'Tidak Sesuai'
                : 'Belum Diverifikasi',
            log.corrected_label ?? '-',
        ]);

        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        const sessionSuffix =
            selectedSessionFilter === 'ALL'
                ? 'semua_sesi'
                : `sesi_${sessionNumberMap[selectedSessionFilter] || 1}`;
        link.setAttribute(
            'download',
            `log_pengujian_cloud_sibi_${sessionSuffix}_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const avgSec = (displayStats.avg_latency_ms || 45) / 1000;
    const ramGb = (displayStats.server_memory_mb || 245) / 1024;
    const vcpuSec = avgSec * 1.0;
    const ramGbSec = avgSec * ramGb;
    const costPerReqUsd = vcpuSec * 0.00000556 + ramGbSec * 0.00000278;
    const costPer1000Usd = costPerReqUsd * 1000;
    const costMonthlyUsd = costPer1000Usd * 30;

    const handleCopyMarkdown = () => {
        const sessionTitle =
            selectedSessionFilter === 'ALL'
                ? `Seluruh Sesi (${sessionMetaList.length} Sesi)`
                : `Sesi #${sessionNumberMap[selectedSessionFilter] || 1}`;
        const md = [
            `### Metrik Performa Permintaan Tunggal (${sessionTitle})`,
            `| Metrik | Nilai |`,
            `|---|---|`,
            `| Latensi rata-rata (ms) | ${displayStats.avg_latency_ms.toFixed(2)} ms |`,
            `| Latensi median / p50 (ms) | ${displayStats.p50_latency_ms.toFixed(2)} ms |`,
            `| Latensi persentil ke-95 / p95 (ms) | ${displayStats.p95_latency_ms.toFixed(2)} ms |`,
            `| Penggunaan memori saat aktif (MB) | ${displayStats.server_memory_mb.toFixed(1)} MB |`,
            ``,
            `### Performa di Bawah Beban Bersamaan (Concurrent)`,
            `| Jumlah Request Concurrent | Throughput (req/detik) | Latensi p50 (ms) | Latensi p95 (ms) | Error Rate |`,
            `|---|---|---|---|---|`,
            ...(concurrencyResults.length > 0
                ? concurrencyResults.map(
                      (r) =>
                          `| ${r.concurrency} | ${r.throughput.toFixed(2)} | ${r.p50Ms.toFixed(2)} | ${r.p95Ms.toFixed(2)} | ${r.errorRate.toFixed(1)}% |`
                  )
                : [
                      `| 1 | - | ${displayStats.p50_latency_ms.toFixed(2)} | ${displayStats.p95_latency_ms.toFixed(2)} | 0.0% |`,
                  ]),
            ``,
            `### Estimasi Biaya Operasional`,
            `| Komponen | Nilai |`,
            `|---|---|`,
            `| Compute time terpakai per request (vCPU-detik) | ${vcpuSec.toFixed(5)} |`,
            `| Memori terpakai per request (GB-detik) | ${ramGbSec.toFixed(5)} |`,
            `| Estimasi biaya per 1.000 request | $${costPer1000Usd.toFixed(5)} USD (~Rp ${(costPer1000Usd * 16000).toFixed(2)}) |`,
            `| Estimasi biaya bulanan (1.000 request/hari) | $${costMonthlyUsd.toFixed(4)} USD (~Rp ${(costMonthlyUsd * 16000).toFixed(0)}) |`,
        ].join('\n');

        navigator.clipboard.writeText(md);
        setCopiedMarkdown(true);
        setTimeout(() => setCopiedMarkdown(false), 2500);
    };

    return (
        <div className="flex flex-col gap-4 sm:gap-5 w-full">
            {/* Panel Header Kontrol */}
            <div className="bg-white dark:bg-[#111113] p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="hidden sm:flex w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 items-center justify-center shrink-0 mt-0.5">
                        <Server className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700">
                                <Activity className="w-3 h-3" />
                                CLOUD INFERENCE TELEMETRY
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                <Layers className="w-3 h-3" />
                                {sessionMetaList.length} SESI TERCATAT
                            </span>
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">
                                {API_BASE_URL}
                            </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Observabilitas &amp; Benchmark Inferensi Cloud S-GCN
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Evaluasi kuantitatif latensi permintaan tunggal, throughput beban konkuren (1, 10, 50), dan pemakaian sumber daya kontainer per sesi.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button
                        onClick={runCloudBenchmark}
                        disabled={isBenchmarking}
                        className="px-3.5 py-2 rounded-md text-xs font-medium bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                            {isBenchmarking
                                ? benchmarkProgress || 'Menguji...'
                                : `Jalankan Uji Beban (Sesi #${sessionMetaList.length + 1})`}
                        </span>
                    </button>

                    <button
                        onClick={handleCreateNewTestSession}
                        className="px-3 py-2 rounded-md text-xs font-medium bg-zinc-100/80 dark:bg-[#18181B] hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Siapkan ID Sesi Pengujian Baru"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Sesi Baru (#{nextSessionNumber})</span>
                    </button>

                    <button
                        onClick={handleCopyMarkdown}
                        className="px-3 py-2 rounded-md text-xs font-medium bg-zinc-100/80 dark:bg-[#18181B] hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                        {copiedMarkdown ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Tersalin</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Ringkasan</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleExportCsv}
                        disabled={filteredLogs.length === 0}
                        className="px-3 py-2 rounded-md text-xs font-medium bg-zinc-100/80 dark:bg-[#18181B] hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                    </button>

                    <button
                        onClick={fetchLogs}
                        className="p-2 rounded-md bg-zinc-100/80 dark:bg-[#18181B] hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
                        title="Muat Ulang Log"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={handleClearLogs}
                        className="p-2 rounded-md bg-zinc-100/80 dark:bg-[#18181B] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
                        title="Bersihkan Riwayat Log"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-300 px-4 py-2.5 rounded-lg text-xs font-mono">
                    {errorMsg}
                </div>
            )}

            {/* 5 Kartu KPI Metrik dengan Ikon Terstruktur */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Total Request
                        </span>
                        <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center">
                            <Activity className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-2">
                        {displayStats.total_logs}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 mt-1">
                        Mean Conf: {(displayStats.avg_confidence * 100).toFixed(1)}%
                    </p>
                </div>

                <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Latensi Rata-rata
                        </span>
                        <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-2">
                        {displayStats.avg_latency_ms.toFixed(1)}
                        <span className="text-xs font-normal text-zinc-400 ml-1">ms</span>
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-1">
                        SLA Target &lt; 2000 ms
                    </p>
                </div>

                <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Median (p50)
                        </span>
                        <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center">
                            <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-2">
                        {displayStats.p50_latency_ms.toFixed(1)}
                        <span className="text-xs font-normal text-zinc-400 ml-1">ms</span>
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-1">
                        Persentil ke-50
                    </p>
                </div>

                <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Tail Latency (p95)
                        </span>
                        <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center">
                            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-2">
                        {displayStats.p95_latency_ms.toFixed(1)}
                        <span className="text-xs font-normal text-zinc-400 ml-1">ms</span>
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-1">
                        Persentil ke-95
                    </p>
                </div>

                <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            RAM Kontainer
                        </span>
                        <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center">
                            <Server className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold tracking-tight font-mono tabular-nums text-zinc-900 dark:text-zinc-100 mt-2">
                        {displayStats.server_memory_mb.toFixed(1)}
                        <span className="text-xs font-normal text-zinc-400 ml-1">MB</span>
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 mt-1">
                        Est. ${costPer1000Usd.toFixed(5)} / 1k req
                    </p>
                </div>
            </div>

            {/* Hasil Uji Beban Concurrent jika sudah dijalankan */}
            {concurrencyResults.length > 0 && (
                <div className="bg-white dark:bg-[#111113] p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <span>Hasil Pengujian Beban Bersamaan (Concurrent Load)</span>
                        </h3>
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                            COMPLETED
                        </span>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-zinc-50 dark:bg-[#18181B] border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                <tr>
                                    <th className="py-2.5 px-3 font-medium">Concurrency</th>
                                    <th className="py-2.5 px-3 font-medium text-right">Total Sampel</th>
                                    <th className="py-2.5 px-3 font-medium text-right">Throughput (req/s)</th>
                                    <th className="py-2.5 px-3 font-medium text-right">Latensi p50 (ms)</th>
                                    <th className="py-2.5 px-3 font-medium text-right">Latensi p95 (ms)</th>
                                    <th className="py-2.5 px-3 font-medium text-right">Error Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800 font-mono tabular-nums">
                                {concurrencyResults.map((row) => (
                                    <tr
                                        key={row.concurrency}
                                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 text-zinc-800 dark:text-zinc-200"
                                    >
                                        <td className="py-2.5 px-3 font-semibold">{row.concurrency}</td>
                                        <td className="py-2.5 px-3 text-right">{row.totalRequests}</td>
                                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                            {row.throughput.toFixed(2)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">{row.p50Ms.toFixed(2)}</td>
                                        <td className="py-2.5 px-3 text-right">{row.p95Ms.toFixed(2)}</td>
                                        <td className="py-2.5 px-3 text-right">{row.errorRate.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tabel Riwayat Log Inferensi Real-Time */}
            <div className="bg-white dark:bg-[#111113] p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center shrink-0 mt-0.5">
                            <Database className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Riwayat Rekaman Aksi &amp; Inferensi Cloud
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Pilih sesi pengujian pada dropdown di kanan untuk memisahkan data antar pengambilan sampel.
                            </p>
                        </div>
                    </div>

                    {/* Dropdown Pemilih Sesi Pengujian */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 w-full sm:w-auto">
                            <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                Filter Sesi:
                            </span>
                            <select
                                value={selectedSessionFilter}
                                onChange={(e) => setSelectedSessionFilter(e.target.value)}
                                className="bg-transparent text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer w-full sm:w-auto"
                            >
                                <option
                                    value="ALL"
                                    className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                                >
                                    Semua Sesi ({stats.logs.length} sampel)
                                </option>
                                {sessionMetaList.map((s) => (
                                    <option
                                        key={s.sessionId}
                                        value={s.sessionId}
                                        className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                                    >
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[440px] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-zinc-50 dark:bg-[#18181B] border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sticky top-0 z-10">
                            <tr>
                                <th className="py-2.5 px-3 font-medium">No</th>
                                <th className="py-2.5 px-3 font-medium">Sesi Uji</th>
                                <th className="py-2.5 px-3 font-medium">Waktu</th>
                                <th className="py-2.5 px-3 font-medium">Huruf</th>
                                <th className="py-2.5 px-3 font-medium text-right">Confidence</th>
                                <th className="py-2.5 px-3 font-medium text-right">Latensi</th>
                                <th className="py-2.5 px-3 font-medium text-right">RAM</th>
                                <th className="py-2.5 px-3 font-medium">Kondisi (Lux / Jarak)</th>
                                <th className="py-2.5 px-3 font-medium">Status Haptik IoT</th>
                                <th className="py-2.5 px-3 font-medium text-center">Verifikasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        className="py-10 text-center text-zinc-400 dark:text-zinc-500 font-mono text-xs"
                                    >
                                        Belum ada rekaman inferensi pada sesi ini. Nyalakan kamera atau klik &quot;Jalankan Uji Beban&quot;.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log, idx) => {
                                    const confPct = (log.confidence * 100).toFixed(1);
                                    const isHighConf = log.confidence >= 0.75;
                                    const sNum = sessionNumberMap[log.session_id] || 1;
                                    return (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-200 transition-colors"
                                        >
                                            <td className="py-2 px-3 font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                                                {idx + 1}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                                    Sesi #{sNum}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                                                {new Date(log.created_at).toLocaleTimeString('id-ID')}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono font-semibold text-xs">
                                                    {log.predicted_class}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-mono tabular-nums text-right font-medium">
                                                <span
                                                    className={
                                                        isHighConf
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-amber-600 dark:text-amber-400'
                                                    }
                                                >
                                                    {confPct}%
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-mono tabular-nums text-right text-zinc-800 dark:text-zinc-200">
                                                {log.latency_ms ?? '-'} ms
                                            </td>
                                            <td className="py-2 px-3 font-mono tabular-nums text-right text-zinc-500 dark:text-zinc-400">
                                                {log.memory_mb ?? displayStats.server_memory_mb} MB
                                            </td>
                                            <td className="py-2 px-3 font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                                                <span className="inline-flex items-center gap-1">
                                                    <Sun className="w-3 h-3 text-amber-500" />
                                                    {log.lux ? `${log.lux} lx` : '-'} / {log.hand_scale || '-'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono border ${
                                                        isHighConf
                                                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                                                            : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                                                    }`}
                                                >
                                                    <Vibrate className="w-3 h-3" />
                                                    {isHighConf ? 'Getar Pendek (OK)' : 'Getar Panjang'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleFeedback(log.id, true)}
                                                        className={`p-1 rounded-md cursor-pointer transition-colors border ${
                                                            log.is_correct === true
                                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                                : 'bg-zinc-100/80 dark:bg-[#18181B] text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 border-zinc-200 dark:border-zinc-800'
                                                        }`}
                                                        title="Tandai Sesuai (Benar)"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleFeedback(log.id, false)}
                                                        className={`p-1 rounded-md cursor-pointer transition-colors border ${
                                                            log.is_correct === false
                                                                ? 'bg-rose-600 text-white border-rose-600'
                                                                : 'bg-zinc-100/80 dark:bg-[#18181B] text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border-zinc-200 dark:border-zinc-800'
                                                        }`}
                                                        title="Tandai Tidak Sesuai (Salah)"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                    {log.is_correct === false && log.corrected_label && (
                                                        <span className="text-[10px] font-mono font-medium text-rose-600 dark:text-rose-400 ml-1">
                                                            [{log.corrected_label}]
                                                        </span>
                                                    )}
                                                </div>
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
