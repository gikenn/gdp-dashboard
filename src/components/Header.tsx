import React from 'react';
import { Globe } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="mb-8" id="dashboard-header">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e7e0d3]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-300 flex items-center justify-center text-amber-800 shadow-xs">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
                World GDP Navigator
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 border border-amber-300/50">
                World Bank Edition
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Historical trajectories &amp; future growth prospects (1960 — 2028f)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-600 bg-white/80 border border-[#e7e0d3] px-3.5 py-1.5 rounded-full self-start sm:self-auto shadow-2xs">
          <span>Source:</span>
          <a
            href="https://data.worldbank.org/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-amber-800 font-semibold hover:underline"
          >
            World Bank Open Data
          </a>
          <span className="text-stone-300">•</span>
          <span>GEP June 2026</span>
        </div>
      </div>
    </header>
  );
};
