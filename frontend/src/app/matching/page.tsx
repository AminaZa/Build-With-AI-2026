'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface Pairing {
  mentorId: string;
  startupId: string;
  confidence: number;
  reasoning: string;
  risks?: string | null;
  historicalNote?: string | null;
}

interface MatchingPlan {
  pairings: Pairing[];
  unmatched: string[];
  summary: string;
}

export default function MatchingPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<MatchingPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const r = await fetch('http://localhost:8000/api/matching/generate', { method: 'POST' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setPlan(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#E8E9ED]">Smart Matching</h1>
          <p className="mt-2 text-sm text-[#8B8D98]">
            Let the AI propose mentor-startup pairings based on expertise, capacity, and history.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating…' : 'Generate matching plan'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#991B1B] bg-[#2A1515] p-4 text-sm text-[#F87171]">
          {error}
        </div>
      )}

      {plan && (
        <>
          <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
            <p className="text-sm font-medium text-[#8B8D98]">Matching strategy</p>
            <p className="mt-2 text-sm text-[#E8E9ED]">{plan.summary}</p>
            {plan.unmatched.length > 0 && (
              <p className="mt-3 text-xs text-[#FBBF24]">
                Unmatched: {plan.unmatched.join(', ')}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {plan.pairings.map((p, i) => (
              <div key={i} className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#E8E9ED]">
                      {p.mentorId} {'\u2194'} {p.startupId}
                    </p>
                    <p className="mt-2 text-sm text-[#8B8D98]">{p.reasoning}</p>
                    {p.risks && (
                      <p className="mt-2 text-xs text-[#FBBF24]">
                        <span className="font-medium">Risk:</span> {p.risks}
                      </p>
                    )}
                    {p.historicalNote && (
                      <p className="mt-1 text-xs text-[#5F6170]">
                        <span className="font-medium">History:</span> {p.historicalNote}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-bold text-indigo-400 leading-none">
                      {(p.confidence * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-[#5F6170] mt-1">confidence</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!plan && !loading && !error && (
        <div className="rounded-xl border border-[#2A2D3A] bg-[#1A1D27] p-12 text-center">
          <Sparkles className="h-12 w-12 text-[#5F6170] mx-auto" />
          <p className="mt-4 text-sm text-[#8B8D98]">
            Click <span className="font-medium text-[#E8E9ED]">Generate matching plan</span> to call Gemini and propose pairings.
          </p>
        </div>
      )}
    </div>
  );
}
