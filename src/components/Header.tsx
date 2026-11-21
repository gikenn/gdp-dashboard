import React from 'react';
import { ScanlineWaves } from './ScanlineWaves';

interface HeaderProps {
  onResetView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetView }) => {
  return (
    <header className="mb-8" id="dashboard-header">
      <div className="relative overflow-hidden rounded-2xl border-[10px] border-[#e63946] cp-header-backdrop shadow-sm">
        {/* Stipple grain texture from CodePen */}
        <div className="absolute inset-0 z-10 cp-grain-overlay" aria-hidden="true" />

        {/* Stepped scanline ocean horizon at bottom of header */}
        <ScanlineWaves variant="header" className="absolute inset-x-0 bottom-0 h-16 sm:h-20 z-[5]" />

        {/* Top Bar Contract: [Brand title, one line] — [4 nav links] — [1 primary action] */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 sm:gap-8 px-5 sm:px-8 pt-5 pb-14 sm:pb-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#app-root"
            className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#1d3557] whitespace-nowrap shrink-0 bg-[#f1faee]/85 px-3 py-1 rounded-lg backdrop-blur-[2px]"
          >
            World GDP Navigator
          </a>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#1d3557] bg-[#f1faee]/80 px-4 py-1.5 rounded-lg backdrop-blur-[2px]"
          >
            <a
              href="#world-summary-hero"
              className="hover:text-[#e63946] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Globe
            </a>
            <a
              href="#filters-container"
              className="hover:text-[#e63946] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Filters
            </a>
            <a
              href="#gdp-chart-section"
              className="hover:text-[#e63946] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Chart
            </a>
            <a
              href="#world-bank-outlook-section"
              className="hover:text-[#e63946] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Projections
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {onResetView ? (
              <button
                type="button"
                onClick={onResetView}
                className="px-4 py-2 text-xs font-bold tracking-wide text-[#f1faee] bg-[#1d3557] hover:bg-[#e63946] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
              >
                Reset View
              </button>
            ) : (
              <a
                href="https://data.worldbank.org/"
                target="_blank"
                rel="noreferrer noopener"
                className="px-4 py-2 text-xs font-bold tracking-wide text-[#f1faee] bg-[#1d3557] hover:bg-[#e63946] rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                World Bank Data
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
