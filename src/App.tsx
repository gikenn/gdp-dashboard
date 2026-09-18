import React, { useState, useMemo } from 'react';
import {
  loadGdpData,
  getChartData,
  computeMetrics,
  getWorldOverview,
  getCountryRundown,
  MIN_YEAR,
  MAX_YEAR,
  DEFAULT_SELECTED_COUNTRIES,
} from './data/gdpService';
import { ChartMode } from './types';
import { Header } from './components/Header';
import { AnimatedGlobe } from './components/AnimatedGlobe';
import { WorldSummaryHero } from './components/WorldSummaryHero';
import { Filters } from './components/Filters';
import { GdpChart } from './components/GdpChart';
import { MetricCards } from './components/MetricCards';
import { WorldBankOutlook } from './components/WorldBankOutlook';
import { CountrySlidingPanel } from './components/CountrySlidingPanel';

export default function App() {
  const [fromYear, setFromYear] = useState<number>(MIN_YEAR);
  const [toYear, setToYear] = useState<number>(MAX_YEAR);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    DEFAULT_SELECTED_COUNTRIES
  );
  const [chartMode, setChartMode] = useState<ChartMode>('raw');

  // Country inspection state for the sliding drawer
  const [inspectedCountryCode, setInspectedCountryCode] = useState<string | null>(null);
  const [isSlidingPanelOpen, setIsSlidingPanelOpen] = useState<boolean>(false);

  const allCountries = useMemo(() => loadGdpData(), []);
  const worldOverview = useMemo(() => getWorldOverview(), []);

  const chartData = useMemo(() => {
    return getChartData(selectedCountries, fromYear, toYear, chartMode);
  }, [selectedCountries, fromYear, toYear, chartMode]);

  const metrics = useMemo(() => {
    return computeMetrics(selectedCountries, fromYear, toYear);
  }, [selectedCountries, fromYear, toYear]);

  const countryRundown = useMemo(() => {
    if (!inspectedCountryCode) return null;
    return getCountryRundown(inspectedCountryCode, fromYear, toYear);
  }, [inspectedCountryCode, fromYear, toYear]);

  const handleYearRangeChange = (from: number, to: number) => {
    setFromYear(Math.min(from, to));
    setToYear(Math.max(from, to));
  };

  const handleSelectCountry = (countryCode: string) => {
    setInspectedCountryCode(countryCode);
    setIsSlidingPanelOpen(true);
  };

  const handleToggleComparison = (countryCode: string) => {
    if (selectedCountries.includes(countryCode)) {
      setSelectedCountries(selectedCountries.filter((c) => c !== countryCode));
    } else {
      setSelectedCountries([...selectedCountries, countryCode]);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#1c1917] p-4 sm:p-8 selection:bg-amber-200 selection:text-amber-950" id="app-root">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Hero Section: World Total, Centered Animated Globe, Top Holders & World Bank Potential */}
        <WorldSummaryHero
          overview={worldOverview}
          onSelectCountry={handleSelectCountry}
          selectedCountryCode={inspectedCountryCode}
        >
          <AnimatedGlobe
            countries={allCountries}
            selectedCountryCode={inspectedCountryCode}
            onSelectCountry={handleSelectCountry}
            targetYear={toYear}
          />
        </WorldSummaryHero>

        {/* Interactive Controls & Filters */}
        <Filters
          allCountries={allCountries}
          selectedCountries={selectedCountries}
          onSelectedCountriesChange={setSelectedCountries}
          fromYear={fromYear}
          toYear={toYear}
          onYearRangeChange={handleYearRangeChange}
        />

        {/* Metric Snapshots for Active Countries */}
        <MetricCards
          metrics={metrics}
          toYear={toYear}
          fromYear={fromYear}
          onSelectCountry={handleSelectCountry}
        />

        {/* Interactive Chart with Raw GDP vs Growth Rate Toggle */}
        <GdpChart
          data={chartData}
          selectedCountries={selectedCountries}
          allCountries={allCountries}
          chartMode={chartMode}
          onChartModeChange={setChartMode}
          fromYear={fromYear}
        />

        {/* World Bank Real GDP Projections & Growth Potential (Table 1.1) */}
        <WorldBankOutlook onSelectCountry={handleSelectCountry} />

        {/* Sliding Panel for Capital City / Nation Rundown */}
        <CountrySlidingPanel
          rundown={countryRundown}
          isOpen={isSlidingPanelOpen}
          onClose={() => setIsSlidingPanelOpen(false)}
          isCountryInComparison={
            inspectedCountryCode ? selectedCountries.includes(inspectedCountryCode) : false
          }
          onToggleComparison={handleToggleComparison}
          fromYear={fromYear}
          toYear={toYear}
        />
      </div>
    </div>
  );
}
