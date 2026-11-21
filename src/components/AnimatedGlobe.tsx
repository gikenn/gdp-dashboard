import React, { useEffect, useRef, useState } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4maps from '@amcharts/amcharts4/maps';
import am4geodata_worldLow from '@amcharts/amcharts4-geodata/worldLow';
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
  const focusAnimRef = useRef<am4core.Animation | null>(null);
  const chartReadyRef = useRef<boolean>(false);
  const activeIso2Ref = useRef<string | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [isRotating, setIsRotating] = useState<boolean>(!prefersReducedMotion);
  const isRotatingRef = useRef<boolean>(isRotating);
  const onSelectCountryRef = useRef(onSelectCountry);
  const targetYearRef = useRef<number>(targetYear);

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    onSelectCountryRef.current = onSelectCountry;
  }, [onSelectCountry]);

  useEffect(() => {
    targetYearRef.current = targetYear;
  }, [targetYear]);

  // Build quick lookup from ISO-3 code -> CountryData
  const countryByIso3Ref = useRef<Map<string, CountryData>>(new Map());
  useEffect(() => {
    const map = new Map<string, CountryData>();
    for (const c of countries) {
      map.set(c.countryCode, c);
    }
    countryByIso3Ref.current = map;
  }, [countries]);

  const stopAllAnimations = () => {
    if (spinAnimRef.current) {
      spinAnimRef.current.stop();
      spinAnimRef.current = null;
    }
    if (focusAnimRef.current) {
      focusAnimRef.current.stop();
      focusAnimRef.current = null;
    }
  };

  // Single authoritative spin starter (always stops conflicting spin/focus animations first)
  const startSpinAnimation = (chart: am4maps.MapChart) => {
    if (chart.isDisposed() || !isRotatingRef.current) return;
    stopAllAnimations();

    const anim = chart.animate(
      { property: 'deltaLongitude', to: chart.deltaLongitude + 360 },
      72000,
      am4core.ease.linear
    );
    anim.events.on('animationended', () => {
      if (spinAnimRef.current === anim) {
        spinAnimRef.current = null;
      }
      if (isRotatingRef.current && chartRef.current && !chartRef.current.isDisposed()) {
        startSpinAnimation(chartRef.current);
      }
    });
    spinAnimRef.current = anim;
  };

  // Initialize amCharts 4 Orthographic Spinning Globe once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartReadyRef.current = false;
    activeIso2Ref.current = null;

    // Deliberately avoid global am4themes_animated here so polygons and 216 capital markers
    // never flash/fade during continuous orthographic rotation or StrictMode remounts.
    const chart = am4core.create(chartContainerRef.current, am4maps.MapChart);
    chartRef.current = chart;

    chart.geodata = am4geodata_worldLow;
    chart.projection = new am4maps.projections.Orthographic();
    chart.panBehavior = 'rotateLongLat';
    chart.deltaLatitude = -20;
    chart.deltaLongitude = -10;
    chart.padding(20, 20, 20, 20);
    chart.seriesContainer.draggable = true;

    // Sphere ocean background
    chart.backgroundSeries.mapPolygons.template.polygon.fillOpacity = 0.1;
    chart.backgroundSeries.mapPolygons.template.polygon.fill = am4core.color('#ffffff');

    // Create map polygon series
    const polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    polygonSeries.useGeodata = true;
    polygonSeries.interpolationDuration = 0;
    polygonSeriesRef.current = polygonSeries;

    const polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.fill = am4core.color('#FF6633');
    polygonTemplate.stroke = am4core.color('#000033');
    polygonTemplate.strokeWidth = 0.5;
    polygonTemplate.cursorOverStyle = am4core.MouseCursorStyle.pointer;
    polygonTemplate.defaultState.transitionDuration = 0;

    // Dynamic tooltip via adapter so targetYear changes never trigger polygon re-validation
    polygonTemplate.tooltipText = '{name}';
    polygonTemplate.adapter.add('tooltipText', (text, target) => {
      const ctx = target.dataItem?.dataContext as { id?: string; name?: string } | undefined;
      if (!ctx?.id) return text;
      const iso3 = ISO2_TO_ISO3[ctx.id];
      const country = iso3 ? countryByIso3Ref.current.get(iso3) : undefined;
      if (!country) return text;
      const yr = targetYearRef.current;
      return `{name}\nGDP (${yr}): ${formatGdpCompact(country.gdpByYear[yr])}`;
    });

    const hs = polygonTemplate.states.create('hover');
    hs.properties.fill = am4core.color('#cc3d0e');
    hs.transitionDuration = 120;

    const activeState = polygonTemplate.states.create('active');
    activeState.properties.fill = am4core.color('#fbbf24');
    activeState.transitionDuration = 120;

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

    // Capital cities pin layer (populated once; tooltip uses dynamic adapter)
    const imageSeries = chart.series.push(new am4maps.MapImageSeries());
    imageSeries.interpolationDuration = 0;
    imageSeriesRef.current = imageSeries;

    const imageTemplate = imageSeries.mapImages.template;
    imageTemplate.propertyFields.latitude = 'latitude';
    imageTemplate.propertyFields.longitude = 'longitude';
    imageTemplate.nonScaling = true;
    imageTemplate.cursorOverStyle = am4core.MouseCursorStyle.pointer;
    imageTemplate.defaultState.transitionDuration = 0;

    const circle = imageTemplate.createChild(am4core.Circle);
    circle.radius = 3.5;
    circle.fill = am4core.color('#f1faee');
    circle.stroke = am4core.color('#000033');
    circle.strokeWidth = 1.25;
    circle.defaultState.transitionDuration = 0;
    circle.tooltipText = '{capital} · {countryName}';
    circle.adapter.add('tooltipText', (_text, target) => {
      const data = target.dataItem?.dataContext as
        | { code?: string; capital?: string; countryName?: string }
        | undefined;
      if (!data?.code) return _text;
      const yr = targetYearRef.current;
      const gdpVal = countryByIso3Ref.current.get(data.code)?.gdpByYear[yr] ?? null;
      return `${data.capital} · ${data.countryName} (${formatGdpCompact(gdpVal)})`;
    });

    const circleHover = circle.states.create('hover');
    circleHover.properties.scale = 1.6;
    circleHover.properties.fill = am4core.color('#fde047');
    circleHover.transitionDuration = 100;

    imageTemplate.events.on('hit', (ev) => {
      const data = ev.target.dataItem?.dataContext as { code?: string } | undefined;
      if (data?.code) {
        onSelectCountryRef.current(data.code);
      }
    });

    imageSeries.data = Object.values(COUNTRY_METADATA).map((meta) => ({
      code: meta.code,
      capital: meta.capital,
      countryName: meta.countryName,
      latitude: meta.lat,
      longitude: meta.lng,
    }));

    // Pause spin while user drags the globe, resume smoothly on release if spinning
    chart.seriesContainer.events.on('down', () => {
      stopAllAnimations();
    });
    chart.seriesContainer.events.on('up', () => {
      if (isRotatingRef.current && !chart.isDisposed()) {
        startSpinAnimation(chart);
      }
    });

    // Start spin exactly once after geodata finishes validating (no competing timers)
    polygonSeries.events.once('datavalidated', () => {
      chartReadyRef.current = true;
      if (isRotatingRef.current && !chart.isDisposed()) {
        startSpinAnimation(chart);
      }
    });

    return () => {
      chartReadyRef.current = false;
      stopAllAnimations();
      chart.dispose();
      chartRef.current = null;
      polygonSeriesRef.current = null;
      imageSeriesRef.current = null;
    };
  }, []);

  // Toggle spinning state via Play/Pause button (wait until datavalidated on initial mount)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || chart.isDisposed() || !chartReadyRef.current) return;

    if (isRotating) {
      startSpinAnimation(chart);
    } else {
      stopAllAnimations();
    }
  }, [isRotating]);

  // Smoothly rotate globe to selected country & highlight its polygon
  useEffect(() => {
    const chart = chartRef.current;
    const polygonSeries = polygonSeriesRef.current;
    if (!chart || chart.isDisposed() || !polygonSeries) return;

    const targetIso2 = selectedCountryCode ? ISO3_TO_ISO2[selectedCountryCode] ?? null : null;
    if (activeIso2Ref.current !== targetIso2) {
      polygonSeries.mapPolygons.each((poly) => {
        const ctx = poly.dataItem?.dataContext as { id?: string } | undefined;
        const shouldBeActive = Boolean(targetIso2 && ctx?.id === targetIso2);
        if (poly.isActive !== shouldBeActive) {
          poly.isActive = shouldBeActive;
        }
      });
      activeIso2Ref.current = targetIso2;
    }

    if (selectedCountryCode && COUNTRY_METADATA[selectedCountryCode]) {
      const meta = COUNTRY_METADATA[selectedCountryCode];
      stopAllAnimations();

      const focusAnim = chart.animate(
        [
          { property: 'deltaLongitude', to: -meta.lng },
          { property: 'deltaLatitude', to: -meta.lat },
        ],
        850,
        am4core.ease.cubicOut
      );
      focusAnimRef.current = focusAnim;

      focusAnim.events.on('animationended', () => {
        if (focusAnimRef.current === focusAnim) {
          focusAnimRef.current = null;
        }
        if (isRotatingRef.current && !chart.isDisposed()) {
          startSpinAnimation(chart);
        }
      });
    }
  }, [selectedCountryCode]);

  const rotateTo = (lng: number, lat: number) => {
    const chart = chartRef.current;
    if (!chart || chart.isDisposed()) return;

    stopAllAnimations();

    const anim = chart.animate(
      [
        { property: 'deltaLongitude', to: -lng },
        { property: 'deltaLatitude', to: -lat },
      ],
      850,
      am4core.ease.cubicOut
    );
    focusAnimRef.current = anim;

    anim.events.on('animationended', () => {
      if (focusAnimRef.current === anim) {
        focusAnimRef.current = null;
      }
      if (isRotatingRef.current && !chart.isDisposed()) {
        startSpinAnimation(chart);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full" id="animated-globe-wrapper">
      {/* amCharts 4 Orthographic Globe Container (GPU-isolated to prevent backdrop compositor flicker) */}
      <div className="w-full rounded-2xl overflow-hidden border border-[#1d3557]/30 shadow-md bg-[#000033] my-2 isolate transform-gpu">
        <div
          id="chartdiv"
          ref={chartContainerRef}
          className="w-full h-[380px] sm:h-[460px] max-w-full transform-gpu"
          style={{ backgroundColor: '#000033' }}
        />
      </div>

      {/* Globe Interaction Bar */}
      <GlassBox
        disableLensFilter
        className="mt-2 w-full"
        contentClassName="flex-row! flex-wrap items-center justify-center gap-2 text-xs text-slate-200 px-4 py-2.5"
      >
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
