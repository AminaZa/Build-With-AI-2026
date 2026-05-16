import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dateutil.parser import parse

app = FastAPI(
    title="LinkMind API",
    description="Backend Agent Engine for Automating Ecosystem Linkages",
    version="1.0.0"
)

# CRITICAL: Enable CORS so the frontend (localhost:3000) can talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production use specific origins, but '*' is perfect for the hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MOCK DATA FOR IMMEDIATE FRONTEND USE ---
mock_stats_summary = {
    "autoExecuted": 47,
    "informed": 12,
    "pendingApproval": 3,
    "overridden": 0
}

mock_stats_health = {
    "healthy": 25,
    "atRisk": 5,
    "failing": 2
}

mock_actors = [
    {
        "id": "mentor_001",
        "type": "mentor",
        "name": "Dr. Aisha Rahman",
        "expertise": ["fintech", "product-strategy", "fundraising"],
        "bio": "15 years in banking, founded 2 startups...",
        "capacity": 3,
        "activeCount": 2,
        "historicalScore": 88,
        "programmes": ["prog_A", "prog_B"],
        "createdAt": "2025-01-15T00:00:00Z"
    },
    {
        "id": "startup_015",
        "type": "startup",
        "name": "PayFlex",
        "expertise": ["fintech"],
        "bio": "B2B payments platform for SMEs.",
        "capacity": 1,
        "activeCount": 1,
        "historicalScore": 0,
        "programmes": ["prog_B"],
        "createdAt": "2026-02-10T00:00:00Z"
    }
]

mock_programmes = [
    {
        "id": "prog_B",
        "name": "Fintech Accelerator Cohort 2",
        "status": "active",
        "goals": {
            "engagementRate": 85,
            "matchCount": 20,
            "targetOutcome": "product-market fit"
        },
        "cohortSize": 20,
        "startDate": "2026-01-15",
        "endDate": "2026-06-15",
        "parentProgramme": "prog_A"
    }
]

mock_actions = [
    {
        "id": "action_101",
        "linkageId": "link_042",
        "mentorName": "Dr. Aisha Rahman",
        "startupName": "PayFlex",
        "tier": "inform",
        "type": "agenda_sent",
        "description": "Sent focused meeting agenda: 'Fundraising deck review'",
        "aiReasoning": "PayFlex's latest update mentions fundraising prep. Meetings with pre-set agendas have 40% higher satisfaction.",
        "status": "executed",
        "timestamp": "2026-05-16T08:30:00Z"
    }
]

mock_linkages = [
    {
        "id": "link_042",
        "type": "mentorship",
        "status": "active",
        "mentorId": "mentor_001",
        "mentorName": "Dr. Aisha Rahman",
        "startupId": "startup_015",
        "startupName": "PayFlex",
        "programmeId": "prog_B",
        "healthScore": 72,
        "healthTrend": "declining",
        "autonomyLevel": "inform",
        "signals": {
            "meetingFrequency": 0.5,
            "lastMeeting": "2026-05-10T00:00:00Z",
            "feedbackAvg": 3.8,
            "milestonesHit": 2,
            "milestonesTotal": 5
        },
        "aiInsight": "Engagement declining — meetings dropped from weekly to biweekly.",
        "history": [
            { "date": "2026-05-01", "event": "created", "by": "system" },
            { "date": "2026-05-08", "event": "health_drop", "from": 85, "to": 72 }
        ],
        "createdAt": "2026-03-01T00:00:00Z"
    }
]

# --- CORE LOGIC (AI ENGINE & HEALTH) ---

def compute_health_score(linkage):
    signals = linkage.get('signals', {})
    
    # Meeting frequency score (0-30 points)
    meeting_score = min(30, signals.get('meetingFrequency', 0) * 30)
    
    # Feedback score (0-30 points)
    feedback_score = (signals.get('feedbackAvg', 1) - 1) / 4 * 30
    
    # Milestone progress score (0-20 points)
    if signals.get('milestonesTotal', 0) > 0:
        milestone_score = (signals['milestonesHit'] / signals['milestonesTotal']) * 20
    else:
        milestone_score = 10  # neutral if no milestones defined
        
    # Recency score (0-20 points)
    last_meeting_str = signals.get('lastMeeting')
    if last_meeting_str:
        last_meeting = parse(last_meeting_str).replace(tzinfo=None)
        now = datetime.datetime.utcnow()
        days_since = (now - last_meeting).days
        if days_since <= 7:
            recency_score = 20
        elif days_since <= 14:
            recency_score = 15
        elif days_since <= 21:
            recency_score = 8
        else:
            recency_score = 0
    else:
        recency_score = 0
        
    total = meeting_score + feedback_score + milestone_score + recency_score
    return round(min(100, max(0, total)))

def generate_meeting_topic(linkage):
    # Mock for Person 3's AI function
    return {
        "topic": "Re-aligning on Product-Market Fit",
        "reasoning": "Engagement has dropped; focusing on a core existential topic often reignites interest."
    }

def propose_reassignment(linkage):
    # Mock for Person 3's AI function
    return {
        "newMentor": "mentor_002",
        "reasoning": "Current mentor's engagement has dropped below critical levels. Mentor 002 has high availability and matching expertise."
    }

def determine_agent_action(linkage, health_score):
    signals = linkage.get('signals', {})
    last_meeting_str = signals.get('lastMeeting')
    if not last_meeting_str:
        return None
        
    last_meeting = parse(last_meeting_str).replace(tzinfo=None)
    now = datetime.datetime.utcnow()
    days_since_meeting = (now - last_meeting).days
    
    # Rule-based Tier 1 actions (fast, no AI needed)
    if 6 <= days_since_meeting < 14:
        return {
            'tier': 'auto',
            'type': 'reminder_sent',
            'description': f"Sent weekly meeting reminder to {linkage.get('mentorName')} and {linkage.get('startupName')}",
        }
    
    # Rule-based Tier 2 actions
    if health_score < 70 and linkage.get('healthTrend') == 'declining':
        ai_response = generate_meeting_topic(linkage)
        return {
            'tier': 'inform',
            'type': 'agenda_sent',
            'description': f"Sent focused meeting agenda: '{ai_response['topic']}'",
            'aiReasoning': ai_response['reasoning'],
        }
    
    # AI-driven Tier 3 actions (high stakes)
    if days_since_meeting >= 21 or health_score < 30:
        ai_response = propose_reassignment(linkage)
        return {
            'tier': 'approve',
            'type': 'reassign_proposed',
            'description': f"Proposes reassigning {linkage.get('startupName')} to {ai_response['newMentor']}",
            'aiReasoning': ai_response['reasoning'],
        }
    
    return None

def get_cross_programme_intelligence(source_programme_id):
    linkages = [l for l in mock_linkages if l.get('programmeId') == source_programme_id]
    
    mentor_stats = {}
    for l in linkages:
        mid = l['mentorId']
        if mid not in mentor_stats:
            mentor_stats[mid] = { 'totalScore': 0, 'count': 0, 'domains': [] }
        mentor_stats[mid]['totalScore'] += l.get('healthScore', 0)
        mentor_stats[mid]['count'] += 1
        
        startup = next((a for a in mock_actors if a['id'] == l['startupId']), None)
        if startup and startup.get('expertise'):
            mentor_stats[mid]['domains'].append(startup['expertise'][0])
            
    for mid, stats in mentor_stats.items():
        stats['avgScore'] = stats['totalScore'] / stats['count'] if stats['count'] > 0 else 0
        if stats['domains']:
            stats['topDomain'] = max(set(stats['domains']), key=stats['domains'].count)
        else:
            stats['topDomain'] = None
            
    return mentor_stats


# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "LinkMind API is running smoothly"}

@app.get("/api/stats/summary")
def get_stats_summary():
    return mock_stats_summary

