# LinkMind — Autonomous Ecosystem Orchestrator

> *Every relationship, an intelligence.*

Built for the **Build with AI, Kuala Lumpur** hackathon — domain: *Automating Ecosystem Linkages*.

Innovation programmes (accelerators, incubators, government initiatives) connect startups with mentors and partners. Today a human admin does this manually — matching by gut feel, tracking engagement on spreadsheets and WhatsApp, starting from zero every cohort. **LinkMind treats every relationship in the ecosystem as an autonomous AI agent** that monitors itself, takes action, escalates only when judgment is required, and learns across programmes.

---

## 🚀 Live demo

| Surface | URL |
|---|---|
| **Live app (Vercel)** | **https://build-with-ai-2026-chi.vercel.app** |
| **Backend API (Cloud Run)** | https://linkmind-api-690277070095.us-central1.run.app |
| **Backend Swagger UI** | https://linkmind-api-690277070095.us-central1.run.app/docs |

The backend is publicly reachable, talks to Firestore (`hackathon-496503/database2`) and Vertex AI (`gemini-2.5-flash`), and is pre-seeded with the canonical demo state: 36 actors, 23 linkages (12 healthy / 5 at-risk / 3 failing), 62 actions (47 auto / 12 informed / 3 awaiting approval).

---

## What's in the box

### Backend (FastAPI + Gemini via Vertex AI + Firestore)
- **Smart matching engine** — propose mentor↔startup pairings with confidence + reasoning, skip already-matched actors, auto-activate the linkages with no manual approval needed.
- **Health scoring** — deterministic 0–100 score per linkage from meeting frequency, feedback average, milestone progress, recency.
- **Agent engine** — for each linkage, picks the right tier:
  - Tier 1 (auto) — reminders, topic suggestions, health updates.
  - Tier 2 (acted + informed) — agendas, cadence adjustments, partner connections.
  - Tier 3 (auto on confidence, escalated otherwise) — reassignments and disconnections. The system *auto-applies* clear cases (e.g. critical health + an obvious replacement); only ambiguous decisions hit your inbox.
- **Cross-programme intelligence** — when a new programme launches, the system synthesises top mentors, success/failure patterns, and carry-over suggestions from past programmes.

### Frontend (Next.js 16 + React 19 + Tailwind 4)
- **Activity Feed** — three tier-coloured sections (Needs Approval / Acted & Informed / Auto-Executed) with collapsible groups, AI-reasoning drill-downs, and inline approve/reject for the Tier-3 escalations.
- **Health Dashboard** — every active linkage, colour-banded by health, sorted failing-first, click-through to a Relationship Detail view.
- **Ecosystem Graph** — full-bleed force-directed network with:
  - Violet/sky/pink node palette (separate from emerald/amber/red edge palette so health is unmistakable)
  - Google-Maps style zoom tiers (*continent → city → street → building*) — labels and detail scale with zoom
  - Soft node halos, opacity-graded edges, animated red particles on failing connections
  - Drag-to-pin, search-by-name, click-name-to-zoom, fit-to-view, manual refresh
- **Smart Matching** — one button, AI returns the pairings, they're activated immediately.
- **Programmes** — list active cohorts, launch a new one to pull cross-programme intelligence.
- **Relationship Detail** — health, trend, signals, mentor + startup info, colour-coded AI insight banner.

### AI engine (Vertex AI Gemini)
- Four schema-validated public functions: `generate_matching_plan`, `generate_health_insight`, `decide_agent_action`, `generate_cross_programme_insights`.
- Robust JSON parsing (handles fences and prose around the object), schema validation per function, one retry on transient errors, demo-mode cache fallback so the live demo never blanks.
- Deterministic tier override on the LLM's choice — even if Gemini drifts, tier obeys the health/trend rules.

---

## Quick start

### 1. Prerequisites
- Python 3.11+
- Node 20+ and npm
- A GCP project with **Vertex AI API** and **Firestore Native** enabled
- A service-account JSON with `roles/aiplatform.user` and Firestore read/write

### 2. Clone
```bash
git clone https://github.com/AminaZa/Build-With-AI-2026.git
cd Build-With-AI-2026
```

### 3. Backend setup
```bash
pip install -r requirements.txt
cp .env.example .env
```
Edit `.env`:
```
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
FIREBASE_CREDENTIALS_PATH=/absolute/path/to/service-account.json
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
FIRESTORE_DATABASE=(default)
DEMO_MODE=False
```

> `FIRESTORE_DATABASE` defaults to `(default)`. If you named your DB something else (e.g. `database2`), set it here.

Seed Firestore:
```bash
python seed_firestore.py            # 36 actors / 23 linkages / 18 actions / 2 programmes
USE_BIGGERSET=1 python seed_firestore.py   # stress test with 82 actors instead
```

Run the API:
```bash
uvicorn main:app --reload --port 8000
```
Hit `http://localhost:8000/docs` for live Swagger UI.

