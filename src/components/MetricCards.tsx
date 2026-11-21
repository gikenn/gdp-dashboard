import React from 'react';
import { MetricData } from '../types';
import { ArrowUpRight, Minus, ExternalLink } from 'lucide-react';
import { GlassBox } from './GlassBox';
import { CountryFlag } from './CountryFlag';

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
          <h2 className="font-display text-xl font-bold text-white tracking-tight">
            Active Selection Snapshot ({toYear})
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
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

          return (
            <GlassBox
              key={m.countryCode}
              id={`metric-card-${m.countryCode}`}
              onClick={() => onSelectCountry && onSelectCountry(m.countryCode)}
              className="hover:scale-[1.02] cursor-pointer group"
              contentClassName="p-4 justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
                  <div className="flex items-center gap-2">
                    <CountryFlag code={m.countryCode} size="sm" />
                    <span className="font-bold text-white font-mono">{m.countryCode}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="truncate text-xs text-slate-200 font-medium mb-1">
                  {m.countryName}
                </div>
                <div className="font-display text-xl font-extrabold tracking-tight text-white my-0.5 font-mono">
                  {displayValue}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between text-xs">
                {isPositive ? (
                  <span className="flex items-center text-emerald-300 font-semibold font-mono text-[11px]">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    {m.growth}
                  </span>
                ) : (
                  <span className="flex items-center text-slate-300 font-medium font-mono text-[11px]">
                    <Minus className="w-3 h-3 mr-0.5" />
                    {m.growth}
                  </span>
                )}
                <span className="text-[10px] text-slate-300">
                  vs {m.effectiveFromYear ?? fromYear}
                </span>
              </div>
            </GlassBox>
          );
        })}
      </div>
    </section>
  );
};
