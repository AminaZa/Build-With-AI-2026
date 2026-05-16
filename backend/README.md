# LinkMind — Backend

FastAPI backend for the LinkMind hackathon project. The AI engine calls Gemini
via Vertex AI using a service-account credential.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # then edit .env with your values
```

### Required env vars

| Var | Value | Notes |
|---|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Absolute path to the service-account JSON | Get the JSON from Person 3 (AI Engineer). Store it OUTSIDE the repo. |
| `GCP_PROJECT_ID` | `hackathon-496503` | The project the service account belongs to. |
| `GCP_LOCATION` | `us-central1` | Region where Gemini is enabled. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Note: `gemini-2.0-flash` has been retired. |
| `DEMO_MODE` | `True` or `False` | `True` returns deterministic cached responses for demo rehearsal. `False` calls Vertex live. |

The service account needs the **Vertex AI User** role
(`roles/aiplatform.user`) on the GCP project. If you get `403
IAM_PERMISSION_DENIED` on the first call, that role is missing.

## Run

```bash
python main.py
# or
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

CORS is open to `http://localhost:3000` for the frontend.

## Test the AI engine against the seed data

```bash
python test_execution.py
```

Loads `seed_data/*.json`, validates structure, then runs all four AI
functions against representative inputs (healthy `link_B_01`, at-risk
`link_B_13`, failing `link_B_18`, plus matching and cross-programme).
Respects `DEMO_MODE`.

## AI engine surface (`ai_engine.py`)

All four functions return schema-validated dicts. Errors fall back to the
demo cache after one retry.

- `generate_matching_plan(mentors, startups, goals, historical_data=None)`
- `generate_health_insight(linkage_data)` — routes the demo cache by
  `healthScore`: `<40` failing, `40–69` at-risk, `≥70` healthy.
- `decide_agent_action(linkage_data)` — tier is recomputed deterministically
  from `healthScore` + `healthTrend` after the LLM call. `<40 → approve`,
  `<70 or declining → inform`, else `auto`.
- `generate_cross_programme_insights(completed_linkages, mentor_stats, new_programme)`

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `403 IAM_PERMISSION_DENIED` | Service account missing role | Grant **Vertex AI User** in IAM Console for project `hackathon-496503` |
| `404 Publisher Model … not found` | Wrong model name | Set `GEMINI_MODEL=gemini-2.5-flash` |
| `Vertex AI model not initialized` | Missing env vars | Check `.env` is loaded and `GOOGLE_APPLICATION_CREDENTIALS` points at an existing file |
| All calls return canned text | `DEMO_MODE=True` | Set `DEMO_MODE=False` for live calls |
