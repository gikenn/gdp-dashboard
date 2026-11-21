import React, { useState, useRef, useEffect } from 'react';
import { CountryData } from '../types';
import { MIN_YEAR, MAX_YEAR, DEFAULT_SELECTED_COUNTRIES } from '../data/gdpService';
import { AlertTriangle, ChevronDown, X, Search, RotateCcw } from 'lucide-react';
import { GlassBox } from './GlassBox';
import { CountryFlag } from './CountryFlag';

interface FiltersProps {
  allCountries: CountryData[];
  selectedCountries: string[];
  onSelectedCountriesChange: (countries: string[]) => void;
  fromYear: number;
  toYear: number;
  onYearRangeChange: (from: number, to: number) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  allCountries,
  selectedCountries,
  onSelectedCountriesChange,
  fromYear,
  toYear,
  onYearRangeChange,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = allCountries.filter(
    (c) =>
      c.countryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.countryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      onSelectedCountriesChange(selectedCountries.filter((c) => c !== code));
    } else {
      onSelectedCountriesChange([...selectedCountries, code]);
    }
  };

  const removeCountry = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectedCountriesChange(selectedCountries.filter((c) => c !== code));
  };

  const resetToDefaults = () => {
    onSelectedCountriesChange(DEFAULT_SELECTED_COUNTRIES);
    onYearRangeChange(MIN_YEAR, MAX_YEAR);
  };

  return (
    <div className="space-y-5 mb-8" id="filters-container">
      {/* Year Range Slider Section */}
      <GlassBox id="year-filter-card" contentClassName="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <label className="text-sm font-semibold text-white" htmlFor="from-year-slider">
            Historical Horizon ({MIN_YEAR} — {MAX_YEAR})
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-300">
              {fromYear} — {toYear} ({toYear - fromYear} yrs)
            </span>
            <button
              type="button"
              onClick={() => onYearRangeChange(MIN_YEAR, MAX_YEAR)}
              className="text-xs text-slate-200 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/15 transition-colors border border-white/20 cursor-pointer"
              title="Reset years"
            >
              Full range
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Baseline Start Year</span>
                <span className="font-bold text-white font-mono">{fromYear}</span>
              </div>
              <input
                id="from-year-slider"
                type="range"
                min={MIN_YEAR}
                max={toYear}
                value={fromYear}
                onChange={(e) => onYearRangeChange(Number(e.target.value), toYear)}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#e63946]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>End Comparison Year</span>
                <span className="font-bold text-white font-mono">{toYear}</span>
              </div>
              <input
                id="to-year-slider"
                type="range"
                min={fromYear}
                max={MAX_YEAR}
                value={toYear}
                onChange={(e) => onYearRangeChange(fromYear, Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#e63946]"
              />
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-300 pt-1 font-mono">
            <span>{MIN_YEAR}</span>
            <span>1970</span>
            <span>1980</span>
            <span>1990</span>
            <span>2000</span>
            <span>2010</span>
            <span>{MAX_YEAR}</span>
          </div>
        </div>
      </GlassBox>

      {/* Country Multiselect Section (overflow-visible so dropdown renders cleanly above lower sections) */}
      <GlassBox id="country-filter-card" className="overflow-visible! z-20" contentClassName="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <label className="text-sm font-semibold text-white" id="country-select-label">
              Active Comparison Set ({selectedCountries.length})
            </label>
            <p className="text-xs text-slate-300">
              Select nations directly below or click their capital city on the central globe.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              className="inline-flex items-center gap-1 text-xs text-slate-200 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset defaults
            </button>
            {selectedCountries.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectedCountriesChange([])}
                className="text-xs text-slate-300 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Selected Country Pills */}
        <div ref={dropdownRef} className="relative">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="min-h-[46px] p-2 bg-black/30 border border-white/20 hover:border-white/40 focus-within:border-amber-300 rounded-xl cursor-pointer flex flex-wrap items-center gap-1.5 transition-colors"
            id="multiselect-input-box"
          >
            {selectedCountries.map((code) => {
              const country = allCountries.find((c) => c.countryCode === code);
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/15 text-white px-2.5 py-1 rounded-lg border border-white/25"
                >
                  <CountryFlag code={code} size="xs" />
                  <span className="font-bold text-amber-300 font-mono">{code}</span>
                  {country && (
                    <span className="text-slate-200 max-w-[120px] truncate hidden sm:inline">
                      {country.countryName}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => removeCountry(code, e)}
                    className="hover:text-rose-300 p-0.5 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                    title={`Remove ${code}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            <div className="flex-1 min-w-[140px] flex items-center justify-between px-2 text-xs text-slate-300">
              <span>{selectedCountries.length === 0 ? 'Click to select countries...' : 'Add more...'}</span>
              <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#0b101d]/95 backdrop-blur-xl border border-white/25 rounded-xl shadow-2xl overflow-hidden max-h-72 flex flex-col">
              <div className="p-2.5 border-b border-white/15 flex items-center gap-2 bg-black/30">
                <Search className="w-4 h-4 text-slate-300 shrink-0" />
                <input
                  type="text"
                  placeholder="Search countries by name or 3-letter code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-hidden"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    className="text-slate-300 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto p-1 divide-y divide-white/10">
                {filteredCountries.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-300">
                    No countries matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredCountries.map((country) => {
                    const isSelected = selectedCountries.includes(country.countryCode);
                    return (
                      <button
                        key={country.countryCode}
                        type="button"
                        onClick={() => toggleCountry(country.countryCode)}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#e63946]/30 text-amber-200 font-semibold'
                            : 'text-slate-100 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <CountryFlag code={country.countryCode} size="sm" />
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white/10 text-[#a8dadc]">
                            {country.countryCode}
                          </span>
                          <span className="truncate">{country.countryName}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[11px] font-bold text-amber-300 shrink-0 ml-2">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </GlassBox>

      {/* Warning banner when no country is selected */}
      {selectedCountries.length === 0 && (
        <GlassBox id="warning-banner" contentClassName="flex-row! items-center gap-3 p-4 text-amber-200 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
          <span>Select at least one country or click a capital city on the globe.</span>
        </GlassBox>
      )}
    </div>
  );
};
