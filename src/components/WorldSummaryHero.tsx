import React from 'react';
import { WorldGdpOverview } from '../types';
import { Globe2, Crown, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import { GlassBox } from './GlassBox';
import { CountryFlag } from './CountryFlag';

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
  const topFive = overview.topHolders2022.slice(0, 5);

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
        <GlassBox className="flex-1" contentClassName="p-5 justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#a8dadc]">
                <Globe2 className="w-3.5 h-3.5" />
                World Total GDP
              </span>
              <span className="text-xs font-mono text-slate-300">2022 Record</span>
            </div>

            <div className="font-display text-3xl font-extrabold text-white tracking-tight font-mono my-2">
              ${(overview.worldTotal2022 / 1e12).toFixed(1)}T
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              Global economic output has expanded over{' '}
              <strong className="text-white font-semibold font-mono">
                {overview.worldGrowthMultiplier.toFixed(0)}x
              </strong>{' '}
              since 1960 ($1.38 Trillion).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
            <span>World Bank Proj. (2026–28):</span>
            <span className="font-bold text-amber-300 font-mono">
              +2.8% — 2.9%/yr
            </span>
          </div>
        </GlassBox>

        {/* World Bank Potential Highlights */}
        <GlassBox className="flex-1" contentClassName="p-5 justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 tracking-wide mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              World Bank Growth Potential
            </div>
            <p className="text-xs text-slate-200 leading-relaxed mb-3">
              Per the <em>June 2026 Global Economic Prospects</em> report, EMDEs are projected to deliver 60%+ of global output growth:
            </p>

            <div className="space-y-2">
              {highPotentialEconomies.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onSelectCountry(item.code)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left cursor-pointer border ${
                    selectedCountryCode === item.code
                      ? 'bg-[#e63946]/80 border-white/40 text-white font-medium shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-white/35'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <CountryFlag code={item.code} size="sm" />
                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/30 text-[#a8dadc]">
                      {item.code}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-bold text-amber-300 text-[11px]">
                      {item.forecast2025}
                    </span>
                    <span className="text-[10px] text-slate-300 hidden sm:inline">{item.tag}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 text-[10px] text-slate-300 italic">
            Click any economy to locate on globe and review breakdown
          </div>
        </GlassBox>
      </div>

      {/* Center Column: Animated Globe (The Visual Centerpiece) */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
        <GlassBox
          rounded
          disableLensFilter
          className="w-full"
          contentClassName="p-4 sm:p-6 items-center relative"
        >
          <div className="text-center mb-1">
            <p className="text-xs font-semibold tracking-wide text-[#a8dadc]">
              Interactive Global GDP Navigator
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-1 text-balance">
              Earth&apos;s Economic Landscape
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-md mx-auto">
              Explore national economies by clicking nations or capital cities on the spinning globe.
            </p>
          </div>

          <div className="w-full flex justify-center">
            {children}
          </div>
        </GlassBox>
      </div>

      {/* Right Column: Top GDP Holders */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-4 order-3">
        <GlassBox className="flex-1" contentClassName="p-5 justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <Crown className="w-3.5 h-3.5" />
                Top GDP Holders (2022)
              </span>
              <span className="text-xs text-slate-300">Ranked</span>
            </div>

            <p className="text-xs text-slate-200 mb-3">
              The 5 largest economies represent over <strong className="text-white">54%</strong> of global GDP:
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
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#e63946]/70 border-white/45 shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 border-white/15 hover:border-white/35'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-slate-300 font-mono w-4">
                        #{idx + 1}
                      </span>
                      <CountryFlag code={holder.countryCode} size="md" />
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">
                          {holder.countryName}
                        </div>
                        <div className="text-[10px] text-slate-300 font-mono">
                          {holder.shareOfWorld.toFixed(1)}% of world
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold font-mono text-white">
                        {gdpFormatted}
                      </div>
                      <div className="text-[10px] text-emerald-300 font-semibold flex items-center justify-end">
                        <ArrowUpRight className="w-3 h-3" />
                        View
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 text-xs text-slate-300 flex items-center justify-between">
            <span>Combined Top 5 Output:</span>
            <span className="font-bold text-white font-mono">$55.1 Trillion</span>
          </div>
        </GlassBox>

        {/* Global Outlook Quick Note */}
        <GlassBox contentClassName="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#a8dadc] mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Macroeconomic Outlook
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed">
            World GDP is expected to maintain ~2.8% real growth through 2028, with Advanced Economies expanding at ~1.7–1.8% and EMDEs maintaining ~4.1–4.2%.
          </p>
        </GlassBox>
      </div>
    </div>
  );
};
