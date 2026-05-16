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
  strength: number; // 1 to 100
}

export interface Action {
  id: string;
  type: 'Auto-executed' | 'Informed' | 'Awaiting Approval';
  description: string;
  timestamp: string;
  actorId: string;
}

// Mock Data
const MOCK_ACTORS: Actor[] = [
  { id: '1', name: 'Sarah Admin', role: 'Administrator', status: 'active' },
  { id: '2', name: 'Dr. Emily Chen', role: 'Programme Manager', status: 'active' },
];

const MOCK_LINKAGES: Linkage[] = [
  { id: '1', sourceActorId: '1', targetActorId: '2', type: 'Supervises', strength: 80 },
];

const MOCK_ACTIONS: Action[] = [
  { id: '1', type: 'Auto-executed', description: 'Matched Student A with Tutor B', timestamp: '2026-05-16T08:00:00Z', actorId: '1' },
  { id: '2', type: 'Informed', description: 'Programme completion report generated', timestamp: '2026-05-16T09:15:00Z', actorId: '2' },
  { id: '3', type: 'Awaiting Approval', description: 'New ecosystem partner request', timestamp: '2026-05-16T10:30:00Z', actorId: '1' },
];

export const api = {
  getActors: async (): Promise<Actor[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_ACTORS), 500));
  },
  getLinkages: async (): Promise<Linkage[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_LINKAGES), 500));
  },
  getActions: async (): Promise<Action[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_ACTIONS), 500));
  },
};
