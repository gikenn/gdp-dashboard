import React from 'react';
import { ScanlineWaves } from './ScanlineWaves';
import { ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-14" id="dashboard-footer">
      <div className="relative overflow-hidden rounded-2xl border-[12px] border-[#e63946] cp-horizon-backdrop shadow-sm min-h-[290px] flex flex-col justify-between">
        {/* Stipple grain overlay */}
        <div className="absolute inset-0 z-10 cp-grain-overlay" aria-hidden="true" />

        {/* Full 4-layer stepped scanline ocean waves */}
        <ScanlineWaves variant="footer" className="absolute inset-x-0 bottom-0 h-[210px] z-[5]" />

        {/* Top sky overlay: clean editorial title over honeydew/frosted horizon */}
        <div className="relative z-20 px-6 sm:px-10 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="bg-[#f1faee]/85 backdrop-blur-[2px] px-4 py-2.5 rounded-xl inline-block max-w-xl">
            <p className="font-display text-lg sm:text-xl font-bold text-[#1d3557] tracking-tight">
              World GDP Navigator
            </p>
            <p className="text-xs text-[#31587a] mt-0.5">
              Historical output (1960–2022) paired with World Bank Global Economic Prospects (June 2026, Table 1.1).
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1d3557] text-[#f1faee] hover:bg-[#e63946] text-xs font-bold transition-colors whitespace-nowrap shrink-0 self-start sm:self-center shadow-xs cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            Back to Top
          </button>
        </div>

        {/* Bottom deep-water bar anchored over oxford-navy wave crest */}
        <div className="relative z-20 mt-auto bg-[#1d3557]/90 border-t border-[#457b9d]/50 px-6 sm:px-10 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#f1faee]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>World Bank Open Data</span>
            <span aria-hidden="true" className="text-[#a8dadc]">·</span>
            <span>Real GDP Forecasts 2023–2028f</span>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-5 font-medium">
            <a
              href="#world-summary-hero"
              className="text-[#a8dadc] hover:text-[#f1faee] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Interactive Globe
            </a>
            <a
              href="#gdp-chart-section"
              className="text-[#a8dadc] hover:text-[#f1faee] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              GDP Comparison
            </a>
            <a
              href="#world-bank-outlook-section"
              className="text-[#a8dadc] hover:text-[#f1faee] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              World Bank Projections
            </a>
            <a
              href="https://data.worldbank.org/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[#f1faee] hover:text-[#a8dadc] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Source Portal
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};
