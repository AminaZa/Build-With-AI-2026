'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { api, Actor, Linkage, StatsHealth } from '@/services/api';
import { Share2, Info, Maximize2, RefreshCw, Search, Database, Heart, AlertTriangle, XCircle, Zap } from 'lucide-react';
import * as d3 from 'd3';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function EcosystemGraphPage() {
  const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<StatsHealth>({ healthy: 0, atRisk: 0, failing: 0 });
  const graphRef = useRef<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actors, linkages, healthStats] = await Promise.all([
          api.getActors(),
          api.getLinkages(),
          api.getStatsHealth()
        ]);

        const nodes = actors.map(actor => ({
          id: actor.id,
          name: actor.name,
          type: actor.type,
          color: actor.type === 'mentor' ? '#f59e0b' : 
                 actor.type === 'partner' ? '#ec4899' : '#3b82f6',
          val: actor.type === 'partner' ? 12 : 8 // Larger nodes
        }));

        const links = linkages.map(link => ({
          source: link.mentorId,
          target: link.startupId,
          color: link.healthScore > 70 ? 'rgba(16, 185, 129, 0.2)' : 
                 link.healthScore > 40 ? 'rgba(245, 158, 11, 0.2)' : 
                 'rgba(239, 68, 68, 0.2)',
          healthScore: link.healthScore
        }));

        setData({ nodes, links });
        setStats(healthStats);
      } catch (error) {
        console.error("Failed to load ecosystem data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update physics when graph loads
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge').strength(-150); // Increased repulsion
      graphRef.current.d3Force('center', d3.forceCenter()); // Add center force
    }
  }, [loading]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    
    // In force-graph, we should return all nodes but highlight them in the canvas object
    // or we can filter nodes and links. The user wants the search to "find" them.
    return data; 
  }, [data, searchQuery]);

  return (
    <div className="fixed inset-0 left-[240px] bg-slate-50 overflow-hidden animate-in fade-in duration-1000">
      {/* Header / Search */}
      <div className="absolute top-8 left-8 right-8 z-20 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <Share2 className="text-white w-6 h-6" />
            </div>
            Ecosystem Intelligence
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            Neural Network Map • v2.1
          </p>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search Actor (e.g. Dr. Aisha)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-semibold shadow-xl shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-80 transition-all"
            />
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white/80 backdrop-blur-xl border border-slate-200 p-3.5 rounded-2xl shadow-xl hover:text-indigo-600 transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Graph Area */}
      <div className="w-full h-full">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center z-50">
             <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-600/20 rounded-full" />
                  <div className="absolute inset-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-black text-slate-900 tracking-tight">Processing Hybrid Data</p>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing Physics Engine...</p>
                </div>
             </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            backgroundColor="#f8fafc"
            nodeRelSize={6}
            nodeLabel="name"
            linkCurvature={0.2}
            linkWidth={0.5} // Thinner links
            linkOpacity={0.3} // Neural transparency
            linkColor={(d: any) => d.color}
            linkDirectionalParticles={1}
            linkDirectionalParticleSpeed={0.005}
            cooldownTime={5000}
            nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              const isMatch = searchQuery && label.toLowerCase().includes(searchQuery.toLowerCase());
              
              // Glow Effect
              ctx.shadowColor = node.color;
              ctx.shadowBlur = isMatch ? 25 : 10;
              ctx.fillStyle = node.color;
              
              // Draw Circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, isMatch ? 10 : 6, 0, 2 * Math.PI, false);
              ctx.fill();
              
              // Reset Shadow
              ctx.shadowBlur = 0;
              
              // Draw Label
              ctx.font = `${isMatch ? '800' : '600'} ${fontSize}px "Inter", sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = isMatch ? '#6366f1' : '#64748b';
              ctx.fillText(label, node.x, node.y + 12);

              if (isMatch) {
                 ctx.strokeStyle = '#6366f1';
                 ctx.lineWidth = 3 / globalScale;
                 ctx.beginPath();
                 ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI);
                 ctx.stroke();
              }
            }}
          />
        )}
      </div>

      {/* Legend & Stats */}
      <div className="absolute bottom-8 left-8 z-20 space-y-4 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-6 rounded-[2rem] shadow-2xl shadow-slate-200 pointer-events-auto">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-5">Classification</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-amber-500 shadow-lg shadow-amber-200" />
              <span className="text-sm font-bold text-slate-700">Expert / Mentor</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-200" />
              <span className="text-sm font-bold text-slate-700">Startup Entity</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-pink-500 shadow-lg shadow-pink-200" />
              <span className="text-sm font-bold text-slate-700">Strategic Partner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Stats Panel */}
      <div className="absolute bottom-8 right-8 z-20 pointer-events-auto">
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 border border-slate-800 w-72">
          <div className="flex items-center gap-3 mb-8">
             <div className="p-2 bg-indigo-500 rounded-lg">
                <Zap className="w-4 h-4 text-white" />
             </div>
             <h3 className="font-bold text-lg tracking-tight">Ecosystem Stats</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-400">Total Nodes</span>
              </div>
              <span className="font-black text-xl">{data.nodes.length}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-slate-400">Healthy Links</span>
              </div>
              <span className="font-black text-xl text-emerald-400">{stats.healthy}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-400">At Risk</span>
              </div>
              <span className="font-black text-xl text-amber-400">{stats.atRisk}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-slate-400">Critical</span>
              </div>
              <span className="font-black text-xl text-red-400">{stats.failing}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
