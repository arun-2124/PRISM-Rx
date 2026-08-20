"""
Main FastAPI Application Entry Point for PRISM-Rx Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router

app = FastAPI(
    title="PRISM-Rx API",
    description="Real-Time Biotech Arbitrage Engine for Drug Repurposing Signals",
    version="2.0.0",
)

# Enable CORS for React frontend (localhost:3000 / localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)
