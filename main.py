import datetime
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dateutil.parser import parse

import firebase_admin
from firebase_admin import credentials, firestore
import ai_engine

import os

# Load Firebase credentials path from .env
FIREBASE_KEY_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-key.json')
FIRESTORE_DB_ID = os.getenv('FIRESTORE_DATABASE', '(default)')

# Initialize Firebase
try:
    cred = credentials.Certificate(FIREBASE_KEY_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client(database_id=FIRESTORE_DB_ID)
    print(f"Firestore connected | database: {FIRESTORE_DB_ID}")
except Exception as e:
    print(f"Warning: Failed to initialize Firebase. Ensure {FIREBASE_KEY_PATH} exists, Firestore API is enabled, and database '{FIRESTORE_DB_ID}' exists. Error: {e}")
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

def determine_agent_action(linkage, health_score):
    signals = linkage.get('signals', {})
    last_meeting_str = signals.get('lastMeeting')
    if not last_meeting_str:
        return None
        
    last_meeting = parse(last_meeting_str).replace(tzinfo=None)
    now = datetime.datetime.utcnow()
    days_since_meeting = (now - last_meeting).days
    
    # Rule Pre-filter for healthy cases
    if health_score >= 70 and 6 <= days_since_meeting < 14:
        return {
            'tier': 'auto',
            'type': 'reminder_sent',
            'description': f"Sent weekly meeting reminder to {linkage.get('mentorName')} and {linkage.get('startupName')}",
            'aiReasoning': "Health score is good. Automated tier 1 reminder."
        }
        
    if health_score < 70 or days_since_meeting >= 14:
        # LLM-Primary action for at-risk or failing
        ai_response = ai_engine.decide_agent_action(linkage)
        
        return {
            'tier': ai_response.get('tier', 'inform'),
            'type': ai_response.get('action', 'do_nothing'),
            'description': ai_response.get('description', ''),
            'aiReasoning': ai_response.get('aiReasoning', ''),
            'suggestedMeetingTopic': ai_response.get('suggestedMeetingTopic'),
            'newMentorSuggestion': ai_response.get('newMentorSuggestion')
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
    if not db:
        return mock_stats_summary
    actions = [doc.to_dict() for doc in db.collection('actions').stream()]
    auto = 0
    informed = 0
    pending = 0
    overridden = 0
    inform_types = {'agenda_sent', 'cadence_adjusted', 'nudge_sent', 'alert_sent', 'assessment_sent', 'partner_connected'}
    for a in actions:
        tier = a.get('tier')
        status = a.get('status', '')
        atype = a.get('type', '')
        if status in ('proposed', 'pending'):
            pending += 1
        elif status == 'rejected':
            overridden += 1
        elif tier == 'inform' or atype in inform_types:
            informed += 1
        else:
            auto += 1
    return {"autoExecuted": auto, "informed": informed, "pendingApproval": pending, "overridden": overridden}

@app.get("/api/stats/health")
def get_stats_health():
    if not db:
        return mock_stats_health
    linkages = [doc.to_dict() for doc in db.collection('linkages').where('status', '==', 'active').stream()]
    counts = {"healthy": 0, "atRisk": 0, "failing": 0}
    for l in linkages:
        score = l.get('healthScore', 0)
        if score >= 70:
            counts['healthy'] += 1
        elif score >= 40:
            counts['atRisk'] += 1
        else:
            counts['failing'] += 1
    return counts

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
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    
    mentors = [d.to_dict() for d in db.collection('actors').where('type', '==', 'mentor').stream()]
    partners = [d.to_dict() for d in db.collection('actors').where('type', '==', 'partner').stream()]
    startups = [d.to_dict() for d in db.collection('actors').where('type', '==', 'startup').stream()]
    
    # Build name lookup for readable descriptions
    name_map = {a['id']: a.get('name', a['id']) for a in mentors + partners + startups}
    
    goals = {
        "engagementRate": 85,
        "matchCount": 20,
        "targetOutcome": "product-market fit"
    }
    
    historical_linkages = [d.to_dict() for d in db.collection('linkages').stream()]
    
    ai_response = ai_engine.generate_matching_plan(mentors, partners, startups, goals, historical_linkages)
    
    # Persist each pairing as a new proposed linkage + log an action
    now = datetime.datetime.utcnow().isoformat() + "Z"
    created_linkages = []
    for pairing in ai_response.get('pairings', []):
        mentor_id = pairing.get('mentorId', '')
        startup_id = pairing.get('startupId', '')
        linkage_id = f"link_match_{mentor_id}_{startup_id}"
        mentor_name = name_map.get(mentor_id, mentor_id)
        startup_name = name_map.get(startup_id, startup_id)
        
        linkage_data = {
            'id': linkage_id,
            'type': 'mentorship',
            'status': 'proposed',
            'mentorId': mentor_id,
            'startupId': startup_id,
            'programmeId': 'prog_B',
            'healthScore': 50,
            'healthTrend': 'stable',
            'autonomyLevel': 'notify',
            'signals': {'meetingFrequency': 0, 'feedbackAvg': 0},
            'aiInsight': pairing.get('reasoning', ''),
            'confidence': pairing.get('confidence', 0),
        }
        db.collection('linkages').document(linkage_id).set(linkage_data)
        created_linkages.append(linkage_id)
        
        # Log an action for the activity feed
        action_ref = db.collection('actions').document()
        action_data = {
            'id': action_ref.id,
            'linkageId': linkage_id,
            'type': 'match_proposed',
            'tier': 'approve',
            'description': f"AI proposes pairing {mentor_name} \u2194 {startup_name} (confidence: {int(pairing.get('confidence', 0) * 100)}%)",
            'status': 'proposed',
            'timestamp': now,
            'aiReasoning': pairing.get('reasoning', ''),
        }
        action_ref.set(action_data)
    
    ai_response['createdLinkages'] = created_linkages
    return ai_response

@app.post("/api/matching/approve")
def approve_matching():
    """Bulk-approve all proposed match linkages: set them to active."""
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    
    proposed = db.collection('linkages').where('status', '==', 'proposed').stream()
    count = 0
    now = datetime.datetime.utcnow().isoformat() + "Z"
    for doc in proposed:
        linkage = doc.to_dict()
        db.collection('linkages').document(doc.id).update({'status': 'active', 'healthScore': 60, 'healthTrend': 'improving'})
        
        # Log activation action
        action_ref = db.collection('actions').document()
        action_ref.set({
            'id': action_ref.id,
            'linkageId': doc.id,
            'type': 'match_activated',
            'tier': 'auto',
            'description': f"Match approved and activated: {linkage.get('mentorId', '?')} \u2194 {linkage.get('startupId', '?')}",
            'status': 'executed',
            'timestamp': now,
            'aiReasoning': 'Admin bulk-approved all proposed matches.',
        })
        count += 1
    
    return {"status": "success", "message": f"Bulk approved {count} pairings. Linkages are now active."}

@app.post("/api/actions/{action_id}/approve")
def approve_action(action_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    action_ref = db.collection('actions').document(action_id)
    snap = action_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Action not found")
    action = snap.to_dict()

    linkage_id = action.get('linkageId')
    action_type = action.get('type', '')
    applied = None

    if linkage_id:
        linkage_ref = db.collection('linkages').document(linkage_id)
        if action_type == 'reassign_proposed':
            new_mentor = action.get('newMentorId') or action.get('newMentorSuggestion')
            if new_mentor:
                linkage_ref.update({
                    'mentorId': new_mentor,
                    'status': 'active',
                    'healthScore': 60,
                    'healthTrend': 'improving',
                    'aiInsight': f"Reassigned to {new_mentor} via approved action.",
                })
                applied = f"linkage {linkage_id} re-pointed to {new_mentor}"
            else:
                linkage_ref.update({
                    'status': 'completed',
                    'aiInsight': "Reassign approved but no replacement specified — needs manual assignment.",
                })
                applied = f"linkage {linkage_id} closed (no replacement specified)"
        elif action_type in ('pause_proposed', 'relationship_paused'):
            linkage_ref.update({
                'status': 'completed',
                'aiInsight': "Relationship ended via approved action.",
            })
            applied = f"linkage {linkage_id} closed"

    action_ref.update({'status': 'executed'})
    
    # Log this approval to the activity feed
    log_ref = db.collection('actions').document()
    log_ref.set({
        'id': log_ref.id,
        'linkageId': linkage_id or '',
        'type': 'action_approved',
        'tier': 'inform',
        'description': f"Admin approved: {action.get('description', '')}",
        'status': 'executed',
        'timestamp': datetime.datetime.utcnow().isoformat() + "Z",
        'aiReasoning': 'Admin manually approved this proposed action.'
    })
    
    return {
        "status": "success",
        "message": f"Action {action_id} approved.",
        "linkageId": linkage_id,
        "applied": applied,
    }

@app.post("/api/actions/{action_id}/reject")
def reject_action(action_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    action_ref = db.collection('actions').document(action_id)
    snap = action_ref.get()
    if snap.exists:
        action = snap.to_dict()
        action_ref.update({'status': 'rejected'})
        
        # Log this rejection to the activity feed
        log_ref = db.collection('actions').document()
        log_ref.set({
            'id': log_ref.id,
            'linkageId': action.get('linkageId', ''),
            'type': 'action_rejected',
            'tier': 'inform',
            'description': f"Admin rejected: {action.get('description', '')}",
            'status': 'executed',
            'timestamp': datetime.datetime.utcnow().isoformat() + "Z",
            'aiReasoning': 'Admin manually rejected this proposed action.'
        })
    else:
        raise HTTPException(status_code=404, detail="Action not found")
        
    return {"status": "success", "message": f"Action {action_id} rejected."}

@app.post("/api/actions/{action_id}/undo")
def undo_action(action_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    db.collection('actions').document(action_id).update({'status': 'pending'})
    return {"status": "success", "message": f"Action {action_id} undone."}

@app.post("/api/programmes/{programme_id}/launch")
def launch_programme(programme_id: str):
    if not db: raise HTTPException(status_code=500, detail="Database not connected")
    parent_prog_id = "prog_A"
    intelligence = get_cross_programme_intelligence(parent_prog_id)
    
    prog_doc = db.collection('programmes').document(programme_id).get()
    new_programme = prog_doc.to_dict() if prog_doc.exists else {"id": programme_id}
    programme_name = new_programme.get('name', programme_id)
    
    completed_linkages = [d.to_dict() for d in db.collection('linkages').where('programmeId', '==', parent_prog_id).stream()]
    
    ai_cross_prog = ai_engine.generate_cross_programme_insights(completed_linkages, intelligence, new_programme)
    
    now = datetime.datetime.utcnow().isoformat() + "Z"
    
    # Log the launch itself as an action
    launch_action_ref = db.collection('actions').document()
    launch_action_ref.set({
        'id': launch_action_ref.id,
        'type': 'programme_launched',
        'tier': 'inform',
        'description': f"Programme '{programme_name}' launched with cross-programme intelligence from {parent_prog_id}.",
        'status': 'executed',
        'timestamp': now,
        'aiReasoning': f"Analyzed {len(completed_linkages)} historical linkages and {len(intelligence)} mentor performance records.",
    })
    
    # Persist carry-over suggestions as proposed linkages + actions
    for suggestion in ai_cross_prog.get('carryOverSuggestions', []):
        mentor_id = suggestion.get('mentorId', '')
        startup_id = suggestion.get('startupId', '')
        linkage_id = f"link_carry_{mentor_id}_{startup_id}"
        
        linkage_data = {
            'id': linkage_id,
            'type': 'mentorship',
            'status': 'proposed',
            'mentorId': mentor_id,
            'startupId': startup_id,
            'programmeId': programme_id,
            'healthScore': 50,
            'healthTrend': 'stable',
            'autonomyLevel': 'approve',
            'signals': {'meetingFrequency': 0, 'feedbackAvg': 0},
            'aiInsight': suggestion.get('reason', 'Carry-over from previous programme.'),
        }
        db.collection('linkages').document(linkage_id).set(linkage_data)
        
        action_ref = db.collection('actions').document()
        action_ref.set({
            'id': action_ref.id,
            'linkageId': linkage_id,
            'type': 'carryover_proposed',
            'tier': 'approve',
            'description': f"Carry-over proposed: {mentor_id} \u2194 {startup_id} from {parent_prog_id}. {suggestion.get('reason', '')}",
            'status': 'proposed',
            'timestamp': now,
            'aiReasoning': suggestion.get('reason', ''),
        })
    
    # Update programme status to active
    if prog_doc.exists:
        db.collection('programmes').document(programme_id).update({'status': 'active'})
    
    return {
        "status": "success", 
        "message": f"Programme '{programme_name}' launched. {len(ai_cross_prog.get('carryOverSuggestions', []))} carry-over suggestions created.",
        "crossProgrammeIntelligence": {
            "stats": intelligence,
            "aiInsights": ai_cross_prog
        }
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