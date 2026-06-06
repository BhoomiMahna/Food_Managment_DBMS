import pandas as pd
import torch
from torch_geometric.data import HeteroData
from sqlalchemy.orm import Session
import os

def build_graph(db: Session):
    # Fetch Data
    query_farmers = "SELECT id, name FROM FARMER;"
    query_wholesalers = "SELECT id, name FROM WHOLESALER;"
    query_retailers = "SELECT id, name FROM RETAILER;"
    query_crops = "SELECT id, name, category, base_price_per_kg FROM CROP;"
    
    # Using pandas to read sql
    farmers_df = pd.read_sql(query_farmers, db.connection())
    wholesalers_df = pd.read_sql(query_wholesalers, db.connection())
    retailers_df = pd.read_sql(query_retailers, db.connection())
    crops_df = pd.read_sql(query_crops, db.connection())

    # Edges
    # In the base schema, we infer relationships based on common crops and cities.
    # Wholesaler -> Retailer (if they trade the same crop)
    query_w2r = """
    SELECT w.wholesaler_id, r.retailer_id, COUNT(w.crop_id) as interaction_count, SUM(w.quantity_kg) as volume
    FROM WHOLESALER_STOCK w
    JOIN RETAIL_STOCK r ON w.crop_id = r.crop_id
    GROUP BY w.wholesaler_id, r.retailer_id;
    """
    try:
        w2r_df = pd.read_sql(query_w2r, db.connection())
    except Exception as e:
        w2r_df = pd.DataFrame(columns=['wholesaler_id', 'retailer_id'])
        print(f"Error fetching w2r: {e}")

    # Farmer -> Wholesaler (base schema has no production table, we infer by city)
    query_f2w = """
    SELECT f.id as farmer_id, w.id as wholesaler_id, 1 as interaction_count, 100 as volume
    FROM FARMER f
    JOIN WHOLESALER w ON f.city = w.city;
    """
    try:
        f2w_df = pd.read_sql(query_f2w, db.connection())
    except Exception as e:
        f2w_df = pd.DataFrame(columns=['farmer_id', 'wholesaler_id'])
        print(f"Error fetching f2w: {e}")

    # Create mapping from db ID to node index
    farmer_mapping = {id: i for i, id in enumerate(farmers_df['id'].tolist())}
    wholesaler_mapping = {id: i for i, id in enumerate(wholesalers_df['id'].tolist())}
    retailer_mapping = {id: i for i, id in enumerate(retailers_df['id'].tolist())}
    crop_mapping = {id: i for i, id in enumerate(crops_df['id'].tolist())}

    data = HeteroData()

    # Features
    # In PyTorch Geometric, we need node feature matrices [num_nodes, num_features]
    
    # We initialize with random normal vectors since base tables lack distinct numerical features
    num_farmers = len(farmer_mapping) if len(farmer_mapping) > 0 else 1
    data['farmer'].x = torch.randn((num_farmers, 16), dtype=torch.float)

    num_wholesalers = len(wholesaler_mapping) if len(wholesaler_mapping) > 0 else 1
    data['wholesaler'].x = torch.randn((num_wholesalers, 16), dtype=torch.float)

    num_retailers = len(retailer_mapping) if len(retailer_mapping) > 0 else 1
    data['retailer'].x = torch.randn((num_retailers, 16), dtype=torch.float)
    
    # Edges
    # farmer -> wholesaler
    src_f2w = [farmer_mapping[f] for f in f2w_df['farmer_id'] if f in farmer_mapping]
    dst_f2w = [wholesaler_mapping[w] for w, f in zip(f2w_df['wholesaler_id'], f2w_df['farmer_id']) if f in farmer_mapping and w in wholesaler_mapping]
    data['farmer', 'supplies', 'wholesaler'].edge_index = torch.tensor([src_f2w, dst_f2w], dtype=torch.long)
    
    # wholesaler -> retailer
    src_w2r = [wholesaler_mapping[w] for w in w2r_df['wholesaler_id'] if w in wholesaler_mapping]
    dst_w2r = [retailer_mapping[r] for r, w in zip(w2r_df['retailer_id'], w2r_df['wholesaler_id']) if w in wholesaler_mapping and r in retailer_mapping]
    data['wholesaler', 'supplies', 'retailer'].edge_index = torch.tensor([src_w2r, dst_w2r], dtype=torch.long)
    
    # reverse edges for message passing in both directions
    data['wholesaler', 'supplied_by', 'farmer'].edge_index = torch.tensor([dst_f2w, src_f2w], dtype=torch.long)
    data['retailer', 'supplied_by', 'wholesaler'].edge_index = torch.tensor([dst_w2r, src_w2r], dtype=torch.long)

    return data, farmer_mapping, wholesaler_mapping, retailer_mapping

if __name__ == "__main__":
    from database import SessionLocal
    db = SessionLocal()
    data, fm, wm, rm = build_graph(db)
    print("Graph constructed successfully:")
    print(data)
