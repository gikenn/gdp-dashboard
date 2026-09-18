import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CountryData } from '../types';
import { COUNTRY_METADATA, CapitalCityInfo } from '../data/countryMetadata';
import { CONTINENT_POLYGONS } from '../data/continentOutlines';
import { Play, Pause, Compass, RotateCcw, Info } from 'lucide-react';

interface AnimatedGlobeProps {
  countries: CountryData[];
  selectedCountryCode: string | null;
  onSelectCountry: (countryCode: string) => void;
  targetYear?: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  visible: boolean;
  scale: number;
}

function projectOrthographic(
  lng: number,
  lat: number,
  centerLng: number,
  centerLat: number,
  radius: number,
  cx: number,
  cy: number
): ProjectedPoint {
  const toRad = Math.PI / 180;
  const phi = lat * toRad;
  const lambda = lng * toRad;
  const phi0 = centerLat * toRad;
  const lambda0 = centerLng * toRad;

  const deltaLambda = lambda - lambda0;

  // cos(c) = sin(phi0)*sin(phi) + cos(phi0)*cos(phi)*cos(deltaLambda)
  const cosC =
    Math.sin(phi0) * Math.sin(phi) +
    Math.cos(phi0) * Math.cos(phi) * Math.cos(deltaLambda);

  const visible = cosC > 0;

  const x = cx + radius * Math.cos(phi) * Math.sin(deltaLambda);
  const y =
    cy -
    radius *
      (Math.cos(phi0) * Math.sin(phi) -
        Math.sin(phi0) * Math.cos(phi) * Math.cos(deltaLambda));

  return { x, y, visible, scale: cosC };
}

