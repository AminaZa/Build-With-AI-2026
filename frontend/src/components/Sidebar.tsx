'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Share2, Sparkles, Layers, HeartPulse } from 'lucide-react';

const navItems = [
  { name: 'Activity Feed', href: '/', icon: Activity },
  { name: 'Health Dashboard', href: '/health', icon: HeartPulse },
  { name: 'Ecosystem', href: '/ecosystem', icon: Share2 },
  { name: 'Smart Matching', href: '/matching', icon: Sparkles },
  { name: 'Programmes', href: '/programmes', icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 w-[240px] bg-[#0B0D14] text-[#8B8D98] flex flex-col border-r border-[#1A1D27]">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-[#1A1D27]">
        <div className="flex items-center gap-2.5 font-semibold text-lg text-[#E8E9ED]">
          <Image
            src="/logo.png"
            alt="LinkMind"
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-full shadow-lg shadow-indigo-500/20"
          />
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
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#1A1D27] text-[#E8E9ED] shadow-sm'
                    : 'text-[#5F6170] hover:bg-[#1A1D27]/60 hover:text-[#8B8D98]'
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-400' : ''}`} aria-hidden="true" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
