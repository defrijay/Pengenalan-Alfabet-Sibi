"""
Konversi 21 landmark tangan (x, y, z) -> torch_geometric.data.Data.

Fitur & topologi graf HARUS identik dengan yang dipakai saat training
(notebook Section 4 & 19.1.1), karena model dilatih dengan representasi ini:

  - edge_index: 21 node, 23 koneksi tulang tangan, dibuat bidirectional
  - fitur per node (5 dim):
      [0:3] -> (x, y, z) yang sudah di-center (dikurangi rata-rata 21
               landmark) dan di-scale (dibagi jarak Euclidean maksimum
               ke pusat) -> translation & scale invariant
      [3]   -> jarak node ke wrist (landmark index 0)
      [4]   -> jarak node ke pusat telapak (rata-rata landmark 0,5,9,13,17)
"""

import numpy as np
import torch
from torch_geometric.data import Batch, Data

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (0, 9), (9, 10), (10, 11), (11, 12),
    (0, 13), (13, 14), (14, 15), (15, 16),
    (0, 17), (17, 18), (18, 19), (19, 20),
    (5, 9), (9, 13), (13, 17),
]
_EDGES_BIDIR = HAND_CONNECTIONS + [(j, i) for i, j in HAND_CONNECTIONS]
EDGE_INDEX = torch.tensor(_EDGES_BIDIR, dtype=torch.long).t().contiguous()

PALM_LANDMARK_IDX = [0, 5, 9, 13, 17]


def build_graph(landmarks: list[tuple[float, float, float]]) -> Data:
    """landmarks: list 21 tuple (x, y, z) dari MediaPipe Hands, urutan index asli."""
    lm = np.array(landmarks, dtype=np.float32)
    if lm.shape != (21, 3):
        raise ValueError(f"Diharapkan 21 landmark x (x,y,z), diterima shape {lm.shape}")

    center = lm.mean(axis=0)
    lm_centered = lm - center
    scale = np.max(np.linalg.norm(lm_centered, axis=1)) + 1e-8
    lm_norm = lm_centered / scale

    wrist = lm_norm[0]
    dist_to_wrist = np.linalg.norm(lm_norm - wrist, axis=1, keepdims=True)

    palm_center = lm_norm[PALM_LANDMARK_IDX].mean(axis=0)
    dist_to_palm = np.linalg.norm(lm_norm - palm_center, axis=1, keepdims=True)

    features = np.concatenate([lm_norm, dist_to_wrist, dist_to_palm], axis=1)  # (21, 5)
    x = torch.tensor(features, dtype=torch.float)
    return Data(x=x, edge_index=EDGE_INDEX)


def build_batch(landmarks: list[tuple[float, float, float]]) -> Batch:
    """Bungkus satu graf jadi Batch berisi 1 sampel, siap masuk ke model.forward()."""
    graph = build_graph(landmarks)
    return Batch.from_data_list([graph])
