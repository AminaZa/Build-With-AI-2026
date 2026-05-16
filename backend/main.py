from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

import ai_engine

app = FastAPI(title="LinkMind AI Backend", version="1.0.0")

# Enable CORS for frontend running on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/ai/match")
async def match_endpoint(
    mentors: list = Body(...),
    startups: list = Body(...),
    goals: dict = Body(...),
    historical_data: list = Body(None)
):
    return ai_engine.generate_matching_plan(mentors, startups, goals, historical_data)

@app.post("/api/ai/insight")
async def insight_endpoint(linkage_data: dict = Body(...)):
    return ai_engine.generate_health_insight(linkage_data)

@app.post("/api/ai/action")
async def action_endpoint(linkage_data: dict = Body(...)):
    return ai_engine.decide_agent_action(linkage_data)

@app.post("/api/ai/cross-programme")
async def cross_programme_endpoint(
    completed_linkages: list = Body(...),
    mentor_stats: dict = Body(...),
    new_programme: dict = Body(...)
):
    return ai_engine.generate_cross_programme_insights(completed_linkages, mentor_stats, new_programme)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
