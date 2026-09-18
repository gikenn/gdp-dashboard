import Papa from 'papaparse';
import rawCsv from '../../data/gdp_data.csv?raw';
import { CountryData, MetricData, ChartMode, CountryRundown, WorldGdpOverview } from '../types';
import { COUNTRY_METADATA } from './countryMetadata';
import { getForecastForCountry } from './worldBankForecasts';

export const MIN_YEAR = 1960;
export const MAX_YEAR = 2022;
export const DEFAULT_SELECTED_COUNTRIES = ['USA', 'CHN', 'JPN', 'DEU', 'IND', 'GBR'];

let cachedCountries: CountryData[] | null = null;

export function loadGdpData(): CountryData[] {
  if (cachedCountries) {
    return cachedCountries;
  }

  const parseResult = Papa.parse<Record<string, string>>(rawCsv.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const countries: CountryData[] = [];

  for (const row of parseResult.data) {
    const countryCode = row['Country Code']?.trim();
    const countryName = row['Country Name']?.trim();

    if (!countryCode || !countryName) continue;

    const gdpByYear: Record<number, number | null> = {};

    for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
      const val = row[year.toString()];
      if (val !== undefined && val !== null && val.trim() !== '') {
        const num = parseFloat(val.trim());
        gdpByYear[year] = isNaN(num) ? null : num;
      } else {
        gdpByYear[year] = null;
      }
    }

    countries.push({
      countryCode,
      countryName,
      gdpByYear,
    });
  }

  cachedCountries = countries;
  return countries;
}

export function getChartData(
  selectedCountries: string[],
  fromYear: number,
  toYear: number,
  mode: ChartMode = 'raw'
): Array<Record<string, number | null>> {
  const allCountries = loadGdpData();
  const countryMap = new Map<string, CountryData>();
  for (const c of allCountries) {
    countryMap.set(c.countryCode, c);
  }

  const result: Array<Record<string, number | null>> = [];

  // Determine baseline GDP at fromYear for each selected country if mode is 'growth'
  const baselines = new Map<string, number | null>();
  if (mode === 'growth') {
    for (const code of selectedCountries) {
      const country = countryMap.get(code);
      const baseVal = country?.gdpByYear[fromYear] ?? null;
      baselines.set(code, baseVal != null && baseVal > 0 ? baseVal : null);
    }
  }

  for (let year = fromYear; year <= toYear; year++) {
    const point: Record<string, number | null> = { year };

    for (const code of selectedCountries) {
      const country = countryMap.get(code);
      const val = country?.gdpByYear[year] ?? null;

      if (mode === 'raw') {
        point[code] = val;
      } else {
        const base = baselines.get(code);
        if (base != null && val != null) {
          const pct = ((val - base) / base) * 100;
          point[code] = Math.round(pct * 100) / 100; // 2 decimal precision
        } else {
          point[code] = null;
        }
      }
    }

    result.push(point);
  }

  return result;
}

export function computeMetrics(
  selectedCountries: string[],
  fromYear: number,
  toYear: number
): MetricData[] {
  const allCountries = loadGdpData();
  const countryMap = new Map<string, CountryData>();
  for (const c of allCountries) {
    countryMap.set(c.countryCode, c);
  }

  const metrics: MetricData[] = [];

  for (const code of selectedCountries) {
    const country = countryMap.get(code);
    const countryName = country ? country.countryName : code;

    const rawFirstGdp = country?.gdpByYear[fromYear];
    const rawLastGdp = country?.gdpByYear[toYear];

    const firstGdp = rawFirstGdp != null ? rawFirstGdp / 1e9 : null;
    const lastGdp = rawLastGdp != null ? rawLastGdp / 1e9 : null;

    let growth = 'n/a';
    let growthPct: number | null = null;
    let deltaColor: 'normal' | 'off' = 'off';

    if (firstGdp != null && lastGdp != null && firstGdp > 0) {
      const factor = lastGdp / firstGdp;
      growth = `${factor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`;
      growthPct = ((lastGdp - firstGdp) / firstGdp) * 100;
      deltaColor = 'normal';
    }

    metrics.push({
      countryCode: code,
      countryName,
      firstGdp,
      lastGdp,
      growth,
      growthPct,
      deltaColor,
    });
  }

  return metrics;
}

