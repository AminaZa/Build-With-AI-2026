'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Share2, Sparkles, Layers } from 'lucide-react';

const navItems = [
  { name: 'Activity Feed', href: '/', icon: Activity },
  { name: 'Ecosystem Graph', href: '/ecosystem', icon: Share2 },
  { name: 'Smart Matching', href: '/matching', icon: Sparkles },
  { name: 'Programmes', href: '/programmes', icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 w-[240px] bg-slate-900 text-slate-300 flex flex-col">
      <div className="flex h-16 shrink-0 items-center px-6">
        <div className="flex items-center gap-2 font-semibold text-lg text-white">
          <div className="h-8 w-8 rounded-md bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold leading-none">LM</span>
          </div>
          LinkMind
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
