'use client';

import { useState } from 'react';
import { api } from '@/services/api';
import { Sparkles, Loader2, CheckCircle2, Zap, BrainCircuit, Target, ShieldCheck, User, Building2, ArrowRight } from 'lucide-react';

export default function MatchingPage() {
  const [loading, setLoading] = useState(false);
  const [matchingPlan, setMatchingPlan] = useState<any>(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      // Mock data for generation input
      const mentors = await api.getActors('mentor');
      const startups = await api.getActors('startup');
      const goals = { focus: 'scaling', region: 'ASEAN' };
      
      const plan = await api.generateMatching(mentors, startups, goals);
      setMatchingPlan(plan);
    } catch (error) {
      console.error("Failed to generate plan", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 rounded-[2.5rem] p-12 relative overflow-hidden shadow-2xl shadow-indigo-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900 to-slate-900" />
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <BrainCircuit className="w-64 h-64 text-indigo-400" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Optimization
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-6">
            Smart Matching Engine
          </h1>
          <p className="text-lg text-indigo-100/70 leading-relaxed mb-10">
            Our AI analyzes expertise, industry focus, and historical success patterns to create the perfect mentor-startup pairings for your programme.
          </p>
          
          <button 
            onClick={handleGeneratePlan}
            disabled={loading}
            className="group relative flex items-center gap-3 bg-white hover:bg-indigo-50 text-slate-900 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600 group-hover:scale-110 transition-transform" />
            )}
            {loading ? 'Analyzing Ecosystem...' : 'Generate AI Match Plan'}
          </button>
        </div>
      </div>

      {!matchingPlan && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Precision Analysis</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Cross-references 15+ data points including sector expertise and time-zone availability.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Success Bias</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Prioritizes pairings similar to past "High-Health" relationships in our database.</p>
          </div>
          <div className="p-8 bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Neural Scoring</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Each match receives a confidence score powered by Gemini 1.5 Pro intelligence.</p>
          </div>
        </div>
      )}

      {matchingPlan && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Proposed Neural Pairings</h2>
            <button className="text-sm font-bold text-indigo-600 bg-indigo-50 px-5 py-2 rounded-xl border border-indigo-100">
              Export Analysis
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {matchingPlan.pairings.map((pair: any, idx: number) => (
              <div key={idx} className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col group">
                <div className="p-10 flex-1">
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`p-4 rounded-2xl border-2 transition-all group-hover:scale-105 ${pair.confidence > 0.9 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                          <User className="w-7 h-7" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                        </div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-slate-300" />
                      <div className={`p-4 rounded-2xl border-2 transition-all group-hover:scale-105 ${pair.confidence > 0.9 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                        <Building2 className="w-7 h-7" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence</span>
                      <span className={`text-2xl font-black ${pair.confidence > 0.9 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                        {(pair.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">AI Matching Logic</h4>
                      <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
                        "{pair.reasoning}"
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">Match ID: #MATCH-{idx + 101}</span>
                  <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all">
                    Finalize Pairing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
