import torch
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv, to_hetero

class GNN(torch.nn.Module):
    def __init__(self, hidden_channels, out_channels):
        super().__init__()
        # We define a homogeneous GNN which will be adapted
        self.conv1 = SAGEConv((-1, -1), hidden_channels)
        self.conv2 = SAGEConv((-1, -1), out_channels)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = x.relu()
        x = self.conv2(x, edge_index)
        return x

class HeteroLinkPredictor(torch.nn.Module):
    def __init__(self, metadata, hidden_channels):
        super().__init__()
        # Embeddings for nodes
        self.gnn = to_hetero(GNN(hidden_channels, hidden_channels), metadata, aggr='sum')
        
    def forward(self, x_dict, edge_index_dict, edge_label_index):
        # Obtain node embeddings from the GNN
        z_dict = self.gnn(x_dict, edge_index_dict)
        
        # Link prediction: Dot product between node embeddings
        src_nodes = edge_label_index[0]
        dst_nodes = edge_label_index[1]
        
        # Depending on which edge we predict. For Supplier recommendation:
        # Predict Wholesaler -> Retailer (or Farmer -> Wholesaler)
        # Assuming edge_label_index belongs to ('wholesaler', 'supplies', 'retailer')
        z_src = z_dict['wholesaler'][src_nodes]
        z_dst = z_dict['retailer'][dst_nodes]
        
        # Compute probabilities
        out = (z_src * z_dst).sum(dim=-1)
        return torch.sigmoid(out)

class HeteroLinkPredictorFull(torch.nn.Module):
    def __init__(self, metadata, hidden_channels):
        super().__init__()
        self.gnn = to_hetero(GNN(hidden_channels, hidden_channels), metadata, aggr='sum')
        
    def forward(self, x_dict, edge_index_dict):
        # Just return the node embeddings dictionary
        return self.gnn(x_dict, edge_index_dict)

def predict_link(z_src, z_dst):
    out = (z_src * z_dst).sum(dim=-1)
    return torch.sigmoid(out)
