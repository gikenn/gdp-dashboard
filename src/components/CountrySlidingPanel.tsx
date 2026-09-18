import React from 'react';
import { CountryRundown } from '../types';
import { X, TrendingUp, Award, Globe, Plus, Check, ExternalLink, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface CountrySlidingPanelProps {
  rundown: CountryRundown | null;
  isOpen: boolean;
  onClose: () => void;
  isCountryInComparison: boolean;
  onToggleComparison: (countryCode: string) => void;
  fromYear: number;
  toYear: number;
}

function formatCurrency(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return 'n/a';
  if (val >= 1e12) {
    return `$${(val / 1e12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Trillion`;
  }
  if (val >= 1e9) {
    return `$${(val / 1e9).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Billion`;
  }
  if (val >= 1e6) {
    return `$${(val / 1e6).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Million`;
  }
  return `$${val.toLocaleString('en-US')}`;
}

export const CountrySlidingPanel: React.FC<CountrySlidingPanelProps> = ({
  rundown,
  isOpen,
  onClose,
  isCountryInComparison,
  onToggleComparison,
  fromYear,
  toYear,
}) => {
  if (!isOpen || !rundown) return null;

  const { country, meta, latestGdp, rank2022, shareOfWorld2022, startYearGdp, peakGdp, growthMultiple, cagr, forecast } = rundown;

  // Prepare mini history chart points
  const historyData: Array<{ year: number; gdpBillions: number | null }> = [];
  for (let yr = 1960; yr <= 2022; yr++) {
    const v = country.gdpByYear[yr];
    historyData.push({
      year: yr,
      gdpBillions: v != null ? Math.round(v / 1e9) : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="country-sliding-panel-root">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#faf7f2] border-l border-[#e7e0d3] shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-[#e7e0d3] bg-[#f5ede1]/80 sticky top-0 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl filter drop-shadow-sm">
                  {meta?.flag || '🏳️'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
                      {country.countryName}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-stone-200/80 text-stone-700">
                      {country.countryCode}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 flex items-center gap-2 mt-0.5">
                    <span>Capital: <strong className="text-stone-800 font-semibold">{meta?.capital || 'N/A'}</strong></span>
                    {meta?.continent && (
                      <>
                        <span className="text-stone-400">•</span>
                        <span>{meta.continent}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition-colors"
                title="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 flex-1">
            {/* Top Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-xl border border-[#e7e0d3] shadow-xs">
                <div className="text-xs text-stone-500 font-medium flex items-center gap-1 mb-1">
                  <Globe className="w-3.5 h-3.5 text-amber-700" />
                  Latest GDP (2022)
                </div>
                <div className="text-xl font-bold text-stone-900 font-mono">
                  {formatCurrency(latestGdp)}
                </div>
                <div className="text-xs text-stone-600 mt-1">
                  {shareOfWorld2022 > 0
                    ? `${shareOfWorld2022.toFixed(2)}% of world total`
                    : 'Global record'}
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-[#e7e0d3] shadow-xs">
                <div className="text-xs text-stone-500 font-medium flex items-center gap-1 mb-1">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  Global Rank
                </div>
                <div className="text-xl font-bold text-stone-900">
                  {rank2022 <= 190 ? `#${rank2022} in World` : 'Ranked economy'}
                </div>
                <div className="text-xs text-stone-600 mt-1">
                  {peakGdp ? `Peak: ${peakGdp.year} (${formatCurrency(peakGdp.value)})` : 'Sustained'}
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-[#e7e0d3] shadow-xs">
                <div className="text-xs text-stone-500 font-medium flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  Total Growth ({fromYear}–{toYear})
                </div>
                <div className="text-xl font-bold text-emerald-700 font-mono">
                  {growthMultiple ? `${growthMultiple.toFixed(2)}x` : 'N/A'}
                </div>
                <div className="text-xs text-stone-600 mt-1">
                  {cagr ? `CAGR: ${cagr.toFixed(2)}%/year` : 'Baseline period'}
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-[#e7e0d3] shadow-xs">
                <div className="text-xs text-stone-500 font-medium flex items-center gap-1 mb-1">
                  <span>🏛️</span>
                  Base GDP ({fromYear})
                </div>
                <div className="text-xl font-bold text-stone-900 font-mono">
                  {formatCurrency(startYearGdp)}
                </div>
                <div className="text-xs text-stone-600 mt-1">
                  Historical starting marker
                </div>
              </div>
            </div>

            {/* Historical Trajectory Sparkline */}
            <div className="p-4 bg-white rounded-xl border border-[#e7e0d3] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-800 tracking-tight">
                  Long-term Trajectory (1960 — 2022)
                </h3>
                <span className="text-xs text-stone-500">in Billions USD</span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="panelAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="year"
                      stroke="#a8a29e"
                      fontSize={11}
                      tickLine={false}
                      ticks={[1960, 1980, 2000, 2022]}
                    />
                    <YAxis
                      stroke="#a8a29e"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}T` : `${v}B`)}
                      width={40}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const v = payload[0].value as number | null;
                        return (
                          <div className="bg-stone-900 text-white text-xs px-2.5 py-1.5 rounded shadow-lg border border-stone-700 font-mono">
                            <span className="text-amber-300 font-bold">{label}: </span>
                            <span>{v != null ? `$${v.toLocaleString()}B` : 'No data'}</span>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gdpBillions"
                      stroke="#ea580c"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#panelAreaGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* World Bank Estimates & Growth Potential Section */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-xl border border-amber-200/80 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-amber-950 tracking-tight">
                  World Bank Forecast & Potential (June 2026)
                </h3>
              </div>

              {forecast ? (
                <div className="space-y-3">
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {forecast.potentialNote ||
                      'Projected real GDP growth based on the World Bank Global Economic Prospects report.'}
                  </p>

                  <div className="overflow-x-auto rounded-lg border border-amber-200/70 bg-white/90">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-amber-100/60 text-stone-700 font-semibold border-b border-amber-200/70">
                        <tr>
                          <th className="px-2.5 py-1.5">2023</th>
                          <th className="px-2.5 py-1.5">2024</th>
                          <th className="px-2.5 py-1.5">2025e</th>
                          <th className="px-2.5 py-1.5">2026f</th>
                          <th className="px-2.5 py-1.5">2027f</th>
                          <th className="px-2.5 py-1.5">2028f</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 font-mono text-stone-800">
                        <tr>
                          <td className="px-2.5 py-1.5">{forecast.y2023.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5">{forecast.y2024.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5 font-semibold text-amber-900">{forecast.y2025e.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5 font-bold text-orange-700">{forecast.y2026f.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5 font-semibold text-stone-900">{forecast.y2027f.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5 font-semibold text-stone-900">{forecast.y2028f.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[11px] text-stone-500 italic">
                    Source: World Bank Global Economic Prospects Table 1.1 Real GDP (June 2026)
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-600 leading-relaxed">
                  Individual direct forecast line for {country.countryName} is consolidated within its regional aggregate in Table 1.1 of the World Bank Global Economic Prospects report.
                </p>
              )}
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-6 border-t border-[#e7e0d3] bg-[#f5ede1]/80 sticky bottom-0">
            <button
              type="button"
              onClick={() => onToggleComparison(country.countryCode)}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                isCountryInComparison
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200/80 border border-amber-300'
                  : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99]'
              }`}
            >
              {isCountryInComparison ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  In Comparison Chart (Click to Remove)
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add to Active Comparison Chart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
