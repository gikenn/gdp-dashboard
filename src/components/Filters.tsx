import React, { useState, useRef, useEffect } from 'react';
import { CountryData } from '../types';
import { MIN_YEAR, MAX_YEAR, DEFAULT_SELECTED_COUNTRIES } from '../data/gdpService';
import { AlertTriangle, ChevronDown, X, Search, RotateCcw } from 'lucide-react';

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
      <div className="bg-white border border-[#e7e0d3] rounded-2xl p-5 shadow-xs" id="year-filter-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <label className="text-sm font-semibold text-stone-800" htmlFor="from-year-slider">
            Historical Horizon ({MIN_YEAR} — {MAX_YEAR})
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200">
              {fromYear} — {toYear} ({toYear - fromYear} yrs)
            </span>
            <button
              type="button"
              onClick={() => onYearRangeChange(MIN_YEAR, MAX_YEAR)}
              className="text-xs text-stone-500 hover:text-stone-800 px-2.5 py-1 rounded-full hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200"
              title="Reset years"
            >
              Full range
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between text-xs text-stone-500 mb-1">
                <span>Baseline Start Year</span>
                <span className="font-bold text-stone-800 font-mono">{fromYear}</span>
              </div>
              <input
                id="from-year-slider"
                type="range"
                min={MIN_YEAR}
                max={toYear}
                value={fromYear}
                onChange={(e) => onYearRangeChange(Number(e.target.value), toYear)}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-stone-500 mb-1">
                <span>End Comparison Year</span>
                <span className="font-bold text-stone-800 font-mono">{toYear}</span>
              </div>
              <input
                id="to-year-slider"
                type="range"
                min={fromYear}
                max={MAX_YEAR}
                value={toYear}
                onChange={(e) => onYearRangeChange(fromYear, Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
              />
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-stone-400 pt-1 font-mono">
            <span>{MIN_YEAR}</span>
            <span>1970</span>
            <span>1980</span>
            <span>1990</span>
            <span>2000</span>
            <span>2010</span>
            <span>{MAX_YEAR}</span>
          </div>
        </div>
      </div>

      {/* Country Multiselect Section */}
      <div className="bg-white border border-[#e7e0d3] rounded-2xl p-5 shadow-xs" id="country-filter-card">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <label className="text-sm font-semibold text-stone-800" id="country-select-label">
              Active Comparison Set ({selectedCountries.length})
            </label>
            <p className="text-xs text-stone-500">
              Select nations directly below or click their capital city on the central globe.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset defaults
            </button>
            {selectedCountries.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectedCountriesChange([])}
                className="text-xs text-stone-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
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
            className="min-h-[46px] p-2 bg-[#faf7f2] border border-[#e7e0d3] hover:border-amber-400 focus-within:border-amber-600 rounded-xl cursor-pointer flex flex-wrap items-center gap-1.5 transition-colors"
            id="multiselect-input-box"
          >
            {selectedCountries.map((code) => {
              const country = allCountries.find((c) => c.countryCode === code);
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-white text-stone-800 px-2.5 py-1 rounded-lg border border-[#ded7cc] shadow-2xs"
                >
                  <span className="font-bold text-amber-800 font-mono">{code}</span>
                  {country && (
                    <span className="text-stone-600 max-w-[120px] truncate hidden sm:inline">
                      {country.countryName}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => removeCountry(code, e)}
                    className="hover:text-red-600 p-0.5 rounded-full hover:bg-stone-100 transition-colors"
                    title={`Remove ${code}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            <div className="flex-1 min-w-[140px] flex items-center justify-between px-2 text-xs text-stone-500">
              <span>{selectedCountries.length === 0 ? 'Click to select countries...' : 'Add more...'}</span>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-[#e7e0d3] rounded-xl shadow-xl overflow-hidden max-h-72 flex flex-col">
              <div className="p-2.5 border-b border-[#f0ebe1] flex items-center gap-2 bg-[#faf7f2]">
                <Search className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search countries by name or 3-letter code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden"
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
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto p-1 divide-y divide-stone-100">
                {filteredCountries.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-500">
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
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-amber-50 text-amber-900 font-semibold'
                            : 'text-stone-700 hover:bg-[#faf7f2]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                            {country.countryCode}
                          </span>
                          <span className="truncate">{country.countryName}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[11px] font-bold text-amber-800 shrink-0 ml-2">
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
      </div>

      {/* Warning banner when no country is selected */}
      {selectedCountries.length === 0 && (
        <div
          id="warning-banner"
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium"
        >
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Select at least one country or click a capital city on the globe.</span>
        </div>
      )}
    </div>
  );
};
