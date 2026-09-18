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

interface GdpChartProps {
  data: Array<Record<string, number | null>>;
  selectedCountries: string[];
  allCountries: CountryData[];
  chartMode: ChartMode;
  onChartModeChange: (mode: ChartMode) => void;
  fromYear: number;
}

const COLOR_PALETTE = [
  '#c2410c', // Deep Terracotta
  '#2563eb', // Royal Blue
  '#059669', // Emerald
  '#d97706', // Warm Amber
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0d9488', // Teal
  '#dc2626', // Crimson
  '#475569', // Slate
  '#9333ea', // Violet
  '#b45309', // Copper
  '#0284c7', // Sky blue
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
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              {isGrowth ? `GDP Growth Rate relative to ${fromYear} Baseline` : 'GDP Comparison Over Time'}
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {isGrowth
              ? `Percentage expansion relative to base year (${fromYear} = 0%). Negative denotes contraction.`
              : 'Nominal Gross Domestic Product in current US dollars (World Bank source).'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 rounded-xl bg-stone-200/80 border border-stone-300/80 shadow-inner self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onChartModeChange('raw')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isGrowth
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-700" />
            Raw GDP ($)
          </button>
          <button
            type="button"
            onClick={() => onChartModeChange('growth')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isGrowth
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            % Growth Rate
          </button>
        </div>
      </div>

      {selectedCountries.length === 0 ? (
        <div className="h-64 flex items-center justify-center bg-white border border-[#e7e0d3] rounded-2xl text-stone-500 text-sm">
          No nations selected. Click countries on the globe or use the selector to plot comparisons.
        </div>
      ) : (
        <div className="bg-white border border-[#e7e0d3] rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="w-full h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 25, left: 15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe1" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="#a8a29e"
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  tickLine={{ stroke: '#e7e0d3' }}
                />
                <YAxis
                  stroke="#a8a29e"
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  tickLine={{ stroke: '#e7e0d3' }}
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
                  <ReferenceLine y={0} stroke="#78716c" strokeDasharray="4 4" label={{ value: `Baseline (${fromYear})`, fill: '#78716c', fontSize: 10, position: 'insideTopLeft' }} />
                )}
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="bg-stone-900/95 backdrop-blur-xs border border-stone-700 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[200px]">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-1">
                          <p className="font-bold text-amber-300">
                            Year {label}
                          </p>
                          {isGrowth && (
                            <span className="text-[10px] text-stone-400">
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
                              className="flex items-center justify-between gap-4 text-stone-200"
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
                    return <span className="text-xs text-stone-700 font-medium">{name}</span>;
                  }}
                />
                {selectedCountries.map((code, index) => (
                  <Line
                    key={code}
                    type="monotone"
                    dataKey={code}
                    name={code}
                    stroke={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                    strokeWidth={2.2}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#ffffff' }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
};
