import React, { useState } from 'react';
import { WORLD_BANK_FORECASTS, WorldBankForecastItem } from '../data/worldBankForecasts';
import { Sparkles, Search, TrendingUp, Filter, ExternalLink } from 'lucide-react';

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
    if (selectedCategory === 'groups') return matchesSearch && (item.category === 'Group' || item.category === 'Region' || item.category === 'World');
    return matchesSearch;
  });

  return (
    <section className="mb-10" id="world-bank-outlook-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700" />
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              World Bank Real GDP Projections & Economic Potential
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Official forecasts from World Bank <em>Global Economic Prospects (June 2026, Table 1.1)</em>. Percent change from previous year.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search forecast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-[#e7e0d3] rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="inline-flex p-0.5 rounded-xl bg-stone-200/80 border border-stone-300 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              All ({WORLD_BANK_FORECASTS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('countries')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === 'countries' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Economies
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('groups')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === 'groups' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Aggregates
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#e7e0d3] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8f5ee] text-stone-700 font-semibold border-b border-[#e7e0d3]">
              <tr>
                <th className="px-4 py-3">Economy / Regional Aggregate</th>
                <th className="px-3 py-3 text-right">2023</th>
                <th className="px-3 py-3 text-right">2024</th>
                <th className="px-3 py-3 text-right">2025e</th>
                <th className="px-3 py-3 text-right font-bold text-amber-900">2026f</th>
                <th className="px-3 py-3 text-right">2027f</th>
                <th className="px-3 py-3 text-right">2028f</th>
                <th className="px-4 py-3">World Bank Potential Outlook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ebe1] text-stone-800">
              {filtered.map((row) => {
                const isSpecialHighlight = row.y2026f >= 5.0 || row.y2025e >= 7.0;

                return (
                  <tr
                    key={row.name}
                    className={`hover:bg-[#faf7f2] transition-colors ${
                      row.category === 'World' ? 'bg-amber-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.code && onSelectCountry ? (
                          <button
                            type="button"
                            onClick={() => onSelectCountry(row.code!)}
                            className="font-bold text-stone-900 hover:text-amber-800 text-left hover:underline flex items-center gap-1"
                          >
                            <span>{row.name}</span>
                            <span className="text-[10px] font-mono text-stone-400 font-normal">
                              [{row.code}]
                            </span>
                          </button>
                        ) : (
                          <span className="font-semibold text-stone-900">{row.name}</span>
                        )}

                        {row.category !== 'Country' && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                            {row.category}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-mono">{row.y2023.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right font-mono">{row.y2024.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right font-mono font-medium">{row.y2025e.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-amber-900 bg-amber-50/60">
                      {row.y2026f.toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{row.y2027f.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right font-mono">{row.y2028f.toFixed(1)}%</td>

                    <td className="px-4 py-3 text-stone-600 max-w-sm">
                      {row.potentialNote ? (
                        <div className="flex items-start gap-1.5">
                          {isSpecialHighlight && (
                            <span className="text-amber-600 font-bold shrink-0">★</span>
                          )}
                          <span className="leading-snug">{row.potentialNote}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic text-[11px]">Regional baseline</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