### 4. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`.

The frontend talks to `http://localhost:8000` by default. Override with `NEXT_PUBLIC_API_BASE=https://your-api…` if deploying.

---

## Demo flow (3 minutes)

1. **`/`** — the morning dashboard. Three stat cards plus three tier sections. Note that almost everything is in **Auto-Executed** or **Acted & Informed** — the system has been working all night.
2. **`/` → Needs Approval** — there's exactly one card: **TaniTech needs a hardware mentor that doesn't exist in the cohort yet**. The AI escalated it because no clear replacement is available. Approve it.
3. **`/ecosystem`** — full network view. Search for "MedTrack" → it's now connected to Dr. Tan Mei Lin (auto-reassigned from Kumar who'd ghosted). Click any failing edge to drill in.
4. **`/health`** — the colour-banded list. Reassigned MedTrack appears as recovering (amber, improving trend). BlockTrade↔James is gone — auto-disconnected as a programme mismatch.
5. **`/programmes` → Launch prog_B** — the Act 4 mic drop. AI pulls intelligence from prog_A: top mentors, success/failure patterns, and explicit recommendations. The new programme starts smarter than the last.

---

## Repository layout

```
.
├── main.py               FastAPI app — endpoints, agent engine, Firestore wiring
├── ai_engine.py          Gemini-via-Vertex AI engine — 4 public functions
├── seed_firestore.py     One-shot loader: seed_data/*.json → Firestore
├── test_execution.py     End-to-end test: all 4 AI functions × all 3 health bands
├── requirements.txt      Python deps
├── seed_data/            actors / linkages / programmes / actions JSON
│   └── biggerset.json    Optional 82-actor stress-test dataset
├── frontend/             Next.js 16 app
│   └── src/
│       ├── app/          Routes (activity feed, ecosystem, health, matching, programmes, linkages/[id])
│       ├── components/   Sidebar, Header, EcosystemGraph, ActivityFeedClient, PendingApprovals
│       └── services/     api.ts — typed HTTP client for the backend
├── .env.example          Template env file
├── .gitignore
└── README.md
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 + React 19 + Tailwind 4)          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
│  │Activity│ │  Eco-  │ │ Health │ │  Smart │ │  Prog. │ │
│  │  Feed  │ │ system │ │ board  │ │  Match │ │  Launch│ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │  REST over HTTP
┌────────────────────────▼────────────────────────────────┐
│  Backend (FastAPI)                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │Matching│ │ Health │ │ Agent  │ │ Cross- │            │
│  │ Engine │ │ Scorer │ │ Engine │ │  Prog. │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
│                  │                                      │
│        ┌─────────▼─────────┐                            │
│        │   AI Engine        │  ── Gemini via Vertex AI  │
│        │  (prompts +        │     gemini-2.5-flash      │
│        │   validation)      │                           │
│        └────────────────────┘                           │
└────────────────────────┬────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │   Firestore     │
                │ (Native mode)   │
                └─────────────────┘
```

The AI layer lives **inside** the backend (Python import), not as a peer HTTP service.

---

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn |
| AI | Gemini 2.5 Flash via Vertex AI SDK (`google-cloud-aiplatform`) |
| Database | Firestore Native |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4 |
| Graph viz | `react-force-graph-2d` (Canvas + d3-force) |
| Icons | `lucide-react` |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `403 IAM_PERMISSION_DENIED` | SA missing role | Grant **Vertex AI User** in IAM Console |
| `404 Publisher Model … not found` | Wrong model name | `GEMINI_MODEL=gemini-2.5-flash` |
| `404 The database (default) does not exist` | Firestore DB not created | Console → Firestore → Create database (Native mode) |
| `↔` showing as `â†"` | Old data seeded before UTF-8 fix | `python seed_firestore.py` to reseed |
| Graph keeps restarting / nodes won't stay dragged | Frontend stale | `npm run dev` cold restart, hard refresh browser |
| Pending approvals don't disappear after click | Backend cache | Backend persists immediately; if not, restart `uvicorn` |
| All endpoints return `[]` | Firestore not connected | Check `FIREBASE_CREDENTIALS_PATH`, `FIRESTORE_DATABASE`, and that the DB exists |

---

## Demo reset

The seeder wipes runtime-created docs (auto-generated match linkages, engine-run actions) before re-seeding, so:
```bash
python seed_firestore.py
```
…always restores a clean 36-actor / 23-linkage / 18-action / 2-programme state with **exactly one pending approval** (`act_017` — TaniTech needs a hardware mentor).

---

## Team

| | Role | Focus |
|---|---|---|
| Person 1 | Frontend | Ecosystem graph, dashboard UI, all screens |
| Person 2 | Backend | API endpoints, agent engine, Firestore wiring |
| Person 3 | AI Engineer | Gemini integration, prompts, health insights |
| Person 4 | Data + Demo | Seed data, demo script, presentation |
