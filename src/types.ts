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
  peakGdp: { year: number; value: number } | null;
  cagr: number | null;
  growthMultiple: number | null;
  forecast?: WorldBankForecastItem;
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
