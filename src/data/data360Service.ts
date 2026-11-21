import { Data360CountryAnalytics, Data360IndicatorMetadata } from '../types';

const DATA360_BASE_URL = 'https://data360api.worldbank.org/data360/data';
const DATA360_METADATA_URL = 'https://data360api.worldbank.org/data360/metadata';

export const DATA360_INDICATORS = {
  GDP_USD: 'WB_WDI_NY_GDP_MKTP_CD',
  POPULATION: 'WB_WDI_SP_POP_TOTL',
  GDP_PER_CAPITA: 'WB_WDI_NY_GDP_PCAP_CD',
  GDP_GROWTH_PCT: 'WB_WDI_NY_GDP_MKTP_KD_ZG',
} as const;

interface Data360Observation {
  OBS_VALUE?: string | number | null;
  TIME_PERIOD?: string | number | null;
}

interface Data360Response {
  count?: number;
  value?: Data360Observation[];
}

interface Data360MetadataSource {
  organization?: string | null;
  name?: string | null;
}

interface Data360MetadataEntry {
  series_description?: {
    idno?: string | null;
    name?: string | null;
    measurement_unit?: string | null;
    definition_short?: string | null;
    definition_long?: string | null;
    sources?: Data360MetadataSource[] | null;
  };
}

interface Data360MetadataResponse {
  value?: Data360MetadataEntry[];
}

const analyticsCache = new Map<string, Data360CountryAnalytics>();
const inFlightRequests = new Map<string, Promise<Data360CountryAnalytics | null>>();

let metadataCache: Record<string, Data360IndicatorMetadata> | null = null;
let metadataInFlight: Promise<Record<string, Data360IndicatorMetadata>> | null = null;

function parseSeriesByYear(rows: Data360Observation[] | undefined): Record<number, number> {
  const result: Record<number, number> = {};
  if (!Array.isArray(rows)) return result;

  for (const row of rows) {
    const year = Number(row.TIME_PERIOD);
    const val = Number(row.OBS_VALUE);
    if (!Number.isInteger(year) || year < 1950 || year > 2100 || !Number.isFinite(val)) {
      continue;
    }
    result[year] = val;
  }
  return result;
}

function getLatestEntry(series: Record<number, number>): { year: number; value: number } | null {
  const years = Object.keys(series)
    .map(Number)
    .sort((a, b) => b - a);
  if (years.length === 0) return null;
  const latestYear = years[0];
  return { year: latestYear, value: series[latestYear] };
}

async function fetchIndicatorSeries(
  indicator: string,
  countryCode: string
): Promise<Record<number, number>> {
  const params = new URLSearchParams({
    DATABASE_ID: 'WB_WDI',
    INDICATOR: indicator,
    REF_AREA: countryCode,
    skip: '0',
  });

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(`${DATA360_BASE_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return {};
    const json = (await res.json()) as Data360Response;
    return parseSeriesByYear(json.value);
  } catch {
    return {};
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getCachedData360Analytics(
  countryCode: string
): Data360CountryAnalytics | undefined {
  return analyticsCache.get(countryCode.toUpperCase());
}

export function getCachedData360Metadata(): Record<string, Data360IndicatorMetadata> | null {
  return metadataCache;
}

export async function fetchData360IndicatorMetadata(): Promise<
  Record<string, Data360IndicatorMetadata>
> {
  if (metadataCache) return metadataCache;
  if (metadataInFlight) return metadataInFlight;

  const ids = Object.values(DATA360_INDICATORS);
  const filterExpr = ids.map((id) => `series_description/idno eq '${id}'`).join(' or ');
  const selectFields = [
    'series_description/idno',
    'series_description/name',
    'series_description/measurement_unit',
    'series_description/definition_short',
    'series_description/definition_long',
    'series_description/sources',
  ].join(',');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);

  metadataInFlight = (async () => {
    try {
      const res = await fetch(DATA360_METADATA_URL, {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `&$filter=${filterExpr}&$select=${selectFields}`,
        }),
        signal: controller.signal,
      });

      if (!res.ok) return {};
      const json = (await res.json()) as Data360MetadataResponse;
      const parsed: Record<string, Data360IndicatorMetadata> = {};

      for (const entry of json.value || []) {
        const desc = entry.series_description;
        if (!desc?.idno) continue;
        const uniqueSources = Array.from(
          new Set(
            (desc.sources || [])
              .map((s) => (s.organization || s.name || '').trim())
              .filter(Boolean)
          )
        );

        parsed[desc.idno] = {
          idno: desc.idno,
          name: desc.name || desc.idno,
          measurementUnit: desc.measurement_unit ?? null,
          definition: desc.definition_long || desc.definition_short || null,
          sources: uniqueSources,
        };
      }

      if (Object.keys(parsed).length > 0) {
        metadataCache = parsed;
      }
      return parsed;
    } catch {
      return {};
    } finally {
      window.clearTimeout(timeout);
      metadataInFlight = null;
    }
  })();

  return metadataInFlight;
}

export async function fetchData360CountryAnalytics(
  countryCode: string
): Promise<Data360CountryAnalytics | null> {
  const code = countryCode.trim().toUpperCase();
  if (!code) return null;

  const cached = analyticsCache.get(code);
  if (cached) return cached;

  const existingPromise = inFlightRequests.get(code);
  if (existingPromise) return existingPromise;

  const requestPromise = (async (): Promise<Data360CountryAnalytics | null> => {
    try {
      const [gdpByYear, populationByYear, gdpPerCapitaByYear, annualGrowthByYear] =
        await Promise.all([
          fetchIndicatorSeries(DATA360_INDICATORS.GDP_USD, code),
          fetchIndicatorSeries(DATA360_INDICATORS.POPULATION, code),
          fetchIndicatorSeries(DATA360_INDICATORS.GDP_PER_CAPITA, code),
          fetchIndicatorSeries(DATA360_INDICATORS.GDP_GROWTH_PCT, code),
        ]);

      const hasAnyData =
        Object.keys(gdpByYear).length > 0 ||
        Object.keys(populationByYear).length > 0 ||
        Object.keys(gdpPerCapitaByYear).length > 0 ||
        Object.keys(annualGrowthByYear).length > 0;

      if (!hasAnyData) return null;

      const latestGdp = getLatestEntry(gdpByYear);
      const analytics: Data360CountryAnalytics = {
        countryCode: code,
        latestYear: latestGdp?.year ?? null,
        latestGdpUsd: latestGdp?.value ?? null,
        populationLatest: getLatestEntry(populationByYear),
        gdpPerCapitaLatest: getLatestEntry(gdpPerCapitaByYear),
        annualGrowthLatest: getLatestEntry(annualGrowthByYear),
        gdpByYear,
        gdpPerCapitaByYear,
        populationByYear,
        annualGrowthByYear,
      };

      analyticsCache.set(code, analytics);
      return analytics;
    } finally {
      inFlightRequests.delete(code);
    }
  })();

  inFlightRequests.set(code, requestPromise);
  return requestPromise;
}
