import torch
import torch.nn.functional as F
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from .graph_builder import build_graph
from .model import HeteroLinkPredictor
from database import SessionLocal

def train_model():
    db = SessionLocal()
    data, fm, wm, rm = build_graph(db)
    
    edge_index = data['wholesaler', 'supplies', 'retailer'].edge_index
    num_edges = edge_index.size(1)
    
    if num_edges == 0:
        print("No edges available for training.")
        return
        
    # Generate negative edges
    # Randomly sample nodes
    neg_src = torch.randint(0, len(wm), (num_edges,))
    neg_dst = torch.randint(0, len(rm), (num_edges,))
    neg_edge_index = torch.stack([neg_src, neg_dst], dim=0)
    
    # Combine positive and negative edges
    all_edge_index = torch.cat([edge_index, neg_edge_index], dim=1)
    labels = torch.cat([torch.ones(num_edges), torch.zeros(num_edges)], dim=0)
    
    # Initialize model
    model = HeteroLinkPredictor(data.metadata(), hidden_channels=32)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)
    
    model.train()
    
    # Simple training loop
    epochs = 400
    for epoch in range(epochs):
        optimizer.zero_grad()
        
        # Predict
        out = model(data.x_dict, data.edge_index_dict, all_edge_index)
        
        # Loss
        loss = F.binary_cross_entropy(out, labels)
        loss.backward()
        optimizer.step()
        
        if epoch % 10 == 0:
            print(f"Epoch {epoch:03d}, Loss: {loss.item():.4f}")
            
    # Evaluation
    model.eval()
    with torch.no_grad():
        out = model(data.x_dict, data.edge_index_dict, all_edge_index)
        preds = (out > 0.5).float().numpy()
        labels_np = labels.numpy()
        out_np = out.numpy()
        
        acc = accuracy_score(labels_np, preds)
        prec = precision_score(labels_np, preds, zero_division=0)
        rec = recall_score(labels_np, preds, zero_division=0)
        f1 = f1_score(labels_np, preds, zero_division=0)
        auc = roc_auc_score(labels_np, out_np)
        
        print("\nEvaluation Metrics:")
        print(f"Accuracy:  {acc:.4f}")
        print(f"Precision: {prec:.4f}")
        print(f"Recall:    {rec:.4f}")
        print(f"F1 Score:  {f1:.4f}")
        print(f"ROC-AUC:   {auc:.4f}")
        
    # Save model (simulated)
    # torch.save(model.state_dict(), "model.pth")
    print("\nModel trained and metrics generated.")

if __name__ == "__main__":
    train_model()
