import React from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';

function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Right Map/Simulation Canvas Area */}
        <main className="flex-1 relative bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-8">
          {/* Animated Tech Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b30_1px,transparent_1px),linear-gradient(to_bottom,#1e293b30_1px,transparent_1px)] bg-[size:30px_30px]" />
          
          <div className="absolute inset-0 bg-radial-[at_center_center] from-violet-500/5 via-transparent to-transparent pointer-events-none" />

          {/* Map Placeholder */}
          <div className="relative z-10 text-center max-w-md p-8 rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md shadow-2xl">
            {/* Pulsing Satellite Radar */}
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400/10 animate-ping opacity-75"></span>
              <span className="absolute inline-flex h-16 w-16 rounded-full bg-violet-500/10 animate-pulse"></span>
              <div className="relative w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-violet-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-100 mb-2">Interactive Map Canvas</h2>
            <p className="text-sm text-slate-400">
              The Bengaluru OpenStreetMap and BBMP Ward polygons will load here in Phase 2.
            </p>
            
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <span className="px-2.5 py-1 text-[10px] uppercase font-semibold tracking-wider rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                Leaflet.js Ready
              </span>
              <span className="px-2.5 py-1 text-[10px] uppercase font-semibold tracking-wider rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                Choropleth Heatmap Layer
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
