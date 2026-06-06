from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import traceback

# Initialize app
app = FastAPI(title="AI Food Supply Chain Intelligence API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI Food Supply Chain Intelligence API is running."}

@app.get("/api/ml/recommend-supplier/{retailer_id}")
def recommend_supplier(retailer_id: int, db: Session = Depends(get_db)):
    try:
        from ml.inference import get_supplier_recommendations
        return get_supplier_recommendations(retailer_id, db)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/onboarding-recommendation/{retailer_id}")
def onboarding_recommendation(retailer_id: int, db: Session = Depends(get_db)):
    try:
        from ml.inference import get_onboarding_recommendations
        return get_onboarding_recommendations(retailer_id, db)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/bottlenecks")
def get_bottlenecks(db: Session = Depends(get_db)):
    try:
        from ml.inference import get_bottlenecks as fetch_bottlenecks
        return fetch_bottlenecks(db)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/anomalies")
def get_anomalies(db: Session = Depends(get_db)):
    try:
        from ml.inference import get_anomalies as fetch_anomalies
        return fetch_anomalies(db)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/graph-data")
def get_graph_data(db: Session = Depends(get_db)):
    try:
        from ml.inference import get_graph_visualization_data
        return get_graph_visualization_data(db)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
