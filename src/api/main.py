import os
from scripts.migrate_sqlite_to_supabase import load_env_file
load_env_file()
os.environ.setdefault("DATABASE_BACKEND", "postgres")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router

from src.database.connection import get_backend_type, get_db_connection

app = FastAPI(
    title="PRISM-Rx API",
    description="Real-Time Biotech Arbitrage Engine for Drug Repurposing Signals",
    version="2.0.0",
)

@app.on_event("startup")
def startup_diagnostic():
    backend_type = get_backend_type()
    print("=" * 60)
    print("PRISM-Rx FASTAPI PRODUCTION STARTUP DIAGNOSTIC")
    print(f"DATABASE_BACKEND: {backend_type}")
    if backend_type == "postgres":
        raw_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL") or ""
        sanitized_host = raw_url.split("@")[-1].split("/")[0] if "@" in raw_url else "supabase_postgres"
        print(f"Target Database Host: {sanitized_host}")
        try:
            b, conn = get_db_connection()
            print("Database Connectivity: CONNECTED (Supabase PostgreSQL)")
            conn.close()
        except Exception as e:
            print(f"Database Connectivity: FAILED ({e})")
    else:
        print(f"Database Mode: SQLite ({os.getenv('SQLITE_DB_PATH', 'data/unified/medbase.db')})")
    print("=" * 60)

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
