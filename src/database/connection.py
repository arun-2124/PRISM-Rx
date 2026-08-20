"""PRISM-Rx Dual-Backend Database Connection Manager.

Supports:
  - DATABASE_BACKEND=sqlite (DEFAULT) -> data/unified/medbase.db
  - DATABASE_BACKEND=postgres -> SUPABASE_DATABASE_URL / DATABASE_URL

Maintains 100% backward compatibility. SQLite remains the default active database.
"""

import os
import sqlite3
from typing import Tuple, Any, Optional

SQLITE_DB_DEFAULT = "data/unified/medbase.db"

def get_backend_type() -> str:
    """Returns 'sqlite' (default) or 'postgres' based on DATABASE_BACKEND env var."""
    return os.getenv("DATABASE_BACKEND", "sqlite").lower()

def get_db_connection() -> Tuple[str, Any]:
    """Returns tuple of (backend_type, conn).
    
    If DATABASE_BACKEND=postgres, connects to Supabase PostgreSQL.
    Otherwise defaults to SQLite.
    """
    backend = get_backend_type()
    if backend == "postgres":
        db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DB_URL")
        if db_url:
            try:
                import psycopg
                from psycopg.rows import dict_row
                conn = psycopg.connect(db_url, row_factory=dict_row)
                return "postgres", conn
            except Exception as e:
                print(f"[WARNING] PostgreSQL connection failed ({e}). Falling back to SQLite.")
        else:
            print("[WARNING] DATABASE_BACKEND=postgres requested but no connection URL provided. Falling back to SQLite.")

    # Default SQLite Connection
    db_path = os.getenv("SQLITE_DB_PATH", SQLITE_DB_DEFAULT)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return "sqlite", conn

def adapt_sql(query: str, backend: Optional[str] = None) -> str:
    """Adapts parameter placeholders ('?' -> '%s') when running against PostgreSQL."""
    b = backend or get_backend_type()
    if b == "postgres":
        return query.replace("?", "%s")
    return query

def execute_query(conn: Any, sql: str, params: Any = ()) -> Any:
    """Executes a query adaptively on SQLite or PostgreSQL connection."""
    backend = get_backend_type()
    adapted = adapt_sql(sql, backend)
    if backend == "postgres":
        cur = conn.cursor()
        cur.execute(adapted, params)
        return cur
    else:
        return conn.execute(adapted, params)
