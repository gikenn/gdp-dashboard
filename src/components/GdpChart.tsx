import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { CountryData, ChartMode } from '../types';
import { DollarSign, TrendingUp } from 'lucide-react';
import { GlassBox } from './GlassBox';

interface GdpChartProps {
  data: Array<Record<string, number | null>>;
  selectedCountries: string[];
  allCountries: CountryData[];
  chartMode: ChartMode;
  onChartModeChange: (mode: ChartMode) => void;
  fromYear: number;
}

const COLOR_PALETTE = [
  '#ff7b54', // Bright Coral
  '#60a5fa', // Sky Blue
  '#34d399', // Luminous Emerald
  '#fbbf24', // Warm Gold
  '#c084fc', // Violet
  '#f472b6', // Rose Pink
  '#2dd4bf', // Teal
  '#f87171', // Crimson Red
  '#a8dadc', // Frosted Blue
  '#fde047', // Lemon
  '#fb923c', // Orange
  '#38bdf8', // Cyan
];

function formatGdpValue(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return 'n/a';
  if (val >= 1e12) {
    return `$${(val / 1e12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}T`;
  }
  if (val >= 1e9) {
    return `$${(val / 1e9).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;
  }
  if (val >= 1e6) {
    return `$${(val / 1e6).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  return `$${val.toLocaleString('en-US')}`;
}

export const GdpChart: React.FC<GdpChartProps> = ({
  data,
  selectedCountries,
  allCountries,
  chartMode,
  onChartModeChange,
  fromYear,
}) => {
  const countryNameMap = new Map<string, string>();
  for (const c of allCountries) {
    countryNameMap.set(c.countryCode, c.countryName);
  }

  const isGrowth = chartMode === 'growth';

  return (
    <section className="mb-10" id="gdp-chart-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white tracking-tight">
            {isGrowth ? `GDP Growth Rate relative to ${fromYear} Baseline` : 'GDP Comparison Over Time'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {isGrowth
              ? `Percentage expansion relative to base year (${fromYear} = 0%). Negative denotes contraction.`
              : 'Nominal Gross Domestic Product in current US dollars (World Bank source).'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChartModeChange('raw')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !isGrowth
                ? 'bg-white text-[#1d3557] shadow-xs'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-[#e63946]" />
            Raw GDP ($)
          </button>
          <button
            type="button"
            onClick={() => onChartModeChange('growth')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isGrowth
                ? 'bg-white text-[#1d3557] shadow-xs'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            % Growth Rate
          </button>
        </div>
      </div>

      {selectedCountries.length === 0 ? (
        <GlassBox className="h-64" contentClassName="items-center justify-center p-6 text-slate-300 text-sm">
          No nations selected. Click countries on the globe or use the selector to plot comparisons.
        </GlassBox>
      ) : (
        <GlassBox contentClassName="p-4 sm:p-6">
          <div className="w-full h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 25, left: 15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.35)"
                  tick={{ fill: '#e2e8f0', fontSize: 12 }}
                  tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickFormatter={(val) => {
                    if (isGrowth) {
                      return `${val >= 0 ? '+' : ''}${val.toLocaleString()}%`;
                    }
                    if (val >= 1e12) return `$${val / 1e12}T`;
                    if (val >= 1e9) return `$${val / 1e9}B`;
                    if (val >= 1e6) return `$${val / 1e6}M`;
                    return `$${val}`;
                  }}
                  width={isGrowth ? 75 : 65}
                />
                {isGrowth && (
                  <ReferenceLine
                    y={0}
                    stroke="#a8dadc"
                    strokeDasharray="4 4"
                    label={{ value: `Baseline (${fromYear})`, fill: '#a8dadc', fontSize: 10, position: 'insideTopLeft' }}
                  />
                )}
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-[#090d16]/95 backdrop-blur-md border border-white/25 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[200px]">
                        <div className="flex items-center justify-between border-b border-white/15 pb-1">
                          <p className="font-bold text-amber-300">
                            Year {label}
                          </p>
                          {isGrowth && (
                            <span className="text-[10px] text-slate-300">
                              Base: {fromYear}
                            </span>
                          )}
                        </div>
                        {payload.map((entry) => {
                          const code = entry.dataKey as string;
                          const name = countryNameMap.get(code) || code;
                          const value = entry.value as number | null;
                          return (
                            <div
                              key={code}
                              className="flex items-center justify-between gap-4 text-slate-200"
                            >
                              <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span className="truncate">{name}</span>
                              </div>
                              <span className="font-mono font-bold shrink-0 text-white">
                                {isGrowth
                                  ? (value != null ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%` : 'n/a')
                                  : formatGdpValue(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '15px' }}
                  formatter={(value) => {
                    const name = countryNameMap.get(value) || value;
                    return <span className="text-xs text-slate-200 font-medium">{name}</span>;
                  }}
                />
                {selectedCountries.map((code, index) => (
                  <Line
                    key={code}
                    type="monotone"
                    dataKey={code}
                    name={code}
                    stroke={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                    strokeWidth={2.4}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#ffffff' }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassBox>
      )}
    </section>
  );
};
