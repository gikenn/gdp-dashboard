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
import { Footer } from './components/Footer';
import { AuroraBackground } from './components/AuroraBackground';
import { CurrencyMatrixRain } from './components/CurrencyMatrixRain';
import { LensSvgFilter } from './components/GlassBox';
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

  const handleResetView = () => {
    setFromYear(MIN_YEAR);
    setToYear(MAX_YEAR);
    setSelectedCountries(DEFAULT_SELECTED_COUNTRIES);
    setChartMode('raw');
    setInspectedCountryCode(null);
    setIsSlidingPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 p-4 sm:p-8 selection:bg-amber-300 selection:text-[#1d3557] relative" id="app-root">
      {/* Global SVG displacement filter for Liquid Glass containers */}
      <LensSvgFilter />

      {/* Layer 0: Text-free animated Aurora background */}
      <AuroraBackground />

      {/* Layer 1: World Currency Matrix shower running cleanly above Aurora */}
      <CurrencyMatrixRain />

      {/* Layer 10: Main Dashboard Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        <Header onResetView={handleResetView} />

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

        <Footer />
      </div>
    </div>
  );
}
