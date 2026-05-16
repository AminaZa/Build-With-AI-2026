'use client';

import { useEffect, useState } from 'react';
import { Check, X, Loader2, AlertCircle, Clock } from 'lucide-react';
import { api, BackendAction } from '@/services/api';

function prettifyType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PendingApprovals() {
  const [actions, setActions] = useState<BackendAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justResolved, setJustResolved] = useState<{ id: string; decision: 'approve' | 'reject' } | null>(null);

  useEffect(() => {
    api.getPendingActions()
      .then((data) => setActions(data))
      .catch(() => setError('Backend unreachable on :8000'))
      .finally(() => setLoading(false));
  }, []);

  async function act(id: string, decision: 'approve' | 'reject') {
    setActing(id);
    setError(null);
    try {
      if (decision === 'approve') await api.approveAction(id);
      else await api.rejectAction(id);

      setActions((prev) => prev.filter((a) => a.id !== id));
      setJustResolved({ id, decision });
      setTimeout(() => setJustResolved(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : `${decision} failed`);
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking for pending approvals…
      </div>
    );
  }

  if (error && actions.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 flex items-center gap-3">
        <Check className="h-5 w-5 text-emerald-600" />
        <div>
          <p className="font-medium">All caught up</p>
          <p className="text-emerald-700/80 text-xs mt-0.5">
            {justResolved
              ? `Last action ${justResolved.decision === 'approve' ? 'approved' : 'rejected'}: ${justResolved.id}`
              : 'No actions are awaiting your approval right now.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <h2 className="text-base font-semibold text-slate-900">
          Awaiting your approval
        </h2>
        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-semibold">
          {actions.length}
        </span>
        {justResolved && (
          <span className="ml-auto text-xs text-emerald-700">
            ✓ {justResolved.id} {justResolved.decision === 'approve' ? 'approved' : 'rejected'}
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-3">
        {actions.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-xl border-l-4 border-l-amber-500 border-y border-r border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    {prettifyType(a.type)}
                  </span>
                  {a.linkageId && (
                    <span className="font-mono text-slate-500">{a.linkageId}</span>
                  )}
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(a.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900 mt-2">{a.description}</p>
                {a.aiReasoning && (
                  <p className="text-xs text-slate-500 mt-2 italic border-l-2 border-slate-200 pl-3">
                    “{a.aiReasoning}”
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => act(a.id, 'approve')}
                  disabled={acting === a.id}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {acting === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Approve
                </button>
                <button
                  onClick={() => act(a.id, 'reject')}
                  disabled={acting === a.id}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <X className="h-3 w-3" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
