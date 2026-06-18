import React from 'react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Animated Grid Logo */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:6px_6px]" />
          <svg className="w-6 h-6 text-white relative z-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.485V10.5a2 2 0 011.553-1.942L9 7m0 13l6-3m-6 3V11m6-4l5.447 2.724A2 2 0 0121 11.66v4.98a2 2 0 01-1.553 1.942L15 20m0-13C15 5.343 12.314 4 9 4S3 5.343 3 7m12 0c0 1.657-2.686 3-6 3S3 8.657 3 7m16 4.66c0 1.657-2.686 3-6 3S3 13.317 3 11.66" />
          </svg>
        </div>
        
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 m-0">
            Gridlock AI
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold m-0">
            Bengaluru Traffic Optimization Command
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium">OSM Network Live</span>
        </div>

        {/* System Time Counter */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono text-slate-300">GMT+5:30</span>
        </div>
      </div>
    </header>
  );
}
