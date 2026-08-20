"""PRISM-Rx PostgreSQL / Supabase Connection Layer (Isolated module for future migration).

Supports DATABASE_URL, connection pooling via psycopg, and graceful fallback.
Does NOT require credentials during import.
"""

import os
from typing import Optional, Any

try:
    import psycopg
    from psycopg_pool import ConnectionPool
    PSYCOPG_AVAILABLE = True
except ImportError:
    PSYCOPG_AVAILABLE = False
    ConnectionPool = None

_POOL: Optional[Any] = None

def get_postgres_pool() -> Optional[Any]:
    """Returns initialized psycopg connection pool if DATABASE_URL is set."""
    global _POOL
    if not PSYCOPG_AVAILABLE:
        return None

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return None

    if _POOL is None:
        try:
            _POOL = ConnectionPool(
                conninfo=db_url,
                min_size=1,
                max_size=10,
                open=False
            )
            _POOL.open()
        except Exception as e:
            print(f"[WARNING] Failed to initialize PostgreSQL pool: {e}")
            _POOL = None

    return _POOL

def get_postgres_connection():
    """Gets a raw connection from PostgreSQL pool or returns None if unconfigured."""
    pool = get_postgres_pool()
    if pool:
        return pool.getconn()
    return None

def close_postgres_pool():
    """Closes PostgreSQL connection pool on application shutdown."""
    global _POOL
    if _POOL:
        try:
            _POOL.close()
        except Exception:
            pass
        _POOL = None
