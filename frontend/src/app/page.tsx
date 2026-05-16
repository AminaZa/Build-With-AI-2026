import { api } from "@/services/api";
import { Activity, CheckCircle, Clock, Zap, ArrowRight, User, Building2 } from "lucide-react";

export default async function ActivityFeedPage() {
  const summary = await api.getStatsSummary();
  const actions = await api.getActions();

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out py-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Activity Feed</h1>
          <p className="mt-2 text-base text-slate-500">
            Monitor autonomous operations, system events, and match execution.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-200 active:scale-95">
          <Zap className="w-4 h-4" />
          Trigger AI Engine
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md hover:border-emerald-200 transition-all relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Auto-executed</p>
          </div>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">{summary.autoExecuted}</p>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
            <span className="bg-emerald-100 px-1.5 py-0.5 rounded-md mr-2">+12%</span>
            from last week
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Activity className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Informed</p>
          </div>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">{summary.informed}</p>
          <div className="mt-4 flex items-center text-xs text-blue-600 font-medium">
            <span className="bg-blue-100 px-1.5 py-0.5 rounded-md mr-2">+5%</span>
            system updates
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col shadow-sm hover:shadow-md hover:border-amber-200 transition-all relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Awaiting Approval</p>
          </div>
          <p className="text-4xl font-bold text-slate-900 tracking-tight">{summary.pendingApproval}</p>
          <div className="mt-4 flex items-center text-xs text-amber-600 font-medium">
            Action required
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 flex flex-col shadow-xl shadow-indigo-900/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">System Health</p>
              <h3 className="text-white text-2xl font-semibold">Optimal</h3>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-indigo-200 mb-1.5">
                <span>Network Integrity</span>
                <span>98%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-400 to-indigo-400 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Recent Activity Logs</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All Logs</button>
        </div>
        <div className="divide-y divide-slate-100">
          {actions.map((action) => (
            <div key={action.id} className="p-8 flex items-start gap-6 hover:bg-slate-50/30 transition-all group">
              <div className={`mt-1.5 h-3 w-3 rounded-full shrink-0 ${
                  action.tier === 'auto' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                  action.tier === 'inform' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]' :
                  'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                }`} 
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ring-1 ring-inset ${
                        action.tier === 'auto'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                          : action.tier === 'inform'
                          ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                          : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                      }`}
                    >
                      {action.tier ? action.tier.toUpperCase() : 'UNKNOWN'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium tracking-tight">
                      {action.timestamp ? new Date(action.timestamp).toLocaleString('en-MY', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      }) : 'Just now'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-slate-800">
                      {action.description}
                    </h4>
                    
                    {action.mentorName && action.startupName && (
                      <div className="flex items-center gap-3 py-2 px-4 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                          {action.mentorName}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {action.startupName}
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="shrink-0 flex items-center gap-2 text-slate-400 hover:text-indigo-600 px-4 py-2 rounded-xl border border-slate-200 hover:border-indigo-100 hover:bg-indigo-50 transition-all text-sm font-medium group/btn">
                    View Details
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>

                {action.aiReasoning && (
                  <div className="mt-5 text-sm text-slate-500 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-bold text-indigo-600 text-[10px] uppercase tracking-widest">AI Reasoning</span>
                    </div>
                    <p className="leading-relaxed italic">"{action.aiReasoning}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {actions.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
