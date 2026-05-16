export interface Actor {
  id: string;
  name: string;
  type: 'mentor' | 'startup' | 'partner';
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

const malaysianNames = [
  'Dr. Aisha Rahman', 'Tan Sri Lim', 'Kavita Muthu', 'Ahmad Zaki', 'Nurul Izzah',
  'Wong Siew Hua', 'Siti Aminah', 'Ravi Chandran', 'Hafiz Bakri', 'Mei Ling',
  'Zulkifli Yusof', 'Sarah Jane Abdullah', 'Kumar Subramaniam', 'Farah Hanum', 'Jason Teh',
  'Noraini Hassan', 'Chong Wei Feng', 'Divya Nair', 'Mohd Syazwan', 'Michelle Yeoh',
  'Azman Hashim', 'Lee Chong Wei', 'Sangeeta Kaur', 'Ibrahim Ali', 'Fatimah Bee',
  'Gan Seng Bee', 'Rozita Che Wan', 'Siva Shankar', 'Ariff Shah', 'Yuna Yusof',
  'Khairy Jamaluddin', 'Shila Amzah', 'Zizan Razak', 'Lisa Surihani', 'Scha Alyahya',
  'Nabil Ahmad', 'Mira Filzah', 'Ben Amir', 'Janna Nick', 'Remy Ishak',
  'Siti Nurhaliza', 'Sheila Majid', 'Amy Search', 'Faizal Tahir', 'Dayang Nurfaizah',
  'Hael Husaini', 'Ernie Zakri', 'Syamel', 'Naim Daniel', 'Ismail Izzani'
];

const startupNames = [
  'PayFlex', 'MakanTime', 'MyHealth', 'AgriSmart', 'EduLeap',
  'EcoVibe', 'SecureNet', 'SolarFlow', 'BioTrace', 'LogiLink',
  'FinMate', 'AutoDrive', 'AquaPure', 'CloudNest', 'DataWave',
  'SwiftPay', 'SmartHome', 'CareHub', 'GreenGrid', 'InnoSpace',
  'KopiBot', 'NasiOps', 'DurianData', 'PasarTech', 'RotiCloud',
  'SateSync', 'BatikByte', 'WauWeb', 'GasingGrid', 'KerisKern'
];

const partnerNames = [
  'Khazanah Nasional', 'MDEC', 'MaGIC', 'Cradle Fund', 'Maybank Hive'
];

export const api = {
  checkBackendHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/actors`, { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  },

  getStatsSummary: async (): Promise<StatsSummary> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats/summary`, { cache: 'no-store' });
      return await res.json();
    } catch {
      return { autoExecuted: 156, informed: 42, pendingApproval: 8, overridden: 2 };
    }
  },

  getStatsHealth: async (): Promise<StatsHealth> => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats/health`, { cache: 'no-store' });
      return await res.json();
    } catch {
      return { healthy: 32, atRisk: 12, failing: 4 };
    }
  },

  getActors: async (type?: string): Promise<Actor[]> => {
    let actors: Actor[] = [];
    try {
      let url = `${API_BASE_URL}/actors`;
      if (type) url += `?type=${type}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) actors = await res.json();
    } catch (e) {
      console.warn("Backend actors unreachable, using mock set.");
    }

    // HYBRID DATA AUGMENTATION
    // If backend data is sparse (< 30), inject 40+ mock nodes
    if (actors.length < 30) {
      const mockSet: Actor[] = [];
      for (let i = 0; i < 15; i++) {
        mockSet.push({ id: `mock-m-${i}`, name: malaysianNames[i % 50], type: 'mentor' });
      }
      for (let i = 0; i < 30; i++) {
        mockSet.push({ id: `mock-s-${i}`, name: startupNames[i % 30], type: 'startup' });
      }
      for (let i = 0; i < 5; i++) {
        mockSet.push({ id: `mock-p-${i}`, name: partnerNames[i % 5], type: 'partner' });
      }
      // Mix them in
      return [...actors, ...mockSet];
    }
    return actors;
  },

  getLinkages: async (): Promise<Linkage[]> => {
    let linkages: Linkage[] = [];
    try {
      const res = await fetch(`${API_BASE_URL}/linkages`, { cache: 'no-store' });
      if (res.ok) linkages = await res.json();
    } catch (e) {
      console.warn("Backend linkages unreachable.");
    }

    if (linkages.length < 20) {
      const mockLinks: Linkage[] = [];
      for (let i = 0; i < 50; i++) {
        const mId = `mock-m-${Math.floor(Math.random() * 15)}`;
        const sId = `mock-s-${Math.floor(Math.random() * 30)}`;
        const health = 40 + Math.floor(Math.random() * 60);
        mockLinks.push({
          id: `mock-l-${i}`,
          mentorId: mId,
          startupId: sId,
          healthScore: health,
          status: health > 70 ? 'healthy' : 'at-risk'
        });
      }
      return [...linkages, ...mockLinks];
    }
    return linkages;
  },

  getActions: async (): Promise<Action[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/actions`, { cache: 'no-store' });
      return await res.json();
    } catch {
      return [
        { 
          id: '1', 
          tier: 'auto', 
          description: 'Matched Dr. Aisha with PayFlex', 
          timestamp: new Date().toISOString(), 
          status: 'completed',
          mentorName: 'Dr. Aisha Rahman',
          startupName: 'PayFlex',
          aiReasoning: 'Deep alignment in fintech domain.'
        }
      ];
    }
  },

  generateMatching: async (mentors: any[], startups: any[], goals: any): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/match`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentors, startups, goals })
      });
      return await res.json();
    } catch {
      return {
        pairings: [{ mentorId: 'm1', startupId: 's1', confidence: 0.95, reasoning: 'AI Reasoning Fallback.' }]
      };
    }
  }
};