let cachedOverview: WorldGdpOverview | null = null;

export function getWorldOverview(): WorldGdpOverview {
  if (cachedOverview) return cachedOverview;

  const allCountries = loadGdpData();

  // Find World entry or compute
  const worldEntry = allCountries.find((c) => c.countryCode === 'WLD');
  const worldTotal2022 = worldEntry?.gdpByYear[2022] ?? 101300000000000;
  const worldTotal1960 = worldEntry?.gdpByYear[1960] ?? 1380000000000;
  const worldGrowthMultiplier = worldTotal2022 / worldTotal1960;

  // Filter actual countries (identified in COUNTRY_METADATA) to avoid double counting regional aggregates
  const validCountries = allCountries
    .filter((c) => Boolean(COUNTRY_METADATA[c.countryCode]) && (c.gdpByYear[2022] ?? 0) > 0)
    .sort((a, b) => (b.gdpByYear[2022] ?? 0) - (a.gdpByYear[2022] ?? 0));

  const topHolders2022 = validCountries.slice(0, 10).map((c) => {
    const val = c.gdpByYear[2022]!;
    return {
      countryCode: c.countryCode,
      countryName: c.countryName,
      gdp2022: val,
      shareOfWorld: (val / worldTotal2022) * 100,
      flag: COUNTRY_METADATA[c.countryCode]?.flag,
    };
  });

  cachedOverview = {
    worldTotal2022,
    worldTotal1960,
    worldGrowthMultiplier,
    topHolders2022,
  };

  return cachedOverview;
}

export function getCountryRundown(
  countryCode: string,
  fromYear: number = MIN_YEAR,
  toYear: number = MAX_YEAR
): CountryRundown | null {
  const allCountries = loadGdpData();
  const country = allCountries.find((c) => c.countryCode === countryCode);
  if (!country) return null;

  const overview = getWorldOverview();
  const meta = COUNTRY_METADATA[countryCode];
  const latestGdp = country.gdpByYear[2022] ?? country.gdpByYear[toYear] ?? null;
  const startYearGdp = country.gdpByYear[fromYear] ?? null;

  // Global ranking in 2022 among countries
  const ranked = allCountries
    .filter((c) => Boolean(COUNTRY_METADATA[c.countryCode]) && (c.gdpByYear[2022] ?? 0) > 0)
    .sort((a, b) => (b.gdpByYear[2022] ?? 0) - (a.gdpByYear[2022] ?? 0));
  
  const rankIndex = ranked.findIndex((c) => c.countryCode === countryCode);
  const rank2022 = rankIndex >= 0 ? rankIndex + 1 : 999;
  const shareOfWorld2022 = latestGdp ? (latestGdp / overview.worldTotal2022) * 100 : 0;

  // Peak GDP in history
  let peakVal = 0;
  let peakYr = MIN_YEAR;
  for (let yr = MIN_YEAR; yr <= MAX_YEAR; yr++) {
    const v = country.gdpByYear[yr];
    if (v != null && v > peakVal) {
      peakVal = v;
      peakYr = yr;
    }
  }

  let growthMultiple: number | null = null;
  let cagr: number | null = null;
  if (startYearGdp && latestGdp && startYearGdp > 0) {
    growthMultiple = latestGdp / startYearGdp;
    const years = toYear - fromYear;
    if (years > 0) {
      cagr = (Math.pow(latestGdp / startYearGdp, 1 / years) - 1) * 100;
    }
  }

  const forecast = getForecastForCountry(countryCode);

  return {
    country,
    meta,
    latestGdp,
    rank2022,
    shareOfWorld2022,
    startYearGdp,
    peakGdp: peakVal > 0 ? { year: peakYr, value: peakVal } : null,
    cagr,
    growthMultiple,
    forecast,
  };
}
