// Frontend API client. Targets the FastAPI backend at localhost:8000.
// Falls back to mock data if the backend is unreachable so the demo never blanks.

const BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

// ---------- Backend response shapes ----------

export interface BackendActor {
  id: string;
  type: 'mentor' | 'startup' | 'partner';
  name: string;
  expertise?: string[];
  domain?: string;
  capacity?: number;
  historicalScore?: number;
  programmes?: string[];
}

export interface BackendLinkage {
  id: string;
  type: string;
  status: 'active' | 'paused' | 'completed' | 'proposed';
  mentorId: string;
  startupId: string;
  programmeId: string;
  healthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  autonomyLevel: 'silent' | 'notify' | 'approve';
  signals: { meetingFrequency: number; feedbackAvg: number; [k: string]: unknown };
  aiInsight?: string;
}

export interface BackendAction {
  id: string;
  linkageId?: string;
  type: string;
  description: string;
  status: 'executed' | 'proposed' | 'approved' | 'rejected' | 'pending';
  timestamp: string;
  aiReasoning?: string;
  tier?: 'auto' | 'inform' | 'approve';
}

export interface BackendStatsSummary {
  autoExecuted: number;
  informed: number;
  pendingApproval: number;
  overridden: number;
}

export interface BackendStatsHealth {
  healthy: number;
  atRisk: number;
  failing: number;
}

// ---------- Frontend display shapes ----------

export interface Actor {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
}

export interface Linkage {
  id: string;
  sourceActorId: string;
  targetActorId: string;
  type: string;
  strength: number;
}

export type TierType = 'auto' | 'inform' | 'approve';

export interface Action {
  id: string;
  tier: TierType;
  type: string;
  description: string;
  timestamp: string;
  linkageId: string;
  aiReasoning?: string;
  status: string;
}

// ---------- Tier inference ----------

function inferTier(a: BackendAction): TierType {
  // If the backend provides a tier field, prefer that
  if (a.tier === 'auto' || a.tier === 'inform' || a.tier === 'approve') return a.tier;
  // Otherwise infer from status and action type
  if (a.status === 'proposed' || a.status === 'pending') return 'approve';
  const informTypes = ['agenda_sent', 'cadence_adjusted', 'nudge_sent', 'alert_sent', 'assessment_sent', 'partner_connected'];
  if (informTypes.includes(a.type)) return 'inform';
  return 'auto';
}

// ---------- Fallback mocks (if backend unreachable) ----------

const MOCK_ACTORS: Actor[] = [
  { id: 'mentor_001', name: 'Dr. Aisha Rahman', role: 'Mentor', status: 'active' },
  { id: 'startup_001', name: 'PayFlex', role: 'Startup', status: 'active' },
];
const MOCK_LINKAGES: Linkage[] = [
  { id: 'link_B_01', sourceActorId: 'mentor_001', targetActorId: 'startup_001', type: 'mentorship', strength: 91 },
];
const MOCK_ACTIONS: Action[] = [
  { id: 'a1', tier: 'auto', type: 'nudge_sent', description: 'Sent weekly meeting reminder', timestamp: new Date().toISOString(), linkageId: 'link_B_01', status: 'executed' },
];

// ---------- Helpers ----------

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ---------- Public API ----------

export const api = {
  async getActors(): Promise<Actor[]> {
    try {
      const data = await fetchJson<BackendActor[]>('/api/actors');
      return data.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.type === 'mentor' ? 'Mentor' : a.type === 'startup' ? 'Startup' : 'Partner',
        status: 'active' as const,
      }));
    } catch {
      return MOCK_ACTORS;
    }
  },

  async getLinkages(): Promise<Linkage[]> {
    try {
      const data = await fetchJson<BackendLinkage[]>('/api/linkages');
      return data.map((l) => ({
        id: l.id,
        sourceActorId: l.mentorId,
        targetActorId: l.startupId,
        type: l.type,
        strength: l.healthScore,
      }));
    } catch {
      return MOCK_LINKAGES;
    }
  },

  async getActions(): Promise<Action[]> {
    try {
      const data = await fetchJson<BackendAction[]>('/api/actions');
      return data.map((a) => ({
        id: a.id,
        tier: inferTier(a),
        type: a.type,
        description: a.description,
        timestamp: a.timestamp,
        linkageId: a.linkageId ?? '',
        aiReasoning: a.aiReasoning,
        status: a.status || 'executed',
      }));
    } catch {
      return MOCK_ACTIONS;
    }
  },

  // Raw passthroughs for pages that want the richer shape
  async getStatsSummary(): Promise<BackendStatsSummary> {
    return fetchJson<BackendStatsSummary>('/api/stats/summary');
  },

  async getStatsHealth(): Promise<BackendStatsHealth> {
    return fetchJson<BackendStatsHealth>('/api/stats/health');
  },

  async getLinkagesRaw(programme?: string): Promise<BackendLinkage[]> {
    const q = programme ? `?programme=${encodeURIComponent(programme)}` : '';
    return fetchJson<BackendLinkage[]>(`/api/linkages${q}`);
  },

  async getPendingActions(): Promise<BackendAction[]> {
    return fetchJson<BackendAction[]>('/api/actions?status=proposed');
  },

  async approveAction(id: string): Promise<{ status: string; message: string }> {
    const r = await fetch(`${BASE}/api/actions/${id}/approve`, { method: 'POST' });
    if (!r.ok) throw new Error(`approve ${id} → ${r.status}`);
    return r.json();
  },

  async rejectAction(id: string): Promise<{ status: string; message: string }> {
    const r = await fetch(`${BASE}/api/actions/${id}/reject`, { method: 'POST' });
    if (!r.ok) throw new Error(`reject ${id} → ${r.status}`);
    return r.json();
  },
};