@app.get("/api/stats/health")
def get_stats_health():
    return mock_stats_health

@app.get("/api/actors")
def get_actors(type: Optional[str] = None, programme: Optional[str] = None):
    results = mock_actors
    if type:
        results = [a for a in results if a.get("type") == type]
    if programme:
        results = [a for a in results if programme in a.get("programmes", [])]
    return results

@app.get("/api/actors/{actor_id}")
def get_actor_by_id(actor_id: str):
    actor = next((a for a in mock_actors if a["id"] == actor_id), None)
    if actor:
        # Include linkages for this actor
        actor_linkages = [l for l in mock_linkages if l["mentorId"] == actor_id or l["startupId"] == actor_id]
        return {"actor": actor, "linkages": actor_linkages}
    return {"error": "Actor not found"}, 404

@app.get("/api/programmes")
def get_programmes():
    return mock_programmes

@app.get("/api/programmes/{programme_id}")
def get_programme_by_id(programme_id: str):
    prog = next((p for p in mock_programmes if p["id"] == programme_id), None)
    if prog:
        return prog
    return {"error": "Programme not found"}, 404

@app.get("/api/linkages")
def get_linkages(programme: Optional[str] = None, status: Optional[str] = None):
    results = mock_linkages
    if programme:
        results = [l for l in results if l.get("programmeId") == programme]
    if status:
        results = [l for l in results if l.get("status") == status]
    return results

@app.get("/api/linkages/{linkage_id}")
def get_linkage_by_id(linkage_id: str):
    linkage = next((l for l in mock_linkages if l["id"] == linkage_id), None)
    if linkage:
        return linkage
    return {"error": "Linkage not found"}, 404

@app.get("/api/actions")
def get_actions(tier: Optional[str] = None, status: Optional[str] = None, linkageId: Optional[str] = None):
    results = mock_actions
    if tier:
        results = [a for a in results if a.get("tier") == tier]
    if status:
        results = [a for a in results if a.get("status") == status]
    if linkageId:
        results = [a for a in results if a.get("linkageId") == linkageId]
    return results

@app.post("/api/matching/generate")
def generate_matching():
    # Mocks calling Person 3's AI function
    return {"proposedPairings": [
        {"mentorId": "mentor_001", "startupId": "startup_015", "reasoning": "Strong match in fintech."}
    ]}

@app.post("/api/matching/approve")
def approve_matching():
    return {"status": "success", "message": "Bulk pairings approved and linkages created."}

@app.post("/api/actions/{action_id}/approve")
def approve_action(action_id: str):
    return {"status": "success", "message": f"Action {action_id} approved."}

@app.post("/api/actions/{action_id}/reject")
def reject_action(action_id: str):
    return {"status": "success", "message": f"Action {action_id} rejected."}

@app.post("/api/actions/{action_id}/undo")
def undo_action(action_id: str):
    return {"status": "success", "message": f"Action {action_id} undone."}

@app.post("/api/programmes/{programme_id}/launch")
def launch_programme(programme_id: str):
    # This triggers the cross-programme intelligence logic
    parent_prog_id = "prog_A" # Normally retrieved from programme DB
    intelligence = get_cross_programme_intelligence(parent_prog_id)
    return {
        "status": "success", 
        "message": f"Programme {programme_id} launched.",
        "crossProgrammeIntelligence": intelligence
    }

@app.post("/api/engine/run")
def trigger_agent_engine():
    # Demo endpoint to trigger the engine loop on all active linkages
    executed_actions = []
    for linkage in mock_linkages:
        if linkage.get("status") != "active":
            continue
            
        new_score = compute_health_score(linkage)
        linkage['healthScore'] = new_score
        # Basic trend calc
        # linkage['healthTrend'] = ...
        
        action = determine_agent_action(linkage, new_score)
        if action:
            executed_actions.append(action)
            # In a real app we'd save this to DB
            
    return {"status": "success", "actionsProcessed": len(executed_actions), "actions": executed_actions}