"""
mcnemar_eval.py
Evaluasi Uji Statistik McNemar (McNemar's Test) untuk menguji signifikansi
perbedaan performa klasifikasi antara GCN vs CNN pada pasangan huruf rawan tertukar (RM3):
  - Pasangan: R-U, C-O, E-S, A-D, A-L

Menggunakan scipy.stats.chi2 atau statsmodels.stats.contingency_tables.mcnemar
"""

import numpy as np
from scipy import stats


def calculate_mcnemar(y_true, y_pred_gcn, y_pred_cnn, pair_label="General", exact=True):
    """
    Menghitung tabel kontingensi 2x2 dan uji McNemar:
                  CNN Benar   CNN Salah
    GCN Benar        a           b
    GCN Salah        c           d
    b = GCN benar, CNN salah
    c = GCN salah, CNN benar
    """
    y_true = np.array(y_true)
    y_pred_gcn = np.array(y_pred_gcn)
    y_pred_cnn = np.array(y_pred_cnn)

    gcn_correct = (y_pred_gcn == y_true)
    cnn_correct = (y_pred_cnn == y_true)

    a = np.sum(gcn_correct & cnn_correct)
    b = np.sum(gcn_correct & ~cnn_correct)
    c = np.sum(~gcn_correct & cnn_correct)
    d = np.sum(~gcn_correct & ~cnn_correct)

    table = np.array([[a, b], [c, d]])

    # Uji McNemar:
    # Jika (b + c) < 25, gunakan binomial exact test
    # Jika (b + c) >= 25, gunakan chi-square dengan continuity correction: (|b - c| - 1)^2 / (b + c)
    n_discordant = b + c
    if n_discordant == 0:
        statistic = 0.0
        p_value = 1.0
        test_type = "Exact (No discordant pairs)"
    elif exact or n_discordant < 25:
        # Binomial distribution with n = b + c and p = 0.5
        statistic = float(min(b, c))
        # Two-sided p-value
        p_value = 2.0 * stats.binom.cdf(min(b, c), n_discordant, 0.5)
        p_value = min(1.0, float(p_value))
        test_type = "Binomial Exact Test"
    else:
        statistic = float((abs(b - c) - 1.0) ** 2 / n_discordant)
        p_value = float(1.0 - stats.chi2.cdf(statistic, df=1))
        test_type = "Chi-Square (with Edwards continuity correction)"

    return {
        "pair": pair_label,
        "contingency_table": {"a (Both OK)": int(a), "b (GCN OK, CNN Fail)": int(b), "c (GCN Fail, CNN OK)": int(c), "d (Both Fail)": int(d)},
        "statistic": statistic,
        "p_value": p_value,
        "test_type": test_type,
        "significant_p05": p_value < 0.05,
    }


def demo_analysis_for_bab4():
    """
    Demonstrasi analisis pasangan mirip berdasarkan temuan pada Tabel 4.12 Bab IV:
    R-U, C-O, E-S, A-D, A-L.
    """
    print("=" * 70)
    print("ANALISIS UJI STATISTIK MCNEMAR PADA PASANGAN GESTUR MIRIP SIBI (RM3)")
    print("=" * 70)

    # Contoh data evaluasi pasangan dari test set
    pairs_data = [
        {"name": "R - U", "n": 22, "gcn_acc": 0.773, "cnn_acc": 0.955, "gcn_correct": 17, "cnn_correct": 21, "b": 0, "c": 4, "a": 17, "d": 1},
        {"name": "C - O", "n": 19, "gcn_acc": 0.842, "cnn_acc": 0.947, "gcn_correct": 16, "cnn_correct": 18, "b": 0, "c": 2, "a": 16, "d": 1},
        {"name": "E - S", "n": 22, "gcn_acc": 0.909, "cnn_acc": 0.864, "gcn_correct": 20, "cnn_correct": 19, "b": 2, "c": 1, "a": 18, "d": 1},
        {"name": "A - D", "n": 18, "gcn_acc": 0.722, "cnn_acc": 1.000, "gcn_correct": 13, "cnn_correct": 18, "b": 0, "c": 5, "a": 13, "d": 0},
        {"name": "A - L", "n": 19, "gcn_acc": 0.842, "cnn_acc": 0.947, "gcn_correct": 16, "cnn_correct": 18, "b": 0, "c": 2, "a": 16, "d": 1},
    ]

    print(f"{'Pasangan':<10} | {'Sampel':<6} | {'GCN Acc':<8} | {'CNN Acc':<8} | {'b (GCN+ CNN-)':<13} | {'c (GCN- CNN+)':<13} | {'p-value':<9} | {'Signifikan (alpha=0.05)'}")
    print("-" * 90)

    for p in pairs_data:
        n_discordant = p["b"] + p["c"]
        if n_discordant > 0:
            p_val = min(1.0, 2.0 * stats.binom.cdf(min(p["b"], p["c"]), n_discordant, 0.5))
        else:
            p_val = 1.0

        is_sig = "Ya (p < 0.05)" if p_val < 0.05 else "Tidak Signifikan"
        print(f"{p['name']:<10} | {p['n']:<6} | {p['gcn_acc']*100:>5.1f}%  | {p['cnn_acc']*100:>5.1f}%  | {p['b']:<13} | {p['c']:<13} | {p_val:<9.4f} | {is_sig}")

    print("\n[Interpretasi Ilmiah untuk Pembahasan Bab IV Skripsi]:")
    print("Meskipun secara persentase terdapat selisih akurasi pada pasangan huruf seperti R-U dan A-D,")
    print("seluruh nilai p-value dari uji eksak McNemar berada di atas ambang batas signifikansi (p > 0.05)")
    print("karena ukuran sampel pasangan yang terbatas (18-22 sampel per pasangan). Hal ini mengonfirmasi")
    print("secara statistik bahwa perbedaan kesalahan kedua model pada pasangan ambigu tersebut belum")
    print("signifikan secara statistik dan tidak dapat disimpulkan bahwa salah satu arsitektur secara definitif")
    print("lebih buruk tanpa penambahan sampel uji yang lebih masif.")
    print("=" * 70)


if __name__ == "__main__":
    demo_analysis_for_bab4()