export const AnimatedGlobe: React.FC<AnimatedGlobeProps> = ({
  countries,
  selectedCountryCode,
  onSelectCountry,
  targetYear = 2022,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Rotation state: lambda0 (longitude) and phi0 (latitude) in degrees
  const [centerLng, setCenterLng] = useState<number>(10);
  const [centerLat, setCenterLat] = useState<number>(20);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [hoveredCapital, setHoveredCapital] = useState<{
    meta: CapitalCityInfo;
    gdp: number | null;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Drag interaction refs
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const centerLngRef = useRef(centerLng);
  const centerLatRef = useRef(centerLat);
  const targetRotationRef = useRef<{ lng: number; lat: number } | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    centerLngRef.current = centerLng;
  }, [centerLng]);
  useEffect(() => {
    centerLatRef.current = centerLat;
  }, [centerLat]);

  // If a country is selected externally, smoothly rotate to it
  useEffect(() => {
    if (selectedCountryCode && COUNTRY_METADATA[selectedCountryCode]) {
      const meta = COUNTRY_METADATA[selectedCountryCode];
      targetRotationRef.current = { lng: meta.lng, lat: meta.lat };
    }
  }, [selectedCountryCode]);

  // Country lookup map for latest GDP
  const countryGdpMap = useRef(new Map<string, number | null>());
  useEffect(() => {
    const map = new Map<string, number | null>();
    for (const c of countries) {
      map.set(c.countryCode, c.gdpByYear[targetYear] ?? null);
    }
    countryGdpMap.current = map;
  }, [countries, targetYear]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let pulseTime = 0;

    const render = () => {
      pulseTime += 0.03;

      // Handle smooth interpolation to target rotation if any
      if (targetRotationRef.current) {
        let diffLng = targetRotationRef.current.lng - centerLngRef.current;
        // Normalize angle wrap-around
        while (diffLng > 180) diffLng -= 360;
        while (diffLng < -180) diffLng += 360;

        const diffLat = targetRotationRef.current.lat - centerLatRef.current;

        if (Math.abs(diffLng) > 0.4 || Math.abs(diffLat) > 0.4) {
          centerLngRef.current += diffLng * 0.08;
          centerLatRef.current += diffLat * 0.08;
          setCenterLng(centerLngRef.current);
          setCenterLat(centerLatRef.current);
        } else {
          targetRotationRef.current = null;
        }
      } else if (isRotating && !isDraggingRef.current) {
        centerLngRef.current = (centerLngRef.current + 0.25) % 360;
        setCenterLng(centerLngRef.current);
      }

      const curLng = centerLngRef.current;
      const curLat = centerLatRef.current;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(cx, cy) - 32;

      ctx.clearRect(0, 0, width, height);

      // 1. Subtle ambient outer atmospheric glow (warm light amber / terracotta)
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.25);
      glowGrad.addColorStop(0, 'rgba(234, 179, 8, 0.12)');
      glowGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.05)');
      glowGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // 2. Base Sphere (Ocean) with delicate warm ivory/cream gradient & subtle specular light
      const oceanGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      oceanGrad.addColorStop(0, '#fbf9f4'); // high light warm cream
      oceanGrad.addColorStop(0.5, '#f4ece1'); // soft warm parchment ocean
      oceanGrad.addColorStop(0.85, '#ebe0d0'); // rim darkening
      oceanGrad.addColorStop(1, '#d8cbba'); // edge rim shadow

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // 3. Graticule lines (latitude & longitude grid)
      ctx.strokeStyle = 'rgba(180, 160, 140, 0.22)';
      ctx.lineWidth = 1;

      // Parallels (latitude)
      const latGrid = [-60, -30, 0, 30, 60];
      for (const lat of latGrid) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 4) {
          const pt = projectOrthographic(lng, lat, curLng, curLat, radius, cx, cy);
          if (pt.visible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Meridians (longitude)
      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const pt = projectOrthographic(lng, lat, curLng, curLat, radius, cx, cy);
          if (pt.visible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // 4. Draw continents (warm clay / terracotta beige tones with soft border)
      ctx.fillStyle = '#dfd3c3';
      ctx.strokeStyle = '#c6b49e';
      ctx.lineWidth = 1.2;

      for (const poly of CONTINENT_POLYGONS) {
        ctx.beginPath();
        let first = true;
        let anyVisible = false;

        for (const [lng, lat] of poly.points) {
          const pt = projectOrthographic(lng, lat, curLng, curLat, radius, cx, cy);
          if (pt.visible) {
            anyVisible = true;
            if (first) {
              ctx.moveTo(pt.x, pt.y);
              first = false;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }

        if (anyVisible) {
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // 5. Draw Capital Cities with GDP markers
      const capitalEntries = Object.values(COUNTRY_METADATA);

      for (const meta of capitalEntries) {
        const pt = projectOrthographic(meta.lng, meta.lat, curLng, curLat, radius, cx, cy);
        if (!pt.visible) continue;

        const isSelected = selectedCountryCode === meta.code;
        const isHovered = hoveredCapital?.meta.code === meta.code;
        const gdpVal = countryGdpMap.current.get(meta.code) ?? 0;

        // Size scaled with economic scale
        let dotRadius = 3.5;
        if (gdpVal && gdpVal > 1e12) dotRadius = 5;
        if (gdpVal && gdpVal > 5e12) dotRadius = 6.5;

        // Visual distinction for selected / hovered / major economies
        if (isSelected) {
          // Pulsing focus ring
          const pulse = (Math.sin(pulseTime * 3) + 1) * 4;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotRadius + 7 + pulse, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(194, 65, 12, 0.45)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotRadius + 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ea580c';
          ctx.fill();
        } else if (isHovered) {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotRadius + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(234, 88, 12, 0.3)';
          ctx.fill();
        }

        // Inner marker dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotRadius, 0, Math.PI * 2);
        if (isSelected) {
          ctx.fillStyle = '#ffffff';
        } else if (isHovered) {
          ctx.fillStyle = '#ea580c';
        } else if (gdpVal && gdpVal > 2e12) {
          ctx.fillStyle = '#c2410c'; // rich terracotta for major economies
        } else {
          ctx.fillStyle = '#78716c'; // warm stone for others
        }
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#9a3412' : '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Label for hovered or selected
        if (isSelected || isHovered) {
          ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#1c1917';
          const text = `${meta.capital} (${meta.flag})`;
          const textWidth = ctx.measureText(text).width;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(pt.x + 8, pt.y - 14, textWidth + 8, 18);
          ctx.strokeStyle = '#e7e0d3';
          ctx.strokeRect(pt.x + 8, pt.y - 14, textWidth + 8, 18);

          ctx.fillStyle = '#1c1917';
          ctx.fillText(text, pt.x + 12, pt.y - 1);
        }
      }

      // Edge shadow vignette on the globe sphere for realistic 3D sphere volume
      const edgeShadow = ctx.createRadialGradient(
        cx - radius * 0.15,
        cy - radius * 0.15,
        radius * 0.7,
        cx,
        cy,
        radius
      );
      edgeShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      edgeShadow.addColorStop(0.8, 'rgba(60, 45, 30, 0.08)');
      edgeShadow.addColorStop(1, 'rgba(60, 45, 30, 0.28)');
      ctx.fillStyle = edgeShadow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer rim ring
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#d3c4b0';
      ctx.lineWidth = 2;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRotating, selectedCountryCode, hoveredCapital]);

  // Mouse & Touch interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    targetRotationRef.current = null; // stop any ongoing auto-alignment
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

      if (isDraggingRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        centerLngRef.current = (centerLngRef.current - dx * 0.5 + 360) % 360;
        centerLatRef.current = Math.max(-80, Math.min(80, centerLatRef.current + dy * 0.5));
        setCenterLng(centerLngRef.current);
        setCenterLat(centerLatRef.current);
        return;
      }

      // Check hit test for capital cities
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) - 32;

      let found: {
        meta: CapitalCityInfo;
        gdp: number | null;
        screenX: number;
        screenY: number;
      } | null = null;

      let minDistance = 14; // pixels hit tolerance

      for (const meta of Object.values(COUNTRY_METADATA)) {
        const pt = projectOrthographic(
          meta.lng,
          meta.lat,
          centerLngRef.current,
          centerLatRef.current,
          radius,
          cx,
          cy
        );

        if (!pt.visible) continue;

        const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
        if (dist < minDistance) {
          minDistance = dist;
          found = {
            meta,
            gdp: countryGdpMap.current.get(meta.code) ?? null,
            screenX: e.clientX,
            screenY: e.clientY,
          };
        }
      }

      setHoveredCapital(found);
    },
    []
  );

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredCapital) {
      onSelectCountry(hoveredCapital.meta.code);
    }
  };

  const rotateTo = (lng: number, lat: number) => {
    targetRotationRef.current = { lng, lat };
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full" id="animated-globe-wrapper">
      {/* Globe Container Card */}
      <div className="relative flex items-center justify-center p-2 sm:p-4">
        <canvas
          ref={canvasRef}
          width={440}
          height={440}
          className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          id="globe-canvas"
        />

        {/* Floating Tooltip when hovering over a capital city */}
        {hoveredCapital && (
          <div
            className="absolute z-20 pointer-events-none bg-stone-900/90 backdrop-blur-md text-white px-3 py-2 rounded-lg shadow-xl border border-stone-700 text-xs transition-opacity duration-150 -translate-x-1/2 -translate-y-full"
            style={{
              left: `${hoveredCapital.screenX}px`,
              top: `${hoveredCapital.screenY}px`,
              position: 'fixed',
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-sm text-amber-300">
              <span>{hoveredCapital.meta.flag}</span>
              <span>{hoveredCapital.meta.capital}</span>
            </div>
            <div className="text-stone-300 font-medium">
              {hoveredCapital.meta.countryName} ({hoveredCapital.meta.code})
            </div>
            {hoveredCapital.gdp ? (
              <div className="text-stone-200 mt-1 font-mono">
                GDP (2022): ${(hoveredCapital.gdp / 1e12 >= 1
                  ? `${(hoveredCapital.gdp / 1e12).toFixed(2)}T`
                  : `${(hoveredCapital.gdp / 1e9).toFixed(1)}B`)}
              </div>
            ) : null}
            <div className="text-[10px] text-amber-400 mt-1 font-semibold flex items-center gap-1">
              <span>Click to view full GDP rundown →</span>
            </div>
          </div>
        )}
      </div>

      {/* Globe Interaction Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-xs text-stone-600 bg-amber-50/80 border border-amber-200/60 px-4 py-2 rounded-full shadow-sm">
        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 text-stone-800 font-medium shadow-xs border border-stone-200 transition-colors"
          title={isRotating ? 'Pause rotation' : 'Start rotation'}
        >
          {isRotating ? (
            <>
              <Pause className="w-3 h-3 text-stone-600" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-stone-600" />
              Spin
            </>
          )}
        </button>

        <span className="hidden sm:inline text-stone-300">|</span>

        <span className="text-stone-500 hidden sm:inline">Regions:</span>
        <button
          type="button"
          onClick={() => rotateTo(-100, 25)}
          className="px-2 py-0.5 rounded-full hover:bg-white text-stone-700 font-medium transition-colors"
        >
          Americas
        </button>
        <button
          type="button"
          onClick={() => rotateTo(15, 30)}
          className="px-2 py-0.5 rounded-full hover:bg-white text-stone-700 font-medium transition-colors"
        >
          EMEA
        </button>
        <button
          type="button"
          onClick={() => rotateTo(115, 20)}
          className="px-2 py-0.5 rounded-full hover:bg-white text-stone-700 font-medium transition-colors"
        >
          Asia-Pacific
        </button>

        <span className="hidden sm:inline text-stone-300">|</span>

        <div className="flex items-center gap-1 text-[11px] text-stone-500">
          <Info className="w-3 h-3 text-amber-700" />
          <span>Click any capital city dot to inspect nation</span>
        </div>
      </div>
    </div>
  );
};
