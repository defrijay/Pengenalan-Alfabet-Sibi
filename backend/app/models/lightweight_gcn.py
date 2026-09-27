import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, global_max_pool, global_mean_pool


class LightweightGCN(nn.Module):
    """
    Arsitektur HARUS persis sama dengan yang dipakai saat training di notebook
    (Section 19.1.1), karena kita hanya memuat state_dict, bukan objek model
    utuh. Jangan ubah nama layer / urutan operasi forward().
    """

    def __init__(self, in_channels: int, hidden_channels: int, num_classes: int, dropout: float = 0.2):
        super().__init__()
        self.conv1 = GCNConv(in_channels, hidden_channels)
        self.bn1 = nn.BatchNorm1d(hidden_channels)
        self.conv2 = GCNConv(hidden_channels, hidden_channels)
        self.bn2 = nn.BatchNorm1d(hidden_channels)
        self.conv3 = GCNConv(hidden_channels, hidden_channels)
        self.bn3 = nn.BatchNorm1d(hidden_channels)
        self.dropout = nn.Dropout(dropout)
        # 2*hidden_channels karena mean-pool & max-pool digabung (concat)
        self.lin = nn.Linear(2 * hidden_channels, num_classes)

    def forward(self, data):
        x, edge_index, batch = data.x, data.edge_index, data.batch

        x = self.conv1(x, edge_index)
        x = self.bn1(x)
        x = F.relu(x)
        x = self.dropout(x)

        x = self.conv2(x, edge_index)
        x = self.bn2(x)
        x = F.relu(x)
        x = self.dropout(x)

        x = self.conv3(x, edge_index)
        x = self.bn3(x)
        x = F.relu(x)

        x_mean = global_mean_pool(x, batch)
        x_max = global_max_pool(x, batch)
        x = torch.cat([x_mean, x_max], dim=1)

        x = self.dropout(x)
        return self.lin(x)  # logit mentah, softmax diterapkan di inference_service
