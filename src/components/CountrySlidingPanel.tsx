import React, { useEffect, useState } from 'react';
import {
  CountryRundown,
  Data360CountryAnalytics,
  Data360IndicatorMetadata,
} from '../types';
import {
  X,
  TrendingUp,
  Award,
  Globe,
  Plus,
  Check,
  Sparkles,
  Landmark,
  Users,
  DollarSign,
  Activity,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { GlassBox } from './GlassBox';
import { CountryFlag } from './CountryFlag';
import {
  DATA360_INDICATORS,
  fetchData360CountryAnalytics,
  fetchData360IndicatorMetadata,
  getCachedData360Analytics,
  getCachedData360Metadata,
} from '../data/data360Service';

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

function formatPopulation(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return 'n/a';
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toLocaleString('en-US');
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
  const countryCode = rundown?.country.countryCode ?? null;
  const [data360, setData360] = useState<Data360CountryAnalytics | null>(() =>
    countryCode ? getCachedData360Analytics(countryCode) ?? null : null
  );
  const [indicatorMeta, setIndicatorMeta] = useState<
    Record<string, Data360IndicatorMetadata>
  >(() => getCachedData360Metadata() ?? {});
  const [activeIndicatorId, setActiveIndicatorId] = useState<string | null>(null);
  const [isLoadingData360, setIsLoadingData360] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !countryCode) return;

    let cancelled = false;

    if (!getCachedData360Metadata()) {
      fetchData360IndicatorMetadata().then((metaMap) => {
        if (!cancelled && Object.keys(metaMap).length > 0) {
          setIndicatorMeta(metaMap);
        }
      });
    }

    const cached = getCachedData360Analytics(countryCode);
    if (cached) {
      setData360(cached);
      setIsLoadingData360(false);
      return;
    }

    setData360(null);
    setIsLoadingData360(true);

    fetchData360CountryAnalytics(countryCode)
      .then((res) => {
        if (!cancelled) {
          setData360(res);
          setIsLoadingData360(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoadingData360(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, countryCode]);

  if (!isOpen || !rundown) return null;

  const {
    country,
    meta,
    latestGdp,
    rank2022,
    shareOfWorld2022,
    startYearGdp,
    effectiveStartYear,
    peakGdp,
    growthMultiple,
    cagr,
    forecast,
  } = rundown;

  // Prefer live Data360 WDI base GDP if local CSV lacked the exact fromYear
  const resolvedStartYear =
    data360?.gdpByYear[fromYear] != null ? fromYear : effectiveStartYear;
  const resolvedStartGdp =
    data360?.gdpByYear[fromYear] ?? startYearGdp ?? data360?.gdpByYear[resolvedStartYear] ?? null;

  let resolvedGrowthMultiple = growthMultiple;
  let resolvedCagr = cagr;
  if (resolvedStartGdp && latestGdp && resolvedStartGdp > 0) {
    resolvedGrowthMultiple = latestGdp / resolvedStartGdp;
    const yrs = toYear - resolvedStartYear;
    if (yrs > 0) {
      resolvedCagr = (Math.pow(latestGdp / resolvedStartGdp, 1 / yrs) - 1) * 100;
    }
  }

  // Merge historical 1960–2022 series with any live Data360 WDI years (up to 2025+)
  const maxChartYear = Math.max(2022, data360?.latestYear ?? 2022);
  const historyData: Array<{ year: number; gdpBillions: number | null }> = [];
  for (let yr = 1960; yr <= maxChartYear; yr++) {
    const v = country.gdpByYear[yr] ?? data360?.gdpByYear[yr] ?? null;
    historyData.push({
      year: yr,
      gdpBillions: v != null ? Math.round(v / 1e9) : null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="country-sliding-panel-root">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-[#080c18]/92 backdrop-blur-2xl border-l border-white/25 shadow-2xl flex flex-col justify-between overflow-y-auto text-white">
          {/* Header */}
          <div className="p-6 border-b border-white/15 bg-black/35 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <CountryFlag code={country.countryCode} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                      {country.countryName}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-white/15 text-[#a8dadc]">
                      {country.countryCode}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 flex items-center gap-2 mt-0.5">
                    <span>Capital: <strong className="text-white font-semibold">{meta?.capital || 'N/A'}</strong></span>
                    {meta?.continent && (
                      <>
                        <span className="text-slate-500">·</span>
                        <span>{meta.continent}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 flex-1">
            {/* Top Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <GlassBox contentClassName="p-4">
                <div className="text-xs text-[#a8dadc] font-medium flex items-center gap-1 mb-1">
                  <Globe className="w-3.5 h-3.5" />
                  Latest GDP (2022)
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {formatCurrency(latestGdp)}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {shareOfWorld2022 > 0
                    ? `${shareOfWorld2022.toFixed(2)}% of world total`
                    : 'Global record'}
                </div>
              </GlassBox>

              <GlassBox contentClassName="p-4">
                <div className="text-xs text-amber-300 font-medium flex items-center gap-1 mb-1">
                  <Award className="w-3.5 h-3.5" />
                  Global Rank
                </div>
                <div className="text-lg font-bold text-white">
                  {rank2022 <= 216 ? `#${rank2022} in World` : 'Ranked economy'}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {peakGdp ? `Peak: ${peakGdp.year} (${formatCurrency(peakGdp.value)})` : 'Sustained'}
                </div>
              </GlassBox>

              <GlassBox contentClassName="p-4">
                <div className="text-xs text-emerald-300 font-medium flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Total Growth ({resolvedStartYear}–{toYear})
                </div>
                <div className="text-lg font-bold text-emerald-300 font-mono">
                  {resolvedGrowthMultiple ? `${resolvedGrowthMultiple.toFixed(2)}x` : 'N/A'}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {resolvedCagr != null ? `CAGR: ${resolvedCagr.toFixed(2)}%/year` : 'Baseline period'}
                </div>
              </GlassBox>

              <GlassBox contentClassName="p-4">
                <div className="text-xs text-slate-300 font-medium flex items-center gap-1 mb-1">
                  <Landmark className="w-3.5 h-3.5" />
                  Base GDP ({resolvedStartYear})
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {formatCurrency(resolvedStartGdp)}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  {resolvedStartYear !== fromYear
                    ? `Earliest WDI record (${resolvedStartYear})`
                    : 'Historical starting marker'}
                </div>
              </GlassBox>
            </div>

            {/* Live World Bank Data360 Country Analytics (WDI) */}
            <GlassBox contentClassName="p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#a8dadc]" />
                  <h3 className="font-display text-sm font-bold text-white tracking-tight">
                    World Bank Data360 · WDI Profile
                  </h3>
                </div>
                {isLoadingData360 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-mono">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  <a
                    href="https://data360.worldbank.org/en/analytics/country-analytics"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#a8dadc] hover:text-amber-300 transition-colors"
                  >
                    <span>Data360</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {data360 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndicatorId((prev) =>
                          prev === DATA360_INDICATORS.GDP_USD
                            ? null
                            : DATA360_INDICATORS.GDP_USD
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        activeIndicatorId === DATA360_INDICATORS.GDP_USD
                          ? 'bg-white/15 border-amber-300/60'
                          : 'bg-black/30 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-[11px] text-slate-300 flex items-center justify-between gap-1 mb-1">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3 h-3 text-[#a8dadc]" />
                          <span>WDI GDP ({data360.latestYear ?? 'Latest'})</span>
                        </span>
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {formatCurrency(data360.latestGdpUsd)}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndicatorId((prev) =>
                          prev === DATA360_INDICATORS.GDP_PER_CAPITA
                            ? null
                            : DATA360_INDICATORS.GDP_PER_CAPITA
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        activeIndicatorId === DATA360_INDICATORS.GDP_PER_CAPITA
                          ? 'bg-white/15 border-amber-300/60'
                          : 'bg-black/30 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-[11px] text-slate-300 flex items-center justify-between gap-1 mb-1">
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-amber-300" />
                          <span>GDP per Capita ({data360.gdpPerCapitaLatest?.year ?? '—'})</span>
                        </span>
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {data360.gdpPerCapitaLatest
                          ? `$${Math.round(data360.gdpPerCapitaLatest.value).toLocaleString('en-US')}`
                          : 'n/a'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndicatorId((prev) =>
                          prev === DATA360_INDICATORS.POPULATION
                            ? null
                            : DATA360_INDICATORS.POPULATION
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        activeIndicatorId === DATA360_INDICATORS.POPULATION
                          ? 'bg-white/15 border-amber-300/60'
                          : 'bg-black/30 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-[11px] text-slate-300 flex items-center justify-between gap-1 mb-1">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-emerald-300" />
                          <span>Population ({data360.populationLatest?.year ?? '—'})</span>
                        </span>
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {formatPopulation(data360.populationLatest?.value)}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndicatorId((prev) =>
                          prev === DATA360_INDICATORS.GDP_GROWTH_PCT
                            ? null
                            : DATA360_INDICATORS.GDP_GROWTH_PCT
                        )
                      }
                      className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        activeIndicatorId === DATA360_INDICATORS.GDP_GROWTH_PCT
                          ? 'bg-white/15 border-amber-300/60'
                          : 'bg-black/30 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-[11px] text-slate-300 flex items-center justify-between gap-1 mb-1">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-amber-300" />
                          <span>Real Growth ({data360.annualGrowthLatest?.year ?? '—'})</span>
                        </span>
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                      <div
                        className={`text-sm font-bold font-mono ${
                          (data360.annualGrowthLatest?.value ?? 0) >= 0
                            ? 'text-emerald-300'
                            : 'text-rose-300'
                        }`}
                      >
                        {data360.annualGrowthLatest
                          ? `${data360.annualGrowthLatest.value >= 0 ? '+' : ''}${data360.annualGrowthLatest.value.toFixed(2)}%`
                          : 'n/a'}
                      </div>
                    </button>
                  </div>

                  {activeIndicatorId && indicatorMeta[activeIndicatorId] && (
                    <div className="rounded-xl bg-black/45 border border-white/15 p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-amber-300">
                          {indicatorMeta[activeIndicatorId].name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveIndicatorId(null)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                          title="Close methodology note"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-[#a8dadc]">
                        {indicatorMeta[activeIndicatorId].idno}
                        {indicatorMeta[activeIndicatorId].measurementUnit
                          ? ` · Unit: ${indicatorMeta[activeIndicatorId].measurementUnit}`
                          : ''}
                      </div>
                      {indicatorMeta[activeIndicatorId].definition && (
                        <p className="text-[11px] text-slate-200 leading-relaxed">
                          {indicatorMeta[activeIndicatorId].definition}
                        </p>
                      )}
                      {indicatorMeta[activeIndicatorId].sources.length > 0 && (
                        <p className="text-[10px] text-slate-400">
                          Sources: {indicatorMeta[activeIndicatorId].sources.join(', ')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : isLoadingData360 ? (
                <div className="grid grid-cols-2 gap-2.5 animate-pulse">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="h-14 rounded-xl bg-white/5 border border-white/10"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-300">
                  Live WB_WDI series unavailable for this code; showing historical dataset metrics above.
                </p>
              )}
            </GlassBox>

            {/* Historical Trajectory Sparkline */}
            <GlassBox contentClassName="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-sm font-bold text-white tracking-tight">
                  Long-term Trajectory (1960 — {maxChartYear})
                </h3>
                <span className="text-xs text-slate-300">in Billions USD</span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="panelAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff7b54" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#ff7b54" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="year"
                      stroke="rgba(255,255,255,0.35)"
                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
                      tickLine={false}
                      ticks={[1960, 1980, 2000, maxChartYear]}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.35)"
                      tick={{ fill: '#cbd5e1', fontSize: 11 }}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}T` : `${v}B`)}
                      width={40}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const v = payload[0].value as number | null;
                        return (
                          <div className="bg-[#090d16] text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg border border-white/25 font-mono">
                            <span className="text-amber-300 font-bold">{label}: </span>
                            <span>{v != null ? `$${v.toLocaleString()}B` : 'No data'}</span>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="gdpBillions"
                      stroke="#ff7b54"
                      strokeWidth={2.2}
                      fillOpacity={1}
                      fill="url(#panelAreaGrad)"
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassBox>

            {/* World Bank Estimates & Growth Potential Section */}
            <GlassBox contentClassName="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="font-display text-sm font-bold text-white tracking-tight">
                  World Bank Forecast &amp; Potential (June 2026)
                </h3>
              </div>

              {forecast ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {forecast.potentialNote ||
                      'Projected real GDP growth based on the World Bank Global Economic Prospects report.'}
                  </p>

                  <div className="overflow-x-auto rounded-lg border border-white/20 bg-black/35">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-white/10 text-slate-200 font-semibold border-b border-white/15">
                        <tr>
                          <th className="px-2.5 py-1.5">2023</th>
                          <th className="px-2.5 py-1.5">2024</th>
                          <th className="px-2.5 py-1.5">2025e</th>
                          <th className="px-2.5 py-1.5 text-amber-300">2026f</th>
                          <th className="px-2.5 py-1.5">2027f</th>
                          <th className="px-2.5 py-1.5">2028f</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 font-mono text-white">
                        <tr>
                          <td className="px-2.5 py-1.5">{forecast.y2023.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5">{forecast.y2024.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5 font-semibold text-[#a8dadc]">{forecast.y2025e.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5 font-bold text-amber-300">{forecast.y2026f.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5 font-semibold">{forecast.y2027f.toFixed(1)}%</td>
                          <td className="px-2.5 py-1.5 font-semibold">{forecast.y2028f.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[11px] text-slate-300 italic">
                    Source: World Bank Global Economic Prospects Table 1.1 Real GDP (June 2026)
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed">
                  Individual direct forecast line for {country.countryName} is consolidated within its regional aggregate in Table 1.1 of the World Bank Global Economic Prospects report.
                </p>
              )}
            </GlassBox>
          </div>

          {/* Footer Action Bar */}
          <div className="p-6 border-t border-white/15 bg-black/40 sticky bottom-0">
            <button
              type="button"
              onClick={() => onToggleComparison(country.countryCode)}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                isCountryInComparison
                  ? 'bg-amber-300 text-[#1d3557] hover:bg-amber-200'
                  : 'bg-[#e63946] text-white hover:bg-[#ff4d5a]'
              }`}
            >
              {isCountryInComparison ? (
                <>
                  <Check className="w-4 h-4" />
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
