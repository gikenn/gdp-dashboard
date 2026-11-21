import React, { useState } from 'react';
import { WORLD_BANK_FORECASTS } from '../data/worldBankForecasts';
import { Sparkles, Search } from 'lucide-react';
import { GlassBox } from './GlassBox';

interface WorldBankOutlookProps {
  onSelectCountry?: (countryCode: string) => void;
}

export const WorldBankOutlook: React.FC<WorldBankOutlookProps> = ({ onSelectCountry }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = WORLD_BANK_FORECASTS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.potentialNote && item.potentialNote.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'countries') return matchesSearch && item.category === 'Country';
    if (selectedCategory === 'groups')
      return matchesSearch && (item.category === 'Group' || item.category === 'Region' || item.category === 'World');
    return matchesSearch;
  });

  return (
    <section className="mb-10" id="world-bank-outlook-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h2 className="font-display text-xl font-bold text-white tracking-tight">
              World Bank Real GDP Projections &amp; Economic Potential
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Official forecasts from World Bank <em>Global Economic Prospects (June 2026, Table 1.1)</em>. Percent change from previous year.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Search forecast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/25 rounded-xl text-xs text-white placeholder-slate-300 focus:outline-hidden focus:ring-1 focus:ring-amber-300"
            />
          </div>

          <div className="inline-flex p-0.5 rounded-xl bg-white/10 border border-white/20 text-xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCategory === 'all' ? 'bg-white text-[#1d3557] shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              All ({WORLD_BANK_FORECASTS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('countries')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCategory === 'countries' ? 'bg-white text-[#1d3557] shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              Economies
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('groups')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCategory === 'groups' ? 'bg-white text-[#1d3557] shadow-xs' : 'text-slate-200 hover:text-white'
              }`}
            >
              Aggregates
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <GlassBox contentClassName="overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/10 text-slate-100 font-semibold border-b border-white/15">
              <tr>
                <th className="px-4 py-3">Economy / Regional Aggregate</th>
                <th className="px-3 py-3 text-right">2023</th>
                <th className="px-3 py-3 text-right">2024</th>
                <th className="px-3 py-3 text-right">2025e</th>
                <th className="px-3 py-3 text-right font-bold text-amber-300">2026f</th>
                <th className="px-3 py-3 text-right">2027f</th>
                <th className="px-3 py-3 text-right">2028f</th>
                <th className="px-4 py-3">World Bank Potential Outlook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-100">
              {filtered.map((row) => {
                const isSpecialHighlight = row.y2026f >= 5.0 || row.y2025e >= 7.0;

                return (
                  <tr
                    key={row.name}
                    className={`hover:bg-white/10 transition-colors ${
                      row.category === 'World' ? 'bg-amber-400/10 font-semibold' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.code && onSelectCountry ? (
                          <button
                            type="button"
                            onClick={() => onSelectCountry(row.code!)}
                            className="font-bold text-white hover:text-amber-300 text-left hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>{row.name}</span>
                            <span className="text-[10px] font-mono text-[#a8dadc] font-normal">
                              [{row.code}]
                            </span>
                          </button>
                        ) : (
                          <span className="font-semibold text-white">{row.name}</span>
                        )}

                        {row.category !== 'Country' && (
                          <span className="text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-[#a8dadc] font-mono">
                            {row.category}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-mono">{row.y2023.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right font-mono">{row.y2024.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right font-mono font-medium">{row.y2025e.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-amber-300 bg-amber-400/10">
                      {row.y2026f.toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{row.y2027f.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right font-mono">{row.y2028f.toFixed(1)}%</td>

                    <td className="px-4 py-3 text-slate-200 max-w-sm">
                      {row.potentialNote ? (
                        <div className="flex items-start gap-1.5">
                          {isSpecialHighlight && (
                            <span className="text-amber-300 font-bold shrink-0">★</span>
                          )}
                          <span className="leading-snug">{row.potentialNote}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Regional baseline</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassBox>
    </section>
  );
};
