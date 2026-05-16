import Link from 'next/link';
import { api, API_BASE, BackendActor, BackendLinkage } from '@/services/api';

function band(score: number) {
  if (score >= 70) return { label: 'Healthy', tone: 'good' };
  if (score >= 40) return { label: 'At Risk', tone: 'risk' };
  return { label: 'Failing', tone: 'fail' };
}

const TONE_BAR: Record<string, string> = {
  good: 'bg-[#34D399]',
  risk: 'bg-[#FBBF24]',
  fail: 'bg-[#F87171]',
};
const TONE_PILL: Record<string, string> = {
  good: 'bg-[#0D2A1A] text-[#34D399] border-[#166534]',
  risk: 'bg-[#2A1D0C] text-[#FBBF24] border-[#92400E]',
  fail: 'bg-[#2A1515] text-[#F87171] border-[#991B1B]',
};
const TONE_NUM: Record<string, string> = {
  good: 'text-[#34D399]',
  risk: 'text-[#FBBF24]',
  fail: 'text-[#F87171]',
};

const TREND_ARROW: Record<string, string> = {
  improving: '↑',
  stable: '→',
  declining: '↓',
};

export default async function HealthDashboardPage() {
  let linkages: BackendLinkage[] = [];
  let actors: BackendActor[] = [];
  try {
    [linkages, actors] = await Promise.all([
      api.getLinkagesRaw('prog_B'),
      fetch(`${API_BASE}/api/actors`, { cache: 'no-store' }).then((r) => r.json()),
    ]);
  } catch {
    // backend unreachable — render empty state below
  }

  const nameById = new Map(actors.map((a) => [a.id, a.name]));
  const counts = { healthy: 0, atRisk: 0, failing: 0 };
  for (const l of linkages) {
    if (l.healthScore >= 70) counts.healthy++;
    else if (l.healthScore >= 40) counts.atRisk++;
    else counts.failing++;
  }
  const sorted = [...linkages].sort((a, b) => a.healthScore - b.healthScore);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#E8E9ED]">Health Dashboard</h1>
        <p className="mt-2 text-sm text-[#8B8D98]">
          Real-time health for every active linkage in Programme B. Color-coded; failing first.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <SummaryCard label="Healthy (≥70)" count={counts.healthy} tone="good" />
        <SummaryCard label="At Risk (40–69)" count={counts.atRisk} tone="risk" />
        <SummaryCard label="Failing (<40)" count={counts.failing} tone="fail" />
      </div>

      <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#2A2D3A]">
          <h3 className="text-base font-medium text-[#E8E9ED]">All active linkages</h3>
        </div>
        <div className="divide-y divide-[#2A2D3A]">
          {sorted.length === 0 && (
            <div className="p-6 text-sm text-[#5F6170]">No linkages — is the backend running on :8000?</div>
          )}
          {sorted.map((l) => {
            const b = band(l.healthScore);
            return (
              <Link
                key={l.id}
                href={`/linkages/${l.id}`}
                className="block p-6 hover:bg-[#232733]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${TONE_PILL[b.tone]}`}>
                        {b.label}
                      </span>
                      <span className="text-xs text-[#8B8D98]">
                        {TREND_ARROW[l.healthTrend] ?? ''} {l.healthTrend}
                      </span>
                      <span className="text-xs text-[#5F6170]">·</span>
                      <span className="text-xs text-[#5F6170]">{l.id}</span>
                    </div>
                    <p className="text-sm font-medium text-[#E8E9ED]">
                      {nameById.get(l.mentorId) ?? l.mentorId} {'\u2194'} {nameById.get(l.startupId) ?? l.startupId}
                    </p>
                    {l.aiInsight && (
                      <p className="mt-1 text-sm text-[#8B8D98] truncate">{l.aiInsight}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-[#E8E9ED] leading-none">{l.healthScore}</p>
                      <p className="text-xs text-[#5F6170] mt-1">/ 100</p>
                    </div>
                    <div className="w-32 h-2 bg-[#232733] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${TONE_BAR[b.tone]}`}
                        style={{ width: `${l.healthScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
      <p className="text-sm font-medium text-[#8B8D98]">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${TONE_NUM[tone]}`}>{count}</p>
    </div>
  );
}
