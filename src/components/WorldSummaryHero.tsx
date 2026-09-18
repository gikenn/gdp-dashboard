import React from 'react';
import { WorldGdpOverview } from '../types';
import { Sparkles, Globe2, Crown, ArrowUpRight, TrendingUp } from 'lucide-react';
import { WORLD_BANK_FORECASTS } from '../data/worldBankForecasts';

interface WorldSummaryHeroProps {
  overview: WorldGdpOverview;
  onSelectCountry: (countryCode: string) => void;
  selectedCountryCode: string | null;
  children?: React.ReactNode;
}

export const WorldSummaryHero: React.FC<WorldSummaryHeroProps> = ({
  overview,
  onSelectCountry,
  selectedCountryCode,
  children,
}) => {
  // Top 5 countries
  const topFive = overview.topHolders2022.slice(0, 5);

  // Notable high-potential economies from World Bank June 2026 report
  const highPotentialEconomies = [
    { code: 'ETH', name: 'Ethiopia', forecast2025: '9.2%', forecast2026: '8.0%', tag: 'Global Leader' },
    { code: 'IND', name: 'India', forecast2025: '7.7%', forecast2026: '6.6%', tag: 'Major Engine' },
    { code: 'IDN', name: 'Indonesia', forecast2025: '5.1%', forecast2026: '5.0%', tag: 'ASEAN Anchor' },
    { code: 'BGD', name: 'Bangladesh', forecast2025: '3.5%', forecast2026: '3.8%', tag: 'Rising Export' },
    { code: 'SAU', name: 'Saudi Arabia', forecast2025: '4.5%', forecast2026: '3.1%', tag: 'Vision 2030' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-10" id="world-summary-hero">
      {/* Left Column: World Total & Potential Highlights */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-4 order-2 lg:order-1">
        {/* World Total GDP Card */}
        <div className="bg-white/90 backdrop-blur-xs border border-[#e7e0d3] rounded-2xl p-5 shadow-xs hover:border-amber-300 transition-colors flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full">
                <Globe2 className="w-3.5 h-3.5" />
                World Total GDP
              </span>
              <span className="text-xs font-mono text-stone-500">2022 Record</span>
            </div>

            <div className="text-3xl font-extrabold text-stone-900 tracking-tight font-mono my-2">
              ${(overview.worldTotal2022 / 1e12).toFixed(1)}T
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Global economic output has expanded over{' '}
              <strong className="text-stone-900 font-semibold font-mono">
                {overview.worldGrowthMultiplier.toFixed(0)}x
              </strong>{' '}
              since 1960 ($1.38 Trillion).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f0ebe1] flex items-center justify-between text-xs text-stone-500">
            <span>World Bank Proj. (2026–28):</span>
            <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded font-mono">
              +2.8% — 2.9%/yr
            </span>
          </div>
        </div>

        {/* World Bank Potential Highlights */}
        <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/70 border border-amber-200/80 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              World Bank Growth Potential
            </div>
            <p className="text-xs text-stone-700 leading-relaxed mb-3">
              Per the <em>June 2026 Global Economic Prospects</em> report, EMDEs are projected to deliver 60%+ of global output growth:
            </p>

            <div className="space-y-2">
              {highPotentialEconomies.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onSelectCountry(item.code)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all text-left ${
                    selectedCountryCode === item.code
                      ? 'bg-amber-600 text-white font-medium shadow-xs'
                      : 'bg-white/80 hover:bg-white text-stone-800 border border-amber-100 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono font-bold text-[11px] px-1 py-0.5 rounded bg-stone-100/80 text-stone-700">
                      {item.code}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded text-[11px]">
                      {item.forecast2025}
                    </span>
                    <span className="text-[10px] text-stone-500 hidden sm:inline">{item.tag}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 text-[10px] text-stone-500 italic">
            Click any economy to locate on globe and review breakdown
          </div>
        </div>
      </div>

      {/* Center Column: Animated Globe (The Visual Centerpiece) */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
        <div className="w-full bg-white/70 backdrop-blur-xs border border-[#e7e0d3] rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col items-center relative">
          <div className="text-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/60 px-3 py-1 rounded-full">
              Interactive Global GDP Navigator
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-2">
              Earth&apos;s Economic Landscape
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md">
              Explore national economies by clicking their capital cities on the animated globe.
            </p>
          </div>

          {/* Children / Animated Globe injected here from App */}
          <div className="w-full flex justify-center">
            {children}
          </div>
        </div>
      </div>

      {/* Right Column: Top GDP Holders */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-4 order-3">
        <div className="bg-white/90 backdrop-blur-xs border border-[#e7e0d3] rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-full">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Top GDP Holders (2022)
              </span>
              <span className="text-xs text-stone-400">Ranked</span>
            </div>

            <p className="text-xs text-stone-600 mb-3">
              The 5 largest economies represent over <strong>54%</strong> of global GDP:
            </p>

            <div className="space-y-2.5">
              {topFive.map((holder, idx) => {
                const isSelected = selectedCountryCode === holder.countryCode;
                const gdpFormatted =
                  holder.gdp2022 >= 1e12
                    ? `$${(holder.gdp2022 / 1e12).toFixed(2)}T`
                    : `$${(holder.gdp2022 / 1e9).toFixed(0)}B`;

                return (
                  <button
                    key={holder.countryCode}
                    type="button"
                    onClick={() => onSelectCountry(holder.countryCode)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 shadow-xs'
                        : 'bg-[#faf7f2]/60 hover:bg-[#faf7f2] border-[#e7e0d3] hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-stone-500 font-mono w-4">
                        #{idx + 1}
                      </span>
                      <span className="text-base">{holder.flag || '🏳️'}</span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {holder.countryName}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {holder.shareOfWorld.toFixed(1)}% of world
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-stone-900">
                        {gdpFormatted}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end">
                        <ArrowUpRight className="w-3 h-3" />
                        View
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f0ebe1] text-xs text-stone-500 flex items-center justify-between">
            <span>Combined Top 5 Output:</span>
            <span className="font-bold text-stone-900 font-mono">$55.1 Trillion</span>
          </div>
        </div>

        {/* Global Outlook Quick Note */}
        <div className="bg-white/80 border border-[#e7e0d3] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
            Macroeconomic Outlook
          </div>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            World GDP is expected to maintain ~2.8% real growth through 2028, with Advanced Economies expanding at ~1.7–1.8% and EMDEs maintaining ~4.1–4.2%.
          </p>
        </div>
      </div>
    </div>
  );
};
