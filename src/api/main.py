import os
from scripts.migrate_sqlite_to_supabase import load_env_file
load_env_file()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router

app = FastAPI(
    title="PRISM-Rx API",
    description="Real-Time Biotech Arbitrage Engine for Drug Repurposing Signals",
    version="2.0.0",
)

# Production CORS Configuration
allowed_origins_env = os.getenv("PRISM_FRONTEND_ORIGIN", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
allowed_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=port, reload=False)
