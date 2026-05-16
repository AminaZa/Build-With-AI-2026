# LinkMind — Autonomous Ecosystem Orchestrator

> *Every relationship, an intelligence.*

Built for the **Build with AI, Kuala Lumpur** hackathon — domain: *Automating Ecosystem Linkages*.

Innovation programmes (accelerators, incubators, government initiatives) connect startups with mentors and partners. Today, a human admin does all of this manually — matching by gut feel, tracking engagement via spreadsheets and WhatsApp, starting from zero every new cohort. **LinkMind treats every relationship in the ecosystem as an autonomous AI agent** that monitors itself, takes action, escalates when stuck, and learns across programmes.

## Repository layout

```
.
├── backend/        FastAPI + Gemini-via-Vertex-AI engine (see backend/README.md)
├── frontend/       Next.js + React (Person 1)
└── seed_data/      Programme A (completed) + Programme B (active) JSON fixtures
```

## Seed data

Realistic Malaysian-flavoured fixtures for the demo. Counts match the plan §8 split:

| File | Contents |
|---|---|
| `seed_data/actors.json` | 12 mentors, 20 startups, 4 partners |
| `seed_data/linkages.json` | 23 linkages — Programme B (12 healthy / 5 at-risk / 3 failing) + 3 completed Programme A linkages for cross-programme intelligence |
| `seed_data/programmes.json` | Two programmes: `prog_A` (completed Cohort 1) and `prog_B` (active Cohort 2) |
| `seed_data/actions.json` | 18 agent activity log entries spanning Tier 1 / Tier 2 / Tier 3 |

## Getting started

See [`backend/README.md`](backend/README.md) for the full backend setup, env vars, and troubleshooting. Quick version:

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in service-account path + GCP project
python main.py
```

Frontend bootstrap will live under `frontend/` once Person 1 scaffolds it.

## Branches

| Branch | Owner | Purpose |
|---|---|---|
| `main` | shared | Stable; merge target after demo dress rehearsal |
| `feature/ai-engine` | Person 3 | Gemini-via-Vertex engine, prompts, demo cache, seed tests |
| `feature/agent-engine` | Person 2 | FastAPI surface, deterministic agent loop, mock data |

## Architecture (plan §6)

```
Frontend (Next.js)  ─►  Backend (FastAPI)
                              │
                              ├── Matching Engine
                              ├── Health Scorer
                              ├── Agent Engine
                              └── AI Layer (Gemini via Vertex AI)
                              │
                              ▼
                        Firestore / seed JSON
```

The AI layer lives **inside** the backend, not as a peer service. `ai_engine.py` is imported by `main.py`; there is no `/api/ai/*` boundary between them.

## Team

| | Role | Focus |
|---|---|---|
| Person 1 | Frontend Lead | Ecosystem graph, dashboard UI, all screens |
| Person 2 | Backend Lead | API endpoints, agent engine, mock data |
| Person 3 | AI Engineer | Gemini integration, prompts, health insights |
| Person 4 | Data + Demo | Seed data, demo script, presentation |
