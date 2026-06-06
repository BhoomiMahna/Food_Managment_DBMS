# API Documentation (ML Microservice)

The Machine Learning microservice is built with FastAPI and runs on port `8000`. It exposes the following endpoints:

### 1. `GET /api/ml/recommend-supplier/{retailer_id}`
- **Description**: Returns top 5 wholesaler recommendations for a given retailer using Graph Link Prediction.
- **Response**:
  ```json
  [
    {
      "wholesaler_id": 12,
      "score": 0.89,
      "confidence": 92.5,
      "reason": "Similar retailers with comparable demand patterns successfully source from this wholesaler."
    }
  ]
  ```

### 2. `GET /api/ml/onboarding-recommendation/{retailer_id}`
- **Description**: Recommends wholesalers and optimal product mix for a newly onboarded retailer.
- **Response**:
  ```json
  {
    "recommended_wholesalers": [...],
    "recommended_products": ["Tomato", "Potato", "Onion"]
  }
  ```

### 3. `GET /api/ml/bottlenecks`
- **Description**: Identifies critical nodes (wholesalers or farmers) that act as single points of failure.
- **Response**:
  ```json
  [
    {
      "critical_node": "Wholesaler W4",
      "risk": "High",
      "reason": "Serves 68% of retailers, creating a single point of failure."
    }
  ]
  ```

### 4. `GET /api/ml/anomalies`
- **Description**: Detects unusual supply chain patterns (e.g., hoarding, massive order volume).
- **Response**:
  ```json
  [
    {
      "entity": "Retailer R15",
      "alert": "Abnormal order volume",
      "details": "Ordering from 10 distinct wholesalers (average is 2.5)."
    }
  ]
  ```

### 5. `GET /api/ml/graph-data`
- **Description**: Provides nodes and edges formatted for D3/Force-Graph visualization on the React frontend.
- **Response**:
  ```json
  {
    "nodes": [{"id": "F_1", "group": "Farmer", "label": "Farmer 1"}],
    "links": [{"source": "F_1", "target": "W_2", "value": 1}]
  }
  ```
