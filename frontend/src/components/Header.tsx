'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Zap, ShieldAlert } from 'lucide-react';

export function Header() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await api.checkBackendHealth();
      setIsOffline(!isOnline);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 sm:gap-x-6 sm:px-8">
      <div className="flex-1 flex items-center">
        {isOffline && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 animate-pulse">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Running in Simulation Mode</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        <div className="hidden sm:flex sm:items-center sm:gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900">Sarah Abdullah</div>
            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Ecosystem Admin</div>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 shadow-sm overflow-hidden">
             <img src="https://ui-avatars.com/api/?name=Sarah+Abdullah&background=6366f1&color=fff" alt="Avatar" />
          </div>
        </div>
      </div>
    </header>
  );
}
