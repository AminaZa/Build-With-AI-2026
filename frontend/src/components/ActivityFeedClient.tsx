'use client';

import { useState } from 'react';
import { CheckCircle, Activity, Clock, AlertTriangle, ChevronDown, ChevronRight, Check, X, Loader2, MessageSquare } from 'lucide-react';
import { api, Action, BackendStatsSummary } from '@/services/api';

// -- Helpers --

function fixEncoding(text: string): string {
  // Fix UTF-8 encoding issues: â†" → ↔
  return text
    .replace(/â†\u0094/g, '\u2194')
    .replace(/â†"/g, '\u2194')
    .replace(/↔/g, '\u2194');
}

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

function prettifyType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// -- Tier badge config --

const TIER_CONFIG = {
  auto: {
    label: 'Auto-executed',
    bg: 'bg-[#0D2A1A]',
    text: 'text-[#34D399]',
    border: 'border-[#166534]',
    accent: '#34D399',
    dot: 'bg-[#34D399]',
  },
  inform: {
    label: 'Acted + informed',
    bg: 'bg-[#0C1D33]',
    text: 'text-[#60A5FA]',
    border: 'border-[#1E40AF]',
    accent: '#60A5FA',
    dot: 'bg-[#60A5FA]',
  },
  approve: {
    label: 'Needs approval',
    bg: 'bg-[#2A1D0C]',
    text: 'text-[#FBBF24]',
    border: 'border-[#92400E]',
    accent: '#FBBF24',
    dot: 'bg-[#FBBF24]',
  },
} as const;

// -- Main component --

interface Props {
  stats: BackendStatsSummary;
  approveActions: Action[];
  informActions: Action[];
  autoActions: Action[];
}

export function ActivityFeedClient({ stats, approveActions: initialApprove, informActions, autoActions }: Props) {
  const [approveActions, setApproveActions] = useState(initialApprove);
  const [acting, setActing] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  function toggleReasoning(id: string) {
    setExpandedReasoning((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSection(key: string) {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function act(id: string, decision: 'approve' | 'reject') {
    setActing(id);
    try {
      if (decision === 'approve') await api.approveAction(id);
      else await api.rejectAction(id);
      setApproveActions((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(`${decision} failed for ${id}:`, e);
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#E8E9ED]">Activity Feed</h1>
        <p className="mt-2 text-sm text-[#8B8D98]">
          Monitor recent platform actions, system events, and match operations.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => scrollToSection('section-auto')}
          className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6 flex items-start gap-4 hover:border-[#34D399]/30 transition-colors text-left"
        >
          <div className="p-2 bg-[#0D2A1A] text-[#34D399] rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#8B8D98] uppercase tracking-wider">Auto-executed</p>
            <p className="text-3xl font-bold text-[#E8E9ED] mt-1">{stats.autoExecuted}</p>
          </div>
        </button>

        <button
          onClick={() => scrollToSection('section-inform')}
          className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6 flex items-start gap-4 hover:border-[#60A5FA]/30 transition-colors text-left"
        >
          <div className="p-2 bg-[#0C1D33] text-[#60A5FA] rounded-lg">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#8B8D98] uppercase tracking-wider">Informed</p>
            <p className="text-3xl font-bold text-[#E8E9ED] mt-1">{stats.informed}</p>
          </div>
        </button>

        <button
          onClick={() => scrollToSection('section-approve')}
          className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-6 flex items-start gap-4 hover:border-[#FBBF24]/30 transition-colors text-left"
        >
          <div className="p-2 bg-[#2A1D0C] text-[#FBBF24] rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#8B8D98] uppercase tracking-wider">Awaiting Approval</p>
            <p className="text-3xl font-bold text-[#E8E9ED] mt-1">{approveActions.length}</p>
          </div>
        </button>
      </div>

      {/* NEEDS YOUR APPROVAL section */}
      <div id="section-approve">
        <SectionHeader
          icon={<AlertTriangle className="h-5 w-5 text-[#FBBF24]" />}
          title="Needs Your Approval"
          count={approveActions.length}
          countColor="bg-[#FBBF24] text-[#0F1117]"
          collapsed={!!collapsedSections['approve']}
          onToggle={() => toggleSection('approve')}
        />

        {!collapsedSections['approve'] && (
          <>
            {approveActions.length === 0 ? (
              <div className="rounded-xl border border-[#166534]/40 bg-[#0D2A1A]/50 p-5 text-sm text-[#34D399] flex items-center gap-3 mt-4">
                <Check className="h-5 w-5 text-[#34D399]" />
                <div>
                  <p className="font-medium">All caught up</p>
                  <p className="text-[#34D399]/70 text-xs mt-0.5">No actions are awaiting your approval right now.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {approveActions.map((a) => (
                  <div
                    key={a.id}
                    className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] border-l-4 border-l-[#FBBF24] p-5 hover:bg-[#232733]/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <TierBadge tier="approve" />
                          <span className="text-[#5F6170]">{timeAgo(a.timestamp)}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#E8E9ED] mt-2">
                          {fixEncoding(a.description)}
                        </p>
                        {a.aiReasoning && (
                          <div className="mt-3">
                            <button
                              onClick={() => toggleReasoning(a.id)}
                              className="flex items-center gap-1.5 text-xs text-[#8B8D98] hover:text-[#E8E9ED] transition-colors"
                            >
                              {expandedReasoning[a.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              AI reasoning
                            </button>
                            {expandedReasoning[a.id] && (
                              <p className="text-xs text-[#8B8D98] mt-2 italic border-l-2 border-[#2A2D3A] pl-3">
                                &ldquo;{a.aiReasoning}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => act(a.id, 'reject')}
                          disabled={acting === a.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#7F1D1D] px-3 py-1.5 text-xs font-medium text-[#F87171] hover:bg-[#991B1B] disabled:opacity-50 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                        <button
                          disabled={acting === a.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2A2D3A] px-3 py-1.5 text-xs font-medium text-[#8B8D98] hover:bg-[#3A3D4A] disabled:opacity-50 transition-colors border border-[#3A3D4A]"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Message first
                        </button>
                        <button
                          onClick={() => act(a.id, 'approve')}
                          disabled={acting === a.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#166534] px-3 py-1.5 text-xs font-medium text-[#34D399] hover:bg-[#1A7A3E] disabled:opacity-50 transition-colors"
                        >
                          {acting === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ACTED & INFORMED section */}
      <div id="section-inform">
        <SectionHeader
          icon={<Activity className="h-5 w-5 text-[#60A5FA]" />}
          title="Acted & Informed"
          count={informActions.length}
          countColor="bg-[#60A5FA] text-[#0F1117]"
          collapsed={!!collapsedSections['inform']}
          onToggle={() => toggleSection('inform')}
        />

        {!collapsedSections['inform'] && (
          <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] overflow-hidden mt-4">
            <div className="divide-y divide-[#2A2D3A]">
              {informActions.length === 0 ? (
                <div className="p-6 text-sm text-[#5F6170]">No informed actions yet.</div>
              ) : (
                informActions.map((action) => (
                  <ActionCard key={action.id} action={action} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* AUTO-EXECUTED section */}
      <div id="section-auto">
        <SectionHeader
          icon={<CheckCircle className="h-5 w-5 text-[#34D399]" />}
          title="Auto-Executed"
          count={autoActions.length}
          countColor="bg-[#34D399] text-[#0F1117]"
          collapsed={!!collapsedSections['auto']}
          onToggle={() => toggleSection('auto')}
        />

        {!collapsedSections['auto'] && (
          <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] overflow-hidden mt-4">
            <div className="divide-y divide-[#2A2D3A]">
              {autoActions.length === 0 ? (
                <div className="p-6 text-sm text-[#5F6170]">No auto-executed actions yet.</div>
              ) : (
                autoActions.map((action) => (
                  <ActionCard key={action.id} action={action} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Sub-components --

function TierBadge({ tier }: { tier: 'auto' | 'inform' | 'approve' }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  countColor,
  collapsed,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  countColor: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full text-left group"
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4 text-[#5F6170] group-hover:text-[#8B8D98]" />
      ) : (
        <ChevronDown className="h-4 w-4 text-[#5F6170] group-hover:text-[#8B8D98]" />
      )}
      {icon}
      <h2 className="text-sm font-semibold text-[#E8E9ED] uppercase tracking-wider">
        {title}
      </h2>
      <span
        className={`inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-bold ${countColor}`}
      >
        {count}
      </span>
    </button>
  );
}

function ActionCard({ action }: { action: Action }) {
  const cfg = TIER_CONFIG[action.tier];
  return (
    <div
      className="p-5 flex items-start gap-4 hover:bg-[#232733]/40 transition-colors"
      style={{ borderLeft: `3px solid ${cfg.accent}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <TierBadge tier={action.tier} />
          <span className="text-xs text-[#5F6170]">{timeAgo(action.timestamp)}</span>
        </div>
        <p className="text-sm font-medium text-[#E8E9ED]">
          {fixEncoding(action.description)}
        </p>
      </div>
    </div>
  );
}
