'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Share2, Sparkles, Layers, ChevronRight } from 'lucide-react';

const navItems = [
  { name: 'Activity Feed', href: '/', icon: Activity },
  { name: 'Ecosystem Graph', href: '/ecosystem', icon: Share2 },
  { name: 'Smart Matching', href: '/matching', icon: Sparkles },
  { name: 'Programmes', href: '/programmes', icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 w-[240px] bg-slate-900 border-r border-slate-800 flex flex-col z-30 shadow-2xl">
      <div className="flex h-20 shrink-0 items-center px-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-lg">L</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white uppercase">LinkMind</span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-8">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-6">Main Command</p>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-5 w-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} aria-hidden="true" />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-200" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4">
        <div className="bg-slate-800/40 rounded-[2rem] p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">AI Engine Online</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Next scan in <span className="text-slate-300">12m 45s</span>
          </p>
        </div>
      </div>
    </div>
  );
}
