'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Briefcase, Handshake, Search, X, Sparkles, RefreshCw } from 'lucide-react';
import EcosystemGraph from '@/components/EcosystemGraph';
import { API_BASE, type BackendActor, type BackendLinkage } from '@/services/api';

const TYPE_META = {
  mentor: { label: 'Mentors', icon: Users, iconClass: 'text-violet-400', dot: 'bg-violet-500' },
  startup: { label: 'Startups', icon: Briefcase, iconClass: 'text-sky-400', dot: 'bg-sky-500' },
  partner: { label: 'Partners', icon: Handshake, iconClass: 'text-pink-400', dot: 'bg-pink-500' },
} as const;

const COLLAPSED_LIMIT = 4;

export default function EcosystemPage() {
  const [actors, setActors] = useState<BackendActor[]>([]);
  const [linkages, setLinkages] = useState<BackendLinkage[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    try {
      const [a, l] = await Promise.all([
        fetch(`${API_BASE}/api/actors`).then((r) => r.json()),
        fetch(`${API_BASE}/api/linkages`).then((r) => r.json()),
      ]);
      setActors(a);
      setLinkages(l);
      setError(null);
    } catch {
      setError('Backend unreachable on :8000');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    // Note: no auto-refetch on focus / visibilitychange. Those were causing the
    // network to reload constantly and wipe the user's dragged node positions.
    // Use the explicit Refresh button when you want to pull fresh data.
  }, [refetch]);

  const grouped = useMemo(() => {
    const out: Record<'mentor' | 'startup' | 'partner', BackendActor[]> = { mentor: [], startup: [], partner: [] };
    const q = query.trim().toLowerCase();
    for (const a of actors) {
      if (q && !a.name.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) continue;
      if (out[a.type]) out[a.type].push(a);
    }
    return out;
  }, [actors, query]);

  const totalMatches = grouped.mentor.length + grouped.startup.length + grouped.partner.length;
  const selectedActor = actors.find((a) => a.id === selectedId);

  return (
    <div
      className="-mx-8 lg:-mx-12 -my-8 relative bg-[#0F1117]"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      {/* Background graph */}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl border border-[#991B1B] bg-[#2A1515] p-4 text-sm text-[#F87171]">{error}</div>
        </div>
      ) : (
        <EcosystemGraph
          actors={actors}
          linkages={linkages}
          selectedId={selectedId}
          onNodeClick={(id) => setSelectedId(id)}
        />
      )}

      {/* Top-left: Title + Search */}
      <div className="absolute top-6 left-6 z-20 w-[360px] max-w-[calc(100vw-300px)] space-y-3">
        <div className="rounded-xl bg-[#1A1D27]/95 backdrop-blur-sm border border-[#2A2D3A] shadow-lg p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[#E8E9ED]">Ecosystem</h1>
              <p className="mt-1 text-xs text-[#5F6170]">
                Search by name, click to zoom in on a node.
              </p>
            </div>
            <button
              onClick={refetch}
              disabled={refreshing}
              title="Refetch actors and linkages"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-[#2A2D3A] bg-[#232733] px-2.5 py-1.5 text-xs font-medium text-[#8B8D98] hover:text-[#E8E9ED] hover:bg-[#2A2D3A] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6170]" />
            <input
              type="text"
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-[#2A2D3A] bg-[#232733] pl-9 pr-9 py-2 text-sm text-[#E8E9ED] placeholder:text-[#5F6170] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#5F6170] hover:text-[#8B8D98]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {query && (
            <p className="mt-2 text-xs text-[#5F6170]">
              {totalMatches === 0
                ? `No matches for "${query}".`
                : `${totalMatches} match${totalMatches === 1 ? '' : 'es'}.`}
            </p>
          )}
        </div>

        {/* Selected actor card */}
        {selectedActor && (
          <div className="rounded-xl bg-[#1A1D27]/95 backdrop-blur-sm border border-indigo-500/30 shadow-lg p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="h-3 w-3" />
                  Focused
                </div>
                <p className="mt-2 text-sm font-semibold text-[#E8E9ED] truncate">{selectedActor.name}</p>
                <p className="text-xs text-[#5F6170] font-mono">{selectedActor.id}</p>
                {selectedActor.expertise && (
                  <p className="mt-2 text-xs text-[#8B8D98]">{selectedActor.expertise.join(' · ')}</p>
                )}
                {selectedActor.domain && (
                  <p className="mt-1 text-xs text-[#8B8D98]">{selectedActor.domain}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedId(undefined)}
                className="shrink-0 p-1 rounded-md text-[#5F6170] hover:text-[#8B8D98] hover:bg-[#232733]"
                aria-label="Clear selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top-right: Legend */}
      <div className="absolute top-6 right-6 z-20 rounded-xl bg-[#1A1D27]/95 backdrop-blur-sm border border-[#2A2D3A] shadow-lg px-5 py-4">
        <p className="text-xs font-semibold text-[#5F6170] uppercase tracking-wide">Legend</p>
        <div className="mt-3 space-y-1.5 text-xs text-[#8B8D98]">
          <Legend dot="bg-violet-500" label="Mentor" />
          <Legend dot="bg-sky-500" label="Startup" />
          <Legend dot="bg-pink-500" label="Partner" />
          <div className="border-t border-[#2A2D3A] my-2"></div>
          <Legend dot="bg-[#34D399]" label="Healthy edge" />
          <Legend dot="bg-[#FBBF24]" label="At-risk edge" />
          <Legend dot="bg-[#F87171]" label="Failing (pulses)" />
        </div>
      </div>

      {/* Bottom: Floating actor category cards */}
      <div className="absolute bottom-6 left-6 right-6 z-20 grid grid-cols-3 gap-4">
        {(['mentor', 'startup', 'partner'] as const).map((type) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const list = grouped[type];
          const isExpanded = !!expanded[type];
          const visible = isExpanded ? list : list.slice(0, COLLAPSED_LIMIT);

          return (
            <div
              key={type}
              className="rounded-2xl bg-[#1A1D27]/95 backdrop-blur-md border border-[#2A2D3A] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-5"
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${meta.iconClass}`} />
                <p className="text-sm font-semibold text-[#E8E9ED] tracking-wide">{meta.label}</p>
                <span className="ml-auto text-sm font-medium text-[#5F6170]">{list.length}</span>
              </div>

              {list.length === 0 ? (
                <p className="mt-3 text-sm text-[#5F6170] italic">No matches</p>
              ) : (
                <>
                  <ul className="mt-3 space-y-1 max-h-[200px] overflow-y-auto pr-1">
                    {visible.map((a) => {
                      const isSelected = a.id === selectedId;
                      return (
                        <li key={a.id}>
                          <button
                            onClick={() => setSelectedId(a.id)}
                            className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                              isSelected
                                ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30'
                                : 'hover:bg-[#232733]'
                            }`}
                          >
                            <p
                              className={`font-medium truncate ${
                                isSelected ? 'text-indigo-300' : 'text-[#E8E9ED]'
                              }`}
                            >
                              {a.name}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {list.length > COLLAPSED_LIMIT && (
                    <button
                      onClick={() => setExpanded((e) => ({ ...e, [type]: !isExpanded }))}
                      className="mt-3 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      {isExpanded ? '↑ See less' : `↓ See ${list.length - COLLAPSED_LIMIT} more`}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
