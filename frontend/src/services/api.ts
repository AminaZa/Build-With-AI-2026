export interface Actor {
  id: string;
  name: string;
  type: 'mentor' | 'startup';
  role?: string;
  status?: string;
  expertise?: string[];
  [key: string]: any;
}

export interface Linkage {
  id: string;
  mentorId: string;
  startupId: string;
  programmeId?: string;
  healthScore: number;
  status: string;
  [key: string]: any;
}

export interface Action {
  id: string;
  tier: 'auto' | 'inform' | 'pending';
  type: string;
  description: string;
  timestamp: string;
  status: string;
  aiReasoning?: string;
  mentorName?: string;
  startupName?: string;
  [key: string]: any;
}

export interface StatsSummary {
  autoExecuted: number;
  informed: number;
  pendingApproval: number;
  overridden: number;
}

export interface StatsHealth {
  healthy: number;
  atRisk: number;
  failing: number;
}

const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  getStatsSummary: async (): Promise<StatsSummary> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats/summary`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch summary');
      return await res.json();
    } catch (e) {
      return { autoExecuted: 47, informed: 12, pendingApproval: 3, overridden: 0 };
    }
  },

  getStatsHealth: async (): Promise<StatsHealth> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats/health`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch health');
      return await res.json();
    } catch (e) {
      return { healthy: 25, atRisk: 5, failing: 2 };
    }
  },

  getActors: async (type?: string): Promise<Actor[]> => {
    try {
      let url = `${API_BASE_URL}/actors`;
      if (type) url += `?type=${type}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch actors');
      return await res.json();
    } catch (e) {
      return [
        { id: 'm1', name: 'Dr. Aisha Rahman', type: 'mentor', expertise: ['Fintech', 'AI'] },
        { id: 'm2', name: 'Tan Sri Lim', type: 'mentor', expertise: ['Scaling', 'Operations'] },
        { id: 'm3', name: 'Kavita Muthu', type: 'mentor', expertise: ['UX', 'Product'] },
        { id: 's1', name: 'PayFlex', type: 'startup', expertise: ['Payments'] },
        { id: 's2', name: 'MakanTime', type: 'startup', expertise: ['Logistics'] },
        { id: 's3', name: 'MyHealth', type: 'startup', expertise: ['Healthtech'] }
      ];
    }
  },

  getLinkages: async (): Promise<Linkage[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/linkages`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch linkages');
      return await res.json();
    } catch (e) {
      return [
        { id: 'l1', mentorId: 'm1', startupId: 's1', healthScore: 85, status: 'active' },
        { id: 'l2', mentorId: 'm2', startupId: 's2', healthScore: 45, status: 'at-risk' },
        { id: 'l3', mentorId: 'm3', startupId: 's3', healthScore: 92, status: 'active' }
      ];
    }
  },

  getActions: async (): Promise<Action[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/actions`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch actions');
      return await res.json();
    } catch (e) {
      return [
        { 
          id: '1', 
          tier: 'auto', 
          description: 'Linked Dr. Aisha with PayFlex', 
          timestamp: new Date().toISOString(), 
          status: 'completed',
          mentorName: 'Dr. Aisha Rahman',
          startupName: 'PayFlex'
        },
        { 
          id: '2', 
          tier: 'inform', 
          description: 'Strategic review scheduled for MakanTime', 
          timestamp: new Date().toISOString(), 
          status: 'scheduled',
          mentorName: 'Tan Sri Lim',
          startupName: 'MakanTime'
        }
      ];
    }
  },

  // AI Specific Endpoints from teammate
  generateMatching: async (mentors: any[], startups: any[], goals: any): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/match`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentors, startups, goals })
      });
      return await res.json();
    } catch (e) {
      return {
        pairings: [
          { 
            mentorId: 'm1', 
            startupId: 's1', 
            confidence: 0.95, 
            reasoning: 'Strong industry alignment in fintech.' 
          },
          { 
            mentorId: 'm2', 
            startupId: 's2', 
            confidence: 0.88, 
            reasoning: 'Operational expertise matches scaling needs.' 
          }
        ]
      };
    }
  },

  getAIInsight: async (linkageData: any): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/ai/insight`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkageData)
    });
    return await res.json();
  }
};
