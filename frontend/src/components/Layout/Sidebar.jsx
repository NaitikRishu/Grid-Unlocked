import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-full lg:w-96 border-r border-slate-800/80 bg-slate-950/40 backdrop-blur-md p-6 flex flex-col gap-6 overflow-y-auto h-[calc(100vh-73px)]">
      
      {/* SECTION 1: Event Selector Placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm hover:border-violet-500/30 transition-all duration-300">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Incident & Event Monitoring</h3>
        </div>
        <div className="border border-dashed border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-400 font-medium">Event Selector Loading...</p>
          <p className="text-[10px] text-slate-500 mt-1">Select an active incident from the list to begin routing simulation.</p>
        </div>
      </div>

      {/* SECTION 2: What-If Simulator Placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm hover:border-fuchsia-500/30 transition-all duration-300">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-200">What-If Dispatch Controls</h3>
        </div>
        <div className="border border-dashed border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-400 font-medium">Simulator Panel Loading...</p>
          <p className="text-[10px] text-slate-500 mt-1">Configure manpower, barricades, and diversions to run congestion predictions.</p>
        </div>
      </div>

      {/* SECTION 3: Resource Allocator & Analytics Placeholder */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm hover:border-pink-500/30 transition-all duration-300 flex-grow">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Mitigation & Performance</h3>
        </div>
        <div className="h-full border border-dashed border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-slate-400 font-medium">Analytics Dashboards Loading...</p>
          <p className="text-[10px] text-slate-500 mt-1">Simulated impact reduction and zone-wise police allocation tables will be populated here.</p>
        </div>
      </div>
      
    </aside>
  );
}
