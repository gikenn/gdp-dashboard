import React from 'react';
import { MetricData } from '../types';
import { ArrowUpRight, Minus, ExternalLink } from 'lucide-react';
import { COUNTRY_METADATA } from '../data/countryMetadata';

interface MetricCardsProps {
  metrics: MetricData[];
  toYear: number;
  fromYear: number;
  onSelectCountry?: (countryCode: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  metrics,
  toYear,
  fromYear,
  onSelectCountry,
}) => {
  if (metrics.length === 0) return null;

  return (
    <section className="mb-10" id="metric-cards-section">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Active Selection Snapshot ({toYear})
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Key output markers and cumulative growth since baseline ({fromYear}).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {metrics.map((m) => {
          const displayValue =
            m.lastGdp != null
              ? m.lastGdp >= 1000
                ? `$${(m.lastGdp / 1000).toFixed(2)}T`
                : `$${Math.round(m.lastGdp).toLocaleString('en-US')}B`
              : 'n/a';

          const isPositive = m.deltaColor === 'normal';
          const meta = COUNTRY_METADATA[m.countryCode];

          return (
            <div
              key={m.countryCode}
              id={`metric-card-${m.countryCode}`}
              onClick={() => onSelectCountry && onSelectCountry(m.countryCode)}
              className="bg-white border border-[#e7e0d3] rounded-2xl p-4 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-stone-500 mb-1 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>{meta?.flag || '🏳️'}</span>
                    <span className="font-bold text-stone-900 font-mono">{m.countryCode}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="truncate text-xs text-stone-600 font-medium mb-1">
                  {m.countryName}
                </div>
                <div className="text-xl font-extrabold tracking-tight text-stone-900 my-0.5 font-mono">
                  {displayValue}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#f0ebe1] flex items-center justify-between text-xs">
                {isPositive ? (
                  <span className="flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded font-mono text-[11px]">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    {m.growth}
                  </span>
                ) : (
                  <span className="flex items-center text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded font-mono text-[11px]">
                    <Minus className="w-3 h-3 mr-0.5" />
                    {m.growth}
                  </span>
                )}
                <span className="text-[10px] text-stone-400">vs {fromYear}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
