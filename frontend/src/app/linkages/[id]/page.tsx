import Link from 'next/link';
import { BackendActor, BackendLinkage } from '@/services/api';
import { ArrowLeft } from 'lucide-react';

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`http://localhost:8000${path}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json() as Promise<T>;
  } catch {
    return null;
  }
}

export default async function LinkageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const linkage = await fetchJson<BackendLinkage>(`/api/linkages/${id}`);
  if (!linkage) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <p className="text-[#8B8D98]">Linkage {id} not found.</p>
        <Link href="/health" className="text-indigo-400 hover:underline">{'\u2190'} Back to Health Dashboard</Link>
      </div>
    );
  }

  const [mentor, startup] = await Promise.all([
    fetchJson<{ actor: BackendActor }>(`/api/actors/${linkage.mentorId}`),
    fetchJson<{ actor: BackendActor }>(`/api/actors/${linkage.startupId}`),
  ]);

  const isHealthy = linkage.healthScore >= 70;
  const isAtRisk = linkage.healthScore >= 40 && linkage.healthScore < 70;

  const banner = isHealthy
    ? { border: 'border-[#166534]', bg: 'bg-[#0D2A1A]', title: 'text-[#34D399]', body: 'text-[#34D399]/80' }
    : isAtRisk
      ? { border: 'border-[#92400E]', bg: 'bg-[#2A1D0C]', title: 'text-[#FBBF24]', body: 'text-[#FBBF24]/80' }
      : { border: 'border-[#991B1B]', bg: 'bg-[#2A1515]', title: 'text-[#F87171]', body: 'text-[#F87171]/80' };

  const scoreClass = isHealthy ? 'text-[#34D399]' : isAtRisk ? 'text-[#FBBF24]' : 'text-[#F87171]';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/health" className="inline-flex items-center gap-2 text-sm text-[#8B8D98] hover:text-[#E8E9ED]">
        <ArrowLeft className="h-4 w-4" /> Back to Health Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-[#E8E9ED]">
          {mentor?.actor.name ?? linkage.mentorId} {'\u2194'} {startup?.actor.name ?? linkage.startupId}
        </h1>
        <p className="mt-2 text-sm text-[#8B8D98]">
          Linkage <span className="font-mono">{linkage.id}</span> · Programme {linkage.programmeId} · Status: <span className="font-medium text-[#E8E9ED]">{linkage.status}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
          <p className="text-sm font-medium text-[#8B8D98]">Health score</p>
          <p className={`mt-2 text-2xl font-bold ${scoreClass}`}>{linkage.healthScore} / 100</p>
        </div>
        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
          <p className="text-sm font-medium text-[#8B8D98]">Trend</p>
          <p className="mt-2 text-2xl font-bold text-[#E8E9ED]">{linkage.healthTrend}</p>
        </div>
        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
          <p className="text-sm font-medium text-[#8B8D98]">Autonomy</p>
          <p className="mt-2 text-2xl font-bold text-[#E8E9ED]">{linkage.autonomyLevel}</p>
        </div>
      </div>

      {linkage.aiInsight && (
        <div className={`rounded-xl border ${banner.border} ${banner.bg} p-6`}>
          <p className={`text-sm font-medium ${banner.title}`}>AI insight</p>
          <p className={`mt-1 text-sm ${banner.body}`}>{linkage.aiInsight}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
          <p className="text-sm font-medium text-[#8B8D98]">Mentor</p>
          {mentor ? (
            <>
              <p className="mt-2 text-lg font-semibold text-[#E8E9ED]">{mentor.actor.name}</p>
              <p className="text-xs text-[#5F6170] mt-1">{mentor.actor.id}</p>
              {mentor.actor.expertise && (
                <p className="mt-3 text-sm text-[#8B8D98]">
                  Expertise: {mentor.actor.expertise.join(', ')}
                </p>
              )}
              {mentor.actor.historicalScore != null && (
                <p className="mt-1 text-sm text-[#8B8D98]">
                  Historical score: <span className="font-medium text-[#E8E9ED]">{mentor.actor.historicalScore}</span>
                </p>
              )}
            </>
          ) : <p className="text-sm text-[#5F6170] mt-2">{linkage.mentorId}</p>}
        </div>

        <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
          <p className="text-sm font-medium text-[#8B8D98]">Startup</p>
          {startup ? (
            <>
              <p className="mt-2 text-lg font-semibold text-[#E8E9ED]">{startup.actor.name}</p>
              <p className="text-xs text-[#5F6170] mt-1">{startup.actor.id}</p>
              {startup.actor.domain && (
                <p className="mt-3 text-sm text-[#8B8D98]">Domain: {startup.actor.domain}</p>
              )}
            </>
          ) : <p className="text-sm text-[#5F6170] mt-2">{linkage.startupId}</p>}
        </div>
      </div>

      <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6">
        <p className="text-sm font-medium text-[#8B8D98]">Signals</p>
        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
          <div>
            <p className="text-[#5F6170]">Meeting frequency</p>
            <p className="text-[#E8E9ED] font-medium">{linkage.signals.meetingFrequency} / week</p>
          </div>
          <div>
            <p className="text-[#5F6170]">Feedback average</p>
            <p className="text-[#E8E9ED] font-medium">{linkage.signals.feedbackAvg} / 5</p>
          </div>
        </div>
      </div>
    </div>
  );
}
