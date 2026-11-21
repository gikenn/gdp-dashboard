import React, { useEffect, useRef, useState } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4maps from '@amcharts/amcharts4/maps';
import am4geodata_worldLow from '@amcharts/amcharts4-geodata/worldLow';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import { CountryData } from '../types';
import { COUNTRY_METADATA } from '../data/countryMetadata';
import { ISO2_TO_ISO3, ISO3_TO_ISO2 } from '../data/isoCodeMap';
import { Play, Pause, Info } from 'lucide-react';
import { GlassBox } from './GlassBox';

interface AnimatedGlobeProps {
  countries: CountryData[];
  selectedCountryCode: string | null;
  onSelectCountry: (countryCode: string) => void;
  targetYear?: number;
}

function formatGdpCompact(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return 'No data';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${Math.round(val).toLocaleString('en-US')}`;
}

export const AnimatedGlobe: React.FC<AnimatedGlobeProps> = ({
  countries,
  selectedCountryCode,
  onSelectCountry,
  targetYear = 2022,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<am4maps.MapChart | null>(null);
  const polygonSeriesRef = useRef<am4maps.MapPolygonSeries | null>(null);
  const imageSeriesRef = useRef<am4maps.MapImageSeries | null>(null);
  const spinAnimRef = useRef<am4core.Animation | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [isRotating, setIsRotating] = useState<boolean>(!prefersReducedMotion);
  const isRotatingRef = useRef<boolean>(isRotating);
  const onSelectCountryRef = useRef(onSelectCountry);

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    onSelectCountryRef.current = onSelectCountry;
  }, [onSelectCountry]);

  // Build quick lookup from ISO-3 code -> CountryData
  const countryByIso3Ref = useRef<Map<string, CountryData>>(new Map());
  useEffect(() => {
    const map = new Map<string, CountryData>();
    for (const c of countries) {
      map.set(c.countryCode, c);
    }
    countryByIso3Ref.current = map;
  }, [countries]);

  // Helper to start/restart smooth longitudinal spin animation
  const startSpinAnimation = (chart: am4maps.MapChart) => {
    if (spinAnimRef.current) {
      spinAnimRef.current.stop();
      spinAnimRef.current = null;
    }
    if (!isRotatingRef.current) return;

    const anim = chart.animate(
      { property: 'deltaLongitude', to: chart.deltaLongitude + 360 },
      72000,
      am4core.ease.linear
    );
    anim.events.on('animationended', () => {
      if (isRotatingRef.current && chartRef.current && !chartRef.current.isDisposed()) {
        startSpinAnimation(chartRef.current);
      }
    });
    spinAnimRef.current = anim;
  };

  // Initialize amCharts 4 Orthographic Spinning Globe
  useEffect(() => {
    if (!chartContainerRef.current) return;

    am4core.useTheme(am4themes_animated);

    const chart = am4core.create(chartContainerRef.current, am4maps.MapChart);
    chartRef.current = chart;

    // Set map definition & Orthographic projection
    chart.geodata = am4geodata_worldLow;
    chart.projection = new am4maps.projections.Orthographic();
    chart.panBehavior = 'rotateLongLat';
    chart.deltaLatitude = -20;
    chart.deltaLongitude = -10;
    chart.padding(20, 20, 20, 20);

    // Sphere ocean background matching amCharts setup
    chart.backgroundSeries.mapPolygons.template.polygon.fillOpacity = 0.1;
    chart.backgroundSeries.mapPolygons.template.polygon.fill = am4core.color('#ffffff');

    // Create map polygon series
    const polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.useGeodata = true;
    polygonSeriesRef.current = polygonSeries;

    const polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.tooltipText = '{name}';
    polygonTemplate.fill = am4core.color('#FF6633');
    polygonTemplate.stroke = am4core.color('#000033');
    polygonTemplate.strokeWidth = 0.5;
    polygonTemplate.cursorOverStyle = am4core.MouseCursorStyle.pointer;

    // Hover state
    const hs = polygonTemplate.states.create('hover');
    hs.properties.fill = am4core.color('#cc3d0e');

    // Active / selected state
    const activeState = polygonTemplate.states.create('active');
    activeState.properties.fill = am4core.color('#fbbf24');

    // Clicking a nation opens the sliding rundown panel if present in dataset
    polygonTemplate.events.on('hit', (ev) => {
      const ctx = ev.target.dataItem?.dataContext as { id?: string; name?: string } | undefined;
      if (!ctx) return;
      const iso3 = ctx.id ? ISO2_TO_ISO3[ctx.id] : undefined;
      if (iso3 && (countryByIso3Ref.current.has(iso3) || COUNTRY_METADATA[iso3])) {
        onSelectCountryRef.current(iso3);
      } else if (ctx.name) {
        const lower = ctx.name.toLowerCase();
        for (const c of countryByIso3Ref.current.values()) {
          if (c.countryName.toLowerCase() === lower) {
            onSelectCountryRef.current(c.countryCode);
            break;
          }
        }
      }
    });

    // Graticule lines
    const graticuleSeries = chart.series.push(new am4maps.GraticuleSeries());
    graticuleSeries.mapLines.template.line.stroke = am4core.color('#ffffff');
    graticuleSeries.mapLines.template.line.strokeOpacity = 0.08;
    graticuleSeries.fitExtent = false;

    // Capital cities pin layer (MapImageSeries)
    const imageSeries = chart.series.push(new am4maps.MapImageSeries());
    imageSeriesRef.current = imageSeries;

    const imageTemplate = imageSeries.mapImages.template;
    imageTemplate.propertyFields.latitude = 'latitude';
    imageTemplate.propertyFields.longitude = 'longitude';
    imageTemplate.nonScaling = true;
    imageTemplate.cursorOverStyle = am4core.MouseCursorStyle.pointer;

    const circle = imageTemplate.createChild(am4core.Circle);
    circle.radius = 4;
    circle.fill = am4core.color('#f1faee');
    circle.stroke = am4core.color('#000033');
    circle.strokeWidth = 1.5;
    circle.tooltipText = '{capital} · {countryName} ({gdpLabel})';

    const circleHover = circle.states.create('hover');
    circleHover.properties.scale = 1.6;
    circleHover.properties.fill = am4core.color('#fde047');

    imageTemplate.events.on('hit', (ev) => {
      const data = ev.target.dataItem?.dataContext as { code?: string } | undefined;
      if (data?.code) {
        onSelectCountryRef.current(data.code);
      }
    });

    // Pause spin while user drags the globe, resume smoothly on release if spinning
    chart.seriesContainer.events.on('down', () => {
      if (spinAnimRef.current) {
        spinAnimRef.current.stop();
        spinAnimRef.current = null;
      }
    });
    chart.seriesContainer.events.on('up', () => {
      if (isRotatingRef.current && !chart.isDisposed()) {
        startSpinAnimation(chart);
      }
    });

    // Start spinning after brief settle
    const timer = window.setTimeout(() => {
      if (isRotatingRef.current && !chart.isDisposed()) {
        startSpinAnimation(chart);
      }
    }, 600);

    return () => {
      window.clearTimeout(timer);
      if (spinAnimRef.current) {
        spinAnimRef.current.stop();
        spinAnimRef.current = null;
      }
      chart.dispose();
      chartRef.current = null;
      polygonSeriesRef.current = null;
      imageSeriesRef.current = null;
    };
  }, []);

  // Sync capital city markers and polygon tooltips whenever countries or targetYear updates
  useEffect(() => {
    const imageSeries = imageSeriesRef.current;
    const polygonSeries = polygonSeriesRef.current;
    if (!imageSeries || !polygonSeries) return;

    const capitalData = Object.values(COUNTRY_METADATA).map((meta) => {
      const country = countryByIso3Ref.current.get(meta.code);
      const gdpVal = country?.gdpByYear[targetYear] ?? null;
      return {
        code: meta.code,
        capital: meta.capital,
        countryName: meta.countryName,
        latitude: meta.lat,
        longitude: meta.lng,
        gdpLabel: formatGdpCompact(gdpVal),
      };
    });

    imageSeries.data = capitalData;

    // Update polygon tooltips dynamically with GDP for targetYear
    polygonSeries.events.once('datavalidated', () => {
      polygonSeries.mapPolygons.each((poly) => {
        const ctx = poly.dataItem?.dataContext as { id?: string; name?: string } | undefined;
        if (!ctx?.id) return;
        const iso3 = ISO2_TO_ISO3[ctx.id];
        const country = iso3 ? countryByIso3Ref.current.get(iso3) : undefined;
        if (country) {
          const gdp = country.gdpByYear[targetYear];
          poly.tooltipText = `{name}\nGDP (${targetYear}): ${formatGdpCompact(gdp)}`;
        } else {
          poly.tooltipText = '{name}';
        }
      });
    });

    // Also update already-validated polygons immediately
    polygonSeries.mapPolygons.each((poly) => {
      const ctx = poly.dataItem?.dataContext as { id?: string; name?: string } | undefined;
      if (!ctx?.id) return;
      const iso3 = ISO2_TO_ISO3[ctx.id];
      const country = iso3 ? countryByIso3Ref.current.get(iso3) : undefined;
      if (country) {
        const gdp = country.gdpByYear[targetYear];
        poly.tooltipText = `{name}\nGDP (${targetYear}): ${formatGdpCompact(gdp)}`;
      }
    });
  }, [countries, targetYear]);

  // Toggle spinning state via Play/Pause button
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || chart.isDisposed()) return;

    if (isRotating) {
      startSpinAnimation(chart);
    } else if (spinAnimRef.current) {
      spinAnimRef.current.stop();
      spinAnimRef.current = null;
    }
  }, [isRotating]);

  // Smoothly rotate globe to selected country & highlight its polygon
  useEffect(() => {
    const chart = chartRef.current;
    const polygonSeries = polygonSeriesRef.current;
    if (!chart || chart.isDisposed() || !polygonSeries) return;

    const targetIso2 = selectedCountryCode ? ISO3_TO_ISO2[selectedCountryCode] : null;
    polygonSeries.mapPolygons.each((poly) => {
      const ctx = poly.dataItem?.dataContext as { id?: string } | undefined;
      poly.isActive = Boolean(targetIso2 && ctx?.id === targetIso2);
    });

    if (selectedCountryCode && COUNTRY_METADATA[selectedCountryCode]) {
      const meta = COUNTRY_METADATA[selectedCountryCode];
      if (spinAnimRef.current) {
        spinAnimRef.current.stop();
        spinAnimRef.current = null;
      }

      const focusAnim = chart.animate(
        [
          { property: 'deltaLongitude', to: -meta.lng },
          { property: 'deltaLatitude', to: -meta.lat },
        ],
        900,
        am4core.ease.cubicOut
      );

      focusAnim.events.on('animationended', () => {
        if (isRotatingRef.current && !chart.isDisposed()) {
          startSpinAnimation(chart);
        }
      });
    }
  }, [selectedCountryCode]);

  const rotateTo = (lng: number, lat: number) => {
    const chart = chartRef.current;
    if (!chart || chart.isDisposed()) return;

    if (spinAnimRef.current) {
      spinAnimRef.current.stop();
      spinAnimRef.current = null;
    }

    const anim = chart.animate(
      [
        { property: 'deltaLongitude', to: -lng },
        { property: 'deltaLatitude', to: -lat },
      ],
      850,
      am4core.ease.cubicOut
    );

    anim.events.on('animationended', () => {
      if (isRotatingRef.current && !chart.isDisposed()) {
        startSpinAnimation(chart);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full" id="animated-globe-wrapper">
      {/* amCharts 4 Orthographic Globe Container */}
      <div className="w-full rounded-2xl overflow-hidden border border-[#1d3557]/30 shadow-md bg-[#000033] my-2">
        <div
          id="chartdiv"
          ref={chartContainerRef}
          className="w-full h-[380px] sm:h-[460px] max-w-full"
          style={{ backgroundColor: '#000033' }}
        />
      </div>

      {/* Globe Interaction Bar */}
      <GlassBox className="mt-2 w-full" contentClassName="flex-row! flex-wrap items-center justify-center gap-2 text-xs text-slate-200 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#e63946] hover:bg-[#ff4d5a] text-white font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title={isRotating ? 'Pause rotation' : 'Start rotation'}
        >
          {isRotating ? (
            <>
              <Pause className="w-3 h-3" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Spin
            </>
          )}
        </button>

        <span className="hidden sm:inline text-white/25">|</span>

        <span className="text-slate-300 hidden sm:inline">Regions:</span>
        <button
          type="button"
          onClick={() => rotateTo(-95, 22)}
          className="px-2.5 py-1 rounded-lg hover:bg-white/20 text-white font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Americas
        </button>
        <button
          type="button"
          onClick={() => rotateTo(15, 25)}
          className="px-2.5 py-1 rounded-lg hover:bg-white/20 text-white font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          EMEA
        </button>
        <button
          type="button"
          onClick={() => rotateTo(108, 18)}
          className="px-2.5 py-1 rounded-lg hover:bg-white/20 text-white font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Asia-Pacific
        </button>

        <span className="hidden sm:inline text-white/25">|</span>

        <div className="flex items-center gap-1.5 text-[11px] text-[#a8dadc]">
          <Info className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Click any nation or capital city dot to inspect GDP</span>
        </div>
      </GlassBox>
    </div>
  );
};
