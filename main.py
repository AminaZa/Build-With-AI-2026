import datetime
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dateutil.parser import parse

import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase
try:
    cred = credentials.Certificate('firebase-key.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Warning: Failed to initialize Firebase. Ensure firebase-key.json exists and Firestore API is enabled. Error: {e}")
    db = None

app = FastAPI(
    title="LinkMind API",
    description="Backend Agent Engine for Automating Ecosystem Linkages",
    version="1.0.0"
)

# CRITICAL: Enable CORS so the frontend (localhost:3000) can talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MOCK DATA FOR IMMEDIATE FRONTEND USE (Remaining Stats Only) ---
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

# --- CORE LOGIC (AI ENGINE & HEALTH) ---

def compute_health_score(linkage):
    signals = linkage.get('signals', {})
    
    # Meeting frequency score (0-30 points)
    meeting_score = min(30, signals.get('meetingFrequency', 0) * 30)
    
    # Feedback score (0-30 points)
    feedback_score = (signals.get('feedbackAvg', 1) - 1) / 4 * 30
    
    # Milestone progress score (0-20 points)
    if signals.get('milestonesTotal', 0) > 0:
        milestone_score = (signals.get('milestonesHit', 0) / signals.get('milestonesTotal', 1)) * 20
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
    return {
        "topic": "Re-aligning on Product-Market Fit",
        "reasoning": "Engagement has dropped; focusing on a core existential topic often reignites interest."
    }

def propose_reassignment(linkage):
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
    
    if 6 <= days_since_meeting < 14:
        return {
            'tier': 'auto',
            'type': 'reminder_sent',
            'description': f"Sent weekly meeting reminder to {linkage.get('mentorName')} and {linkage.get('startupName')}",
        }
    
    if health_score < 70 and linkage.get('healthTrend') == 'declining':
        ai_response = generate_meeting_topic(linkage)
        return {
            'tier': 'inform',
            'type': 'agenda_sent',
            'description': f"Sent focused meeting agenda: '{ai_response['topic']}'",
            'aiReasoning': ai_response['reasoning'],
        }
    
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
    if not db:
        return {}
    linkages_ref = db.collection('linkages').where('programmeId', '==', source_programme_id).stream()
    linkages = [l.to_dict() for l in linkages_ref]
    
    mentor_stats = {}
    for l in linkages:
        mid = l.get('mentorId')
        if not mid: continue
        if mid not in mentor_stats:
            mentor_stats[mid] = { 'totalScore': 0, 'count': 0, 'domains': [] }
        mentor_stats[mid]['totalScore'] += l.get('healthScore', 0)
        mentor_stats[mid]['count'] += 1
        
        # Get startup to get expertise
        startup_doc = db.collection('actors').document(l.get('startupId', '')).get()
        if startup_doc.exists:
            startup = startup_doc.to_dict()
            if startup.get('expertise'):
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
    if not db:
        return {"status": "LinkMind API running, but Firestore is NOT connected (Check API enablement)."}
    return {"status": "LinkMind API and Firestore are running smoothly"}

@app.get("/api/stats/summary")
def get_stats_summary():
    return mock_stats_summary

@app.get("/api/stats/health")
def get_stats_health():
    return mock_stats_health

@app.get("/api/actors")
def get_actors(type: Optional[str] = None, programme: Optional[str] = None):
    if not db: return []
    query = db.collection('actors')
    if type:
        query = query.where('type', '==', type)
    
    docs = [doc.to_dict() for doc in query.stream()]
    
    if programme:
        docs = [d for d in docs if programme in d.get("programmes", [])]
        
    return docs

@app.get("/api/actors/{actor_id}")
def get_actor_by_id(actor_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    actor_doc = db.collection('actors').document(actor_id).get()
    if actor_doc.exists:
        actor = actor_doc.to_dict()
        
        # Get linkages
        linkages = []
        if actor.get('type') == 'mentor':
            l_docs = db.collection('linkages').where('mentorId', '==', actor_id).stream()
            linkages = [l.to_dict() for l in l_docs]
        elif actor.get('type') == 'startup':
            l_docs = db.collection('linkages').where('startupId', '==', actor_id).stream()
            linkages = [l.to_dict() for l in l_docs]
            
        return {"actor": actor, "linkages": linkages}
    raise HTTPException(status_code=404, detail="Actor not found")

@app.get("/api/programmes")
def get_programmes():
    if not db: return []
    return [doc.to_dict() for doc in db.collection('programmes').stream()]

@app.get("/api/programmes/{programme_id}")
def get_programme_by_id(programme_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    prog_doc = db.collection('programmes').document(programme_id).get()
    if prog_doc.exists:
        return prog_doc.to_dict()
    raise HTTPException(status_code=404, detail="Programme not found")

@app.get("/api/linkages")
def get_linkages(programme: Optional[str] = None, status: Optional[str] = None):
    if not db: return []
    query = db.collection('linkages')
    if programme:
        query = query.where('programmeId', '==', programme)
    if status:
        query = query.where('status', '==', status)
    return [doc.to_dict() for doc in query.stream()]

@app.get("/api/linkages/{linkage_id}")
def get_linkage_by_id(linkage_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    linkage_doc = db.collection('linkages').document(linkage_id).get()
    if linkage_doc.exists:
        return linkage_doc.to_dict()
    raise HTTPException(status_code=404, detail="Linkage not found")

@app.get("/api/actions")
def get_actions(tier: Optional[str] = None, status: Optional[str] = None, linkageId: Optional[str] = None):
    if not db: return []
    query = db.collection('actions')
    if tier:
        query = query.where('tier', '==', tier)
    if status:
        query = query.where('status', '==', status)
    if linkageId:
        query = query.where('linkageId', '==', linkageId)
    return [doc.to_dict() for doc in query.stream()]

@app.post("/api/matching/generate")
def generate_matching():
    return {"proposedPairings": [
        {"mentorId": "mentor_001", "startupId": "startup_015", "reasoning": "Strong match in fintech."}
    ]}

@app.post("/api/matching/approve")
def approve_matching():
    return {"status": "success", "message": "Bulk pairings approved and linkages created."}

@app.post("/api/actions/{action_id}/approve")
def approve_action(action_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    db.collection('actions').document(action_id).update({'status': 'executed'})
    return {"status": "success", "message": f"Action {action_id} approved."}

@app.post("/api/actions/{action_id}/reject")
def reject_action(action_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    db.collection('actions').document(action_id).update({'status': 'rejected'})
    return {"status": "success", "message": f"Action {action_id} rejected."}

@app.post("/api/actions/{action_id}/undo")
def undo_action(action_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    db.collection('actions').document(action_id).update({'status': 'pending'})
    return {"status": "success", "message": f"Action {action_id} undone."}

@app.post("/api/programmes/{programme_id}/launch")
def launch_programme(programme_id: str):
    parent_prog_id = "prog_A"
    intelligence = get_cross_programme_intelligence(parent_prog_id)
    return {
        "status": "success", 
        "message": f"Programme {programme_id} launched.",
        "crossProgrammeIntelligence": intelligence
    }

@app.post("/api/engine/run")
def trigger_agent_engine():
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    
    executed_actions = []
    linkages_ref = db.collection('linkages').where('status', '==', 'active').stream()
    
    for linkage_doc in linkages_ref:
        linkage = linkage_doc.to_dict()
        linkage_id = linkage_doc.id
            
        new_score = compute_health_score(linkage)
        # Update health score in DB
        db.collection('linkages').document(linkage_id).update({'healthScore': new_score})
        linkage['healthScore'] = new_score
        
        action = determine_agent_action(linkage, new_score)
        if action:
            # Add action to DB
            action['linkageId'] = linkage_id
            action['timestamp'] = datetime.datetime.utcnow().isoformat() + "Z"
            if 'status' not in action:
                action['status'] = 'executed' if action.get('tier') in ['auto', 'inform'] else 'pending'
            
            # Use a generated ID or custom ID
            new_action_ref = db.collection('actions').document()
            action['id'] = new_action_ref.id
            new_action_ref.set(action)
            
            executed_actions.append(action)
            
    return {"status": "success", "actionsProcessed": len(executed_actions), "actions": executed_actions}