'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { api, Actor, Linkage } from '@/services/api';
import { Share2, Info, Maximize2, RefreshCw } from 'lucide-react';

// Dynamic import for force graph to prevent SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function EcosystemGraphPage() {
  const [data, setData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const graphRef = useRef<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actors, linkages] = await Promise.all([
          api.getActors(),
          api.getLinkages()
        ]);

        const nodes = actors.map(actor => ({
          id: actor.id,
          name: actor.name,
          val: actor.type === 'mentor' ? 15 : 10,
          color: actor.type === 'mentor' ? '#f59e0b' : '#3b82f6', // Amber for Mentor, Blue for Startup
          type: actor.type
        }));

        const links = linkages.map(link => ({
          source: link.mentorId,
          target: link.startupId,
          color: link.healthScore > 70 ? '#10b981' : link.healthScore > 40 ? '#f59e0b' : '#ef4444',
          healthScore: link.healthScore
        }));

        setData({ nodes, links });
      } catch (error) {
        console.error("Failed to load ecosystem data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 flex items-center gap-3">
            <Share2 className="text-indigo-600" />
            Ecosystem Graph
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Visualizing active linkages and relationship health across the network.
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => window.location.reload()}
             className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all shadow-sm"
           >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden h-[600px] group">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
             <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500 italic">Initializing Neural Map...</p>
             </div>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={data}
            nodeLabel="name"
            linkLabel={(d: any) => `Health Score: ${d.healthScore}%`}
            nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Inter, sans-serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              ctx.fillStyle = node.color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
              ctx.fill();

              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + 7, bckgDimensions[0], bckgDimensions[1]);

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#1e293b';
              ctx.fillText(label, node.x, node.y + 7 + bckgDimensions[1] / 2);
            }}
            linkWidth={2}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={(d: any) => d.healthScore * 0.001}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-lg z-10 pointer-events-none">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Network Legend</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-medium text-slate-700">Mentor / Expert</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-slate-700">Startup</span>
            </div>
            <hr className="border-slate-100 my-2" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-500 tracking-tight">Healthy Relationship</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 rounded-full bg-amber-500" />
              <span className="text-xs font-semibold text-slate-500 tracking-tight">At-Risk</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-1 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-slate-500 tracking-tight">Failing / Critical</span>
            </div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 z-10">
          <button className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
             <Maximize2 className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-slate-400 hover:text-indigo-600 transition-colors">
             <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
