'use client';

import { useEffect, useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';

interface Programme {
  id: string;
  name: string;
  status: string;
  goals?: { engagementRate?: number; matchCount?: number; targetOutcome?: string };
  startDate?: string;
  endDate?: string;
  parentProgramme?: string;
}

interface CrossProgrammeResponse {
  status: string;
  message: string;
  crossProgrammeIntelligence: {
    stats: Record<string, { avgScore: number; count: number; topDomain?: string | null }>;
    aiInsights: {
      topMentors: { mentorId: string; avgHealthScore: number; bestDomain: string; recommendation: string }[];
      successPatterns: string[];
      failurePatterns: string[];
      recommendations: string[];
      carryOverSuggestions: { mentorId: string; startupId: string; reason: string }[];
    };
  };
}

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<CrossProgrammeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/programmes')
      .then((r) => r.json())
      .then(setProgrammes)
      .catch(() => setError('Backend unreachable on :8000'));
  }, []);

  async function launch(progId: string) {
    setLoading(progId);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`http://localhost:8000/api/programmes/${progId}/launch`, { method: 'POST' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setResult(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Launch failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#E8E9ED]">Programmes</h1>
        <p className="mt-2 text-sm text-[#8B8D98]">
          Launch a programme to pull cross-programme intelligence from past cohorts.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-[#991B1B] bg-[#2A1515] p-4 text-sm text-[#F87171]">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programmes.map((p) => (
          <div key={p.id} className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5F6170] font-mono">{p.id}</p>
                <p className="text-lg font-semibold text-[#E8E9ED] mt-1">{p.name}</p>
                <p className="mt-1 text-xs text-[#8B8D98]">Status: {p.status}</p>
              </div>
              {p.status === 'active' && (
                <button
                  onClick={() => launch(p.id)}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {loading === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {loading === p.id ? 'Launching…' : 'Launch'}
                </button>
              )}
            </div>
            {p.goals && (
              <div className="mt-4 text-xs text-[#8B8D98] space-y-1">
                <p>Engagement target: <span className="font-medium text-[#E8E9ED]">{p.goals.engagementRate}%</span></p>
                <p>Match count: <span className="font-medium text-[#E8E9ED]">{p.goals.matchCount}</span></p>
                <p>Outcome: <span className="font-medium text-[#E8E9ED]">{p.goals.targetOutcome}</span></p>
              </div>
            )}
          </div>
        ))}
      </div>

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#166534] bg-[#0D2A1A] p-4">
            <p className="text-sm font-medium text-[#34D399]">{result.message}</p>
          </div>

          <Section title="Top mentors from past programmes">
            <ul className="space-y-3">
              {result.crossProgrammeIntelligence.aiInsights.topMentors.map((m) => (
                <li key={m.mentorId} className="text-sm">
                  <span className="font-semibold text-[#E8E9ED]">{m.mentorId}</span>
                  {' — '}
                  <span className="text-[#8B8D98]">{m.recommendation}</span>
                  {' '}
                  <span className="text-xs text-[#5F6170]">
                    (avg {m.avgHealthScore}, best in {m.bestDomain})
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Success patterns">
            <ul className="list-disc pl-5 space-y-1 text-sm text-[#8B8D98]">
              {result.crossProgrammeIntelligence.aiInsights.successPatterns.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Section>

          <Section title="Failure patterns">
            <ul className="list-disc pl-5 space-y-1 text-sm text-[#8B8D98]">
              {result.crossProgrammeIntelligence.aiInsights.failurePatterns.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Section>

          <Section title="Recommendations for the new programme">
            <ul className="list-disc pl-5 space-y-1 text-sm text-[#8B8D98]">
              {result.crossProgrammeIntelligence.aiInsights.recommendations.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Section>

          {result.crossProgrammeIntelligence.aiInsights.carryOverSuggestions.length > 0 && (
            <Section title="Carry-over suggestions">
              <ul className="space-y-2 text-sm">
                {result.crossProgrammeIntelligence.aiInsights.carryOverSuggestions.map((c, i) => (
                  <li key={i}>
                    <span className="font-mono text-xs text-[#5F6170]">{c.mentorId} → {c.startupId}</span>
                    <p className="text-[#8B8D98]">{c.reason}</p>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
      <p className="text-sm font-medium text-[#8B8D98]">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
