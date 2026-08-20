# PRISM-Rx System Architecture & Pipeline Specification

```text
PUBLIC BIOMEDICAL SOURCES (Europe PMC, ClinicalTrials.gov, Open Targets, ChEMBL, UniProt, MONDO)
        ↓
DATA INGESTION & INCREMENTAL FETCHERS (src/ingestion/)
        ↓
ENTITY NORMALIZATION & CANONICAL ID MAPPING
        ↓
EVIDENCE EVENTS & TIMELINE LOGGING (evidence_events table)
        ↓
UNIFIED KNOWLEDGE GRAPH (1.31M Nodes, 1.08M Edges in medbase.db)
        ↓
LATENT SIGNAL DETECTION ENGINE (SignalEngineV3)
        ↓
EVIDENCE CONVERGENCE & TEMPORAL VELOCITY SCORING
        ↓
PRISM SCORE & INFORMATION ARBITRAGE (0-100 Multi-Factor Matrix)
        ↓
EXPLAINABLE "WHY NOW?" EVENT RATIONALE GENERATION
        ↓
CONTRADICTION DETECTOR & SAFETY WARNING AUDIT
        ↓
FASTAPI BACKEND REST API (src/api/routes.py)
        ↓
REACT + VITE + PWA FRONTEND TERMINAL & AI COPILOT
```

## Backend Infrastructure
- **FastAPI Framework**: Memoized endpoints, CORS enabled, async request dispatching.
- **SignalEngineV3**: Advanced 9-factor scoring, convergence, momentum, and arbitrage scoring.
- **SQLite Database**: Single unified 545.35 MB file (`data/unified/medbase.db`) with 31 performance indexes.

## PWA Frontend Infrastructure
- **React 18 + Vite**: Production bundle with 0-dependency mobile bottom nav.
- **Service Worker (`sw.js`)**: App shell pre-caching with network-first API safety fallback.
- **Web App Manifest (`manifest.json`)**: Standalone display mode, dark `#070a12` theme, 192x192 and 512x512 app icons.
