import { api } from "@/services/api";
import { Activity, CheckCircle, Clock } from "lucide-react";

export default async function ActivityFeedPage() {
  // We can fetch initial mock data from our service layer here
  const actions = await api.getActions();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Activity Feed</h1>
        <p className="mt-2 text-sm text-slate-500">
          Monitor recent platform actions, system events, and match operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Auto-executed</p>
            <p className="text-3xl font-semibold text-slate-900 mt-1">47</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Informed</p>
            <p className="text-3xl font-semibold text-slate-900 mt-1">12</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Awaiting Approval</p>
            <p className="text-3xl font-semibold text-slate-900 mt-1">3</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-base font-medium text-slate-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {actions.map((action) => (
            <div key={action.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      action.type === 'Auto-executed'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        : action.type === 'Informed'
                        ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                        : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                    }`}
                  >
                    {action.type}
                  </span>
                  <span className="text-sm text-slate-500">
                    {new Date(action.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900">{action.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
