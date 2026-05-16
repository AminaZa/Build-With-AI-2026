'use client';

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Layers, Rocket, ChevronRight, Activity, Sparkles, BrainCircuit, ShieldCheck, Zap } from "lucide-react";

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    api.getProgrammes().then(data => {
      setProgrammes(data);
      setLoading(false);
    }).catch(() => {
       // Fallback mock data with Malaysian names
       setProgrammes([
         { id: 'prog_2024_A', name: 'Cyberjaya Alpha Cohort', status: 'active', startDate: '2024-01-15' },
         { id: 'prog_2024_B', name: 'Penang Tech Bridge', status: 'planning', startDate: '2024-06-20' }
       ]);
       setLoading(false);
    });
  }, []);

  const handleLaunch = async (id: string) => {
    setLaunchingId(id);
    try {
      // Simulate backend intelligence launch
      setTimeout(() => {
        setInsights({
          aiInsights: {
            recommendation: "Historical data suggests Dr. Aisha Rahman's matching pattern in Cyberjaya Alpha yielded 92% retention. Replicating for new cohort."
          },
          efficiency: 0.85
        });
        setLaunchingId(null);
      }, 1500);
    } catch (e) {
      console.error(e);
      setLaunchingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Programmes</h1>
          <p className="mt-2 text-base text-slate-500">
            Manage cohorts and initialize cross-programme intelligence scaling.
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl flex items-center gap-3">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Global Sync Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="p-20 text-center text-slate-500 bg-white rounded-[2rem] border border-slate-200 border-dashed">
              <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-medium">Aggregating Cohort Data...</p>
            </div>
          ) : programmes.length > 0 ? (
            programmes.map(prog => (
              <div key={prog.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Layers className="w-24 h-24 text-indigo-600" />
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      <Layers className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-slate-900">{prog.name}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${prog.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {prog.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">Cohort ID: {prog.id} • Start Date: {prog.startDate}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleLaunch(prog.id)}
                    disabled={launchingId === prog.id}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {launchingId === prog.id ? 'Launching...' : 'Initialize Scaling'}
                    <Rocket className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
             <div className="p-20 text-center text-slate-500 bg-white rounded-[2rem] border border-slate-200">
              No programmes available.
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Intelligence Insights</h3>
            </div>
            
            {insights ? (
              <div className="space-y-6 flex-1 animate-in zoom-in-95 duration-500">
                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-12 h-12 text-indigo-600" />
                  </div>
                  <p className="text-[10px] font-black text-indigo-600 mb-3 uppercase tracking-[0.2em]">Cross-Programme Analysis</p>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{insights.aiInsights?.recommendation}"</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-600">Scaling Factor: 85% Efficiency</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-slate-600">Expertise Replication: High</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-8 border-2 border-dashed border-slate-100 rounded-[2rem]">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                  <Rocket className="w-10 h-10 opacity-20" />
                </div>
                <p className="text-sm font-semibold text-slate-400 leading-relaxed px-4">Launch a programme to generate cross-programme intelligence and insights.</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200">
             <ShieldCheck className="w-10 h-10 text-indigo-200 mb-6" />
             <h4 className="text-lg font-bold mb-2">Governance Protocol</h4>
             <p className="text-sm text-indigo-100 leading-relaxed opacity-80">All cross-programme data is anonymized and encrypted following the LM-2024 security standard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
