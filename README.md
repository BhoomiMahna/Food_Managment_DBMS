# AI-Powered Food Supply Chain Management System

This project is a comprehensive Full-Stack Food Supply Chain Management system transformed into an AI-powered intelligence platform. It tracks transactions and interactions between Farmers, Wholesalers, and Retailers, and uses advanced Machine Learning to optimize the supply chain.

## Features
- **Role-Based Dashboards**: Tailored views for Farmers, Wholesalers, Retailers, and Admins.
- **Real-Time Inventory Management**: Tracks crop stock, shelf life, and dynamic pricing.
- **Graph Neural Network (GNN) AI Intelligence**:
  - **Supplier Recommendation**: Predicts the best Wholesaler for a Retailer using Link Prediction (GraphSAGE).
  - **Bottleneck Detection**: Identifies critical points of failure in the supply chain using graph centrality.
  - **Anomaly Detection**: Monitors irregular patterns in purchasing and distribution.
- **AI Interactive Dashboard**: Implemented in React, featuring real-time insights and a D3 Force-Graph visualization of the entire supply chain network.

## Technology Stack
- **Frontend**: React.js, Tailwind CSS, Recharts, React-Force-Graph-2D, Lucide-React
- **Backend (CRUD)**: Node.js, Express
- **Backend (ML Microservice)**: Python, FastAPI
- **Machine Learning**: PyTorch Geometric, scikit-learn, networkx, pandas
- **Database**: MySQL

## Setup & Running Locally

### 1. Database Setup
Ensure MySQL is running. The database connects to `localhost` root with an empty password by default (configurable in `.env`). The schema is located in `database/schema.sql`.

### 2. Run Node.js Backend
```bash
cd backend
npm install
npm run start
```
Runs on `http://localhost:5000`

### 3. Run Python ML Service
```bash
cd ai_service
python -m venv venv
# Activate venv
.\venv\Scripts\Activate.ps1   # Windows
# Install ML dependencies
pip install -r requirements.txt
# Run FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Runs on `http://localhost:8000`. API Docs available at `http://localhost:8000/docs`.

### 4. Run React Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.
Navigate to `/ai-dashboard` to view the Machine Learning insights!

## Documentation
- [Architecture Diagram](./docs/Architecture_Diagram.md)
- [ML Pipeline Diagram](./docs/ML_Pipeline_Diagram.md)
- [Database Diagram](./docs/Database_Diagram.md)
- [Model Explanation](./docs/Model_Explanation.md)
- [API Documentation](./docs/API_Documentation.md)
