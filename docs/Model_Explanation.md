# AI Model Explanation

The AI-Powered Food Supply Chain Management System leverages advanced Graph Neural Networks (GNNs), specifically **GraphSAGE**, to model and understand the complex interactions between various entities in the supply chain.

## 1. Graph Representation
We model the supply chain as a **Heterogeneous Graph**:
- **Nodes**: Farmers, Wholesalers, Retailers, Products (Crops).
- **Edges**: 
  - `Farmer -> supplies -> Wholesaler` (derived from WHOLESALER_STOCK).
  - `Wholesaler -> supplies -> Retailer` (derived from RETAIL_STOCK).

## 2. Feature Engineering
Nodes contain intrinsic features reflecting their performance and capacity:
- **Wholesaler Features**: Inventory capacity, number of retailers served, fulfillment rate.
- **Retailer Features**: Purchase frequency, order volume, product diversity.

## 3. GraphSAGE Architecture
GraphSAGE (Graph Sample and Aggregate) is chosen for its inductive capabilities. It learns to generate node embeddings by sampling and aggregating features from a node's local neighborhood.
- **`to_hetero`**: PyTorch Geometric's `to_hetero` function transforms our homogeneous GraphSAGE into a Heterogeneous GNN, applying specific weights for each edge type.

## 4. Tasks and Applications
- **Supplier Recommendation (Link Prediction)**: Predicts the likelihood of an edge existing between a Retailer and a Wholesaler. The model outputs a probability (0 to 1), which is transformed into a confidence score.
- **Bottleneck Detection**: Uses network degree centrality metrics. A wholesaler serving an abnormally high percentage of retailers is flagged as a high-risk bottleneck.
- **Anomaly Detection**: Evaluates node behavior against statistical norms (mean/std). Deviations in purchasing patterns trigger an anomaly alert.
