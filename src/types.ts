import { CapitalCityInfo } from './data/countryMetadata';
import { WorldBankForecastItem } from './data/worldBankForecasts';

export interface CountryData {
  countryName: string;
  countryCode: string;
  gdpByYear: Record<number, number | null>;
}

export type ChartMode = 'raw' | 'growth';

export interface YearRange {
  fromYear: number;
  toYear: number;
}

export interface MetricData {
  countryCode: string;
  countryName: string;
  firstGdp: number | null; // in Billions
  lastGdp: number | null;  // in Billions
  effectiveFromYear?: number;
  growth: string;
  growthPct: number | null;
  deltaColor: 'normal' | 'off';
}

export interface CountryRundown {
  country: CountryData;
  meta?: CapitalCityInfo;
  latestGdp: number | null; // USD
  rank2022: number;
  shareOfWorld2022: number; // percentage (e.g. 25.1%)
  startYearGdp: number | null;
  effectiveStartYear: number;
  peakGdp: { year: number; value: number } | null;
  cagr: number | null;
  growthMultiple: number | null;
  forecast?: WorldBankForecastItem;
}

export interface Data360CountryAnalytics {
  countryCode: string;
  latestYear: number | null;
  latestGdpUsd: number | null;
  populationLatest: { year: number; value: number } | null;
  gdpPerCapitaLatest: { year: number; value: number } | null;
  annualGrowthLatest: { year: number; value: number } | null;
  gdpByYear: Record<number, number>;
  gdpPerCapitaByYear: Record<number, number>;
  populationByYear: Record<number, number>;
  annualGrowthByYear: Record<number, number>;
}

export interface Data360IndicatorMetadata {
  idno: string;
  name: string;
  measurementUnit: string | null;
  definition: string | null;
  sources: string[];
}

export interface WorldGdpOverview {
  worldTotal2022: number; // USD
  worldTotal1960: number; // USD
  worldGrowthMultiplier: number;
  topHolders2022: Array<{
    countryCode: string;
    countryName: string;
    gdp2022: number;
    shareOfWorld: number;
    flag?: string;
  }>;
}
