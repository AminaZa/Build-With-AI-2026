from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Optional
from pydantic import BaseModel

import ai_engine

app = FastAPI(title="LinkMind AI Backend", version="1.0.0")

# Enable CORS for frontend running on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Database
mock_actors = [
    {"id": "m1", "name": "Dr. Aisha Rahman", "type": "mentor", "expertise": ["Fintech", "AI"]},
    {"id": "m2", "name": "Tan Sri Lim", "type": "mentor", "expertise": ["Scaling", "Operations"]},
    {"id": "m3", "name": "Kavita Muthu", "type": "mentor", "expertise": ["UX", "Product"]},
    {"id": "s1", "name": "PayFlex", "type": "startup", "expertise": ["Payments"]},
    {"id": "s2", "name": "MakanTime", "type": "startup", "expertise": ["Logistics"]},
    {"id": "s3", "name": "MyHealth", "type": "startup", "expertise": ["Healthtech"]},
    {"id": "p1", "name": "MDEC", "type": "partner", "expertise": ["Digital Economy"]}
]

mock_linkages = [
    {"id": "l1", "mentorId": "m1", "startupId": "s1", "healthScore": 85, "status": "active"},
    {"id": "l2", "mentorId": "m2", "startupId": "s2", "healthScore": 45, "status": "at-risk"},
    {"id": "l3", "mentorId": "m3", "startupId": "s3", "healthScore": 92, "status": "active"}
]

@app.get("/api/actors")
async def get_actors(type: Optional[str] = None):
    if type:
        return [a for a in mock_actors if a["type"] == type]
    return mock_actors

@app.get("/api/linkages")
async def get_linkages():
    return mock_linkages

@app.get("/api/stats/health")
async def get_stats_health():
    return {
        "healthy": len([l for l in mock_linkages if l["healthScore"] > 70]),
        "atRisk": len([l for l in mock_linkages if 40 < l["healthScore"] <= 70]),
        "failing": len([l for l in mock_linkages if l["healthScore"] <= 40])
    }

@app.get("/api/stats/summary")
async def get_stats_summary():
    return {
        "autoExecuted": 47, "informed": 12, "pendingApproval": 3, "overridden": 0
    }

# AI Logic Endpoints
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
