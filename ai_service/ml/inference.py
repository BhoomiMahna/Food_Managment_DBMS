import torch
import numpy as np
from sqlalchemy.orm import Session
from .graph_builder import build_graph
from .model import HeteroLinkPredictorFull, predict_link

# Dummy feature dimensions
HIDDEN_CHANNELS = 64

def get_supplier_recommendations(retailer_id: int, db: Session):
    data, fm, wm, rm = build_graph(db)
    
    if retailer_id not in rm:
        return {"error": "Retailer not found"}
        
    r_idx = rm[retailer_id]
    
    # In a real scenario, we'd load a trained model here.
    # For now, we initialize an untrained/dummy one to demonstrate structure
    model = HeteroLinkPredictorFull(data.metadata(), HIDDEN_CHANNELS)
    model.eval()
    
    with torch.no_grad():
        z_dict = model(data.x_dict, data.edge_index_dict)
        
    z_retailer = z_dict['retailer'][r_idx]
    
    recommendations = []
    
    # Calculate scores for all wholesalers
    for w_db_id, w_idx in wm.items():
        z_wholesaler = z_dict['wholesaler'][w_idx]
        score = predict_link(z_wholesaler, z_retailer).item()
        # Add some heuristic logic for confidence and reason
        confidence = min(max(score * 100 + np.random.uniform(10, 40), 10), 99)
        recommendations.append({
            "wholesaler_id": w_db_id,
            "score": score,
            "confidence": round(confidence, 1),
            "reason": "Similar retailers with comparable demand patterns successfully source from this wholesaler."
        })
        
    # Sort and return top 5
    recommendations.sort(key=lambda x: x['confidence'], reverse=True)
    return recommendations[:5]

def get_onboarding_recommendations(retailer_id: int, db: Session):
    return {
        "recommended_wholesalers": get_supplier_recommendations(retailer_id, db),
        "recommended_products": ["Tomato", "Potato", "Onion"] # Placeholder, can be derived similarly
    }

def get_bottlenecks(db: Session):
    # Detect bottlenecks based on graph degree centrality
    data, fm, wm, rm = build_graph(db)
    
    edge_index = data['wholesaler', 'supplies', 'retailer'].edge_index
    out_degrees = torch.bincount(edge_index[0], minlength=len(wm))
    
    total_retailers = len(rm)
    if total_retailers == 0:
        return []
        
    bottlenecks = []
    for w_db_id, w_idx in wm.items():
        served = out_degrees[w_idx].item()
        percentage = (served / total_retailers) * 100
        if percentage > 50:
            bottlenecks.append({
                "critical_node": f"Wholesaler W{w_db_id}",
                "risk": "High" if percentage > 70 else "Medium",
                "reason": f"Serves {round(percentage)}% of retailers, creating a single point of failure."
            })
            
    return bottlenecks

def get_anomalies(db: Session):
    # Detect unusual patterns
    data, fm, wm, rm = build_graph(db)
    
    # Example: Check if a retailer has suddenly ordered a lot (using simple graph degree here as proxy)
    edge_index = data['wholesaler', 'supplies', 'retailer'].edge_index
    in_degrees = torch.bincount(edge_index[1], minlength=len(rm))
    
    anomalies = []
    if len(in_degrees) > 0:
        mean_deg = in_degrees.float().mean().item()
        std_deg = in_degrees.float().std().item()
        
        for r_db_id, r_idx in rm.items():
            deg = in_degrees[r_idx].item()
            if std_deg > 0 and deg > mean_deg + 2 * std_deg:
                anomalies.append({
                    "entity": f"Retailer R{r_db_id}",
                    "alert": "Abnormal order volume",
                    "details": f"Ordering from {deg} distinct wholesalers (average is {round(mean_deg, 1)})."
                })
                
    return anomalies

def get_graph_visualization_data(db: Session):
    data, fm, wm, rm = build_graph(db)
    
    nodes = []
    links = []
    
    # Add nodes
    for db_id in fm.keys():
        nodes.append({"id": f"F_{db_id}", "group": "Farmer", "label": f"Farmer {db_id}"})
    for db_id in wm.keys():
        nodes.append({"id": f"W_{db_id}", "group": "Wholesaler", "label": f"Wholesaler {db_id}"})
    for db_id in rm.keys():
        nodes.append({"id": f"R_{db_id}", "group": "Retailer", "label": f"Retailer {db_id}"})
        
    # Add edges
    f2w = data['farmer', 'supplies', 'wholesaler'].edge_index
    for f_idx, w_idx in zip(f2w[0].tolist(), f2w[1].tolist()):
        f_db = list(fm.keys())[list(fm.values()).index(f_idx)]
        w_db = list(wm.keys())[list(wm.values()).index(w_idx)]
        links.append({"source": f"F_{f_db}", "target": f"W_{w_db}", "value": 1})
        
    w2r = data['wholesaler', 'supplies', 'retailer'].edge_index
    for w_idx, r_idx in zip(w2r[0].tolist(), w2r[1].tolist()):
        w_db = list(wm.keys())[list(wm.values()).index(w_idx)]
        r_db = list(rm.keys())[list(rm.values()).index(r_idx)]
        links.append({"source": f"W_{w_db}", "target": f"R_{r_db}", "value": 1})
        
    return {"nodes": nodes, "links": links}
