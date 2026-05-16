'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export interface GraphNode {
  id: string;
  name: string;
  type: 'mentor' | 'startup' | 'partner';
  val?: number;
  color?: string;
  glow?: string;
  expertise?: string[];
  domain?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  health: number;
  status: string;
}

// Bubble palette — deliberately distinct from edge palette (emerald/amber/red)
// so node colour never gets confused with edge health.
const TYPE_COLOR: Record<string, string> = {
  mentor: '#a855f7',   // violet-500
  startup: '#0ea5e9',  // sky-500
  partner: '#ec4899',  // pink-500
};
const TYPE_GLOW: Record<string, string> = {
  mentor: '#c084fc',   // violet-400 (softer halo)
  startup: '#38bdf8',  // sky-400
  partner: '#f472b6',  // pink-400
};

function healthColor(h: number) {
  if (h >= 70) return '#10b981';
  if (h >= 40) return '#f59e0b';
  return '#ef4444';
}

interface Props {
  actors: { id: string; name: string; type: 'mentor' | 'startup' | 'partner'; expertise?: string[]; domain?: string }[];
  linkages: { mentorId: string; startupId: string; healthScore: number; status: string }[];
  selectedId?: string;
  onNodeClick?: (id: string) => void;
}

export default function EcosystemGraph({ actors, linkages, selectedId, onNodeClick }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<{ centerAt: (x: number, y: number, ms?: number) => void; zoom: (k: number, ms?: number) => void; zoomToFit: (ms?: number, padding?: number) => void } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 });

  const nodes: GraphNode[] = actors.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    val: a.type === 'mentor' ? 9 : a.type === 'startup' ? 6 : 5,
    color: TYPE_COLOR[a.type],
    glow: TYPE_GLOW[a.type],
    expertise: a.expertise,
    domain: a.domain,
  }));
  const links: GraphLink[] = linkages
    .filter((l) => l.status === 'active' || l.status === 'paused')
    .map((l) => ({ source: l.mentorId, target: l.startupId, health: l.healthScore, status: l.status }));

  useEffect(() => {
    function measure() {
      if (wrapperRef.current) {
        setSize({ w: wrapperRef.current.clientWidth, h: Math.max(560, wrapperRef.current.clientHeight) });
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!selectedId || !fgRef.current) return;
    function focusNow() {
      const node = nodes.find((n) => n.id === selectedId) as GraphNode | undefined;
      if (node && node.x != null && node.y != null && fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 800);
        fgRef.current.zoom(4, 800);
        return true;
      }
      return false;
    }
    if (!focusNow()) {
      const t = setTimeout(focusNow, 900);
      return () => clearTimeout(t);
    }
  }, [selectedId, nodes]);

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full overflow-hidden"
    >
      <button
        onClick={() => fgRef.current?.zoomToFit(600, 80)}
        className="absolute top-6 left-1/2 -translate-x-1/2 z-10 rounded-md bg-[#1A1D27]/90 backdrop-blur border border-[#2A2D3A] px-3 py-1.5 text-xs font-medium text-[#8B8D98] hover:bg-[#232733] shadow-md"
      >
        Fit to view
      </button>
      <ForceGraph2D
        // @ts-expect-error dynamic-import forwarded ref
        ref={fgRef}
        graphData={{ nodes, links }}
        width={size.w}
        height={size.h}
        backgroundColor="#0F1117"
        nodeLabel={(n: object) => {
          const node = n as GraphNode;
          return `${node.name} (${node.type})`;
        }}
        nodeRelSize={5}
        cooldownTicks={140}
        d3AlphaDecay={0.018}
        d3VelocityDecay={0.35}
        onNodeClick={(n: object) => onNodeClick?.((n as GraphNode).id)}

        // ---------- Edges: soft, semi-transparent, prettier ----------
        linkColor={() => 'rgba(0,0,0,0)'} // we draw edges in linkCanvasObject
        linkCanvasObjectMode={() => 'replace'}
        linkCanvasObject={(l: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const link = l as GraphLink;
          const start = link.source as GraphNode;
          const end = link.target as GraphNode;
          if (typeof start !== 'object' || typeof end !== 'object') return;
          if (start.x == null || end.x == null) return;

          const base = healthColor(link.health);
          const isFailing = link.health < 40;

          // Opacity scales mildly with health so the eye still reads "stronger = clearer"
          const alpha = isFailing ? 0.65 : link.health >= 70 ? 0.40 : 0.50;
          const aHex = Math.round(alpha * 255).toString(16).padStart(2, '0');

          ctx.save();
          ctx.lineCap = 'round';
          ctx.strokeStyle = `${base}${aHex}`;
          // thickness eases up at higher health, slightly thinner when very zoomed in
          const thickness = Math.max(0.8, link.health / 30);
          ctx.lineWidth = thickness / Math.max(0.5, globalScale * 0.8);

          // Subtle glow on failing/at-risk so they read at low zoom
          if (link.health < 70) {
            ctx.shadowColor = base;
            ctx.shadowBlur = isFailing ? 14 : 6;
          }

          ctx.beginPath();
          ctx.moveTo(start.x!, start.y!);
          ctx.lineTo(end.x!, end.y!);
          ctx.stroke();
          ctx.restore();
        }}
        linkDirectionalParticles={(l: object) => ((l as GraphLink).health < 40 ? 5 : 0)}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleColor={() => '#ef4444'}
        linkDirectionalParticleWidth={2.5}

        // ---------- Nodes: bubble with neon-ish soft halo, Google-Maps zoom tiers ----------
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(n: object, ctx: CanvasRenderingContext2D, scale: number) => {
          const node = n as GraphNode;
          if (node.x == null || node.y == null) return;
          const isSelected = node.id === selectedId;

          // Detail tier — Google Maps "continent / city / street / building"
          const tier =
            scale < 0.55 ? 'continent' :
            scale < 1.1 ? 'city' :
            scale < 2.3 ? 'street' : 'building';

          // Base radius — slight growth as you zoom in, like a pin getting larger
          const baseR = node.type === 'mentor' ? 7 : node.type === 'startup' ? 5 : 4;
          const r = baseR * (tier === 'continent' ? 0.75 : tier === 'city' ? 1 : tier === 'street' ? 1.15 : 1.3);

          // Subtle halo — just a touch of bloom, not full neon
          const haloR = r * (tier === 'continent' ? 1.5 : tier === 'city' ? 1.8 : 2.0);
          const halo = ctx.createRadialGradient(node.x, node.y, r * 0.6, node.x, node.y, haloR);
          const glow = node.glow ?? node.color ?? '#94a3b8';
          halo.addColorStop(0, glow + '55');   // ~33% alpha right around the bubble
          halo.addColorStop(0.6, glow + '1f'); // ~12% alpha mid
          halo.addColorStop(1, glow + '00');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(node.x, node.y, haloR, 0, 2 * Math.PI);
          ctx.fill();

          // Solid bubble — saturated colour
          ctx.fillStyle = node.color ?? '#64748b';
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fill();

          // Selection ring — light contour for visibility on the dark backdrop
          if (isSelected) {
            ctx.strokeStyle = '#E8E9ED';
            ctx.lineWidth = Math.max(1.2, 2.5 / scale);
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // ---- Label tiers (Google Maps style) ----
          // continent: only label the selected node
          // city:      label mentors only
          // street:    label everything
          // building:  label everything + small subtitle (expertise/domain)
          const showLabel =
            isSelected ||
            (tier === 'city' && node.type === 'mentor') ||
            tier === 'street' ||
            tier === 'building';

          if (showLabel) {
            const fontSize = (isSelected ? 13 : tier === 'building' ? 11 : 10) / scale;
            ctx.font = `${isSelected ? 'bold ' : '500 '}${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = '#E8E9ED';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(node.name, node.x, node.y + r + 4);

            if (tier === 'building') {
              const subtitle = node.expertise?.[0] ?? node.domain;
              if (subtitle) {
                ctx.fillStyle = '#8B8D98';
                ctx.font = `${9 / scale}px Inter, sans-serif`;
                ctx.fillText(subtitle, node.x, node.y + r + 4 + fontSize + 2);
              }
            }
          }
        }}
      />
    </div>
  );
}
