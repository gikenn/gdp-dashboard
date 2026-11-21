import React, { useEffect, useRef } from 'react';

interface WaveLayerConfig {
  id: string;
  zIndex: number;
  base: number;
  swing: number;
  speed: number;
  stepDeg: number;
  c1: string;
  c2: string;
}

interface ScanlineWavesProps {
  variant?: 'header' | 'footer';
  className?: string;
}

const COLUMN_COUNT = 40;

// Deterministic pseudo-random helper matching CodePen random(0.5, 0.9) and random(-5deg, 5deg)
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const COLUMN_JITTER = Array.from({ length: 4 }, (_, waveIdx) =>
  Array.from({ length: COLUMN_COUNT }, (_, colIdx) => {
    const s1 = seededUnit((waveIdx + 1) * 100 + colIdx);
    const s2 = seededUnit((waveIdx + 1) * 500 + colIdx * 7);
    return {
      amp: 0.5 + s1 * 0.4, // 0.5 .. 0.9
      offDeg: -5 + s2 * 10, // -5deg .. +5deg
    };
  })
);

const HEADER_LAYERS: WaveLayerConfig[] = [
  { id: 'w1', zIndex: 1, base: 44, swing: 6, speed: 1, stepDeg: 14, c1: 'var(--frosted-blue)', c2: 'var(--pacific-blue)' },
  { id: 'w2', zIndex: 2, base: 34, swing: 7, speed: -1, stepDeg: 18, c1: 'var(--pacific-blue)', c2: 'var(--cerulean)' },
  { id: 'w3', zIndex: 3, base: 24, swing: 8, speed: 2, stepDeg: 22, c1: 'var(--cerulean)', c2: 'var(--baltic-blue)' },
  { id: 'w4', zIndex: 4, base: 14, swing: 7, speed: -2, stepDeg: 26, c1: 'var(--baltic-blue)', c2: 'var(--oxford-navy)' },
];

const FOOTER_LAYERS: WaveLayerConfig[] = [
  { id: 'w1', zIndex: 1, base: 148, swing: 16, speed: 1, stepDeg: 14, c1: 'var(--frosted-blue)', c2: 'var(--pacific-blue)' },
  { id: 'w2', zIndex: 2, base: 120, swing: 18, speed: -1, stepDeg: 18, c1: 'var(--pacific-blue)', c2: 'var(--cerulean)' },
  { id: 'w3', zIndex: 3, base: 92, swing: 20, speed: 2, stepDeg: 22, c1: 'var(--cerulean)', c2: 'var(--baltic-blue)' },
  { id: 'w4', zIndex: 4, base: 64, swing: 18, speed: -2, stepDeg: 26, c1: 'var(--baltic-blue)', c2: 'var(--oxford-navy)' },
];

export const ScanlineWaves: React.FC<ScanlineWavesProps> = ({
  variant = 'footer',
  className = '',
}) => {
  const layers = variant === 'header' ? HEADER_LAYERS : FOOTER_LAYERS;
  const pxStep = variant === 'header' ? 6 : 8;
  const barRefs = useRef<(HTMLElement | null)[][]>(
    Array.from({ length: 4 }, () => Array(COLUMN_COUNT).fill(null))
  );

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    const startTime = performance.now();

    const updateWaves = (now: number) => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const scrollDeg = scrollProgress * 720;
      const ambientDeg = prefersReducedMotion ? 0 : ((now - startTime) / 1000) * 18;
      const baseAngleDeg = scrollDeg + ambientDeg;

      for (let w = 0; w < layers.length; w++) {
        const layer = layers[w];
        const jitterRow = COLUMN_JITTER[w];
        for (let i = 0; i < COLUMN_COUNT; i++) {
          const el = barRefs.current[w]?.[i];
          if (!el) continue;
          const { amp, offDeg } = jitterRow[i];
          const angleRad =
            ((baseAngleDeg * layer.speed + (i + 1) * layer.stepDeg + offDeg) *
              Math.PI) /
            180;
          const rawHeight = layer.base + Math.sin(angleRad) * layer.swing * amp;
          const quantized = Math.max(
            pxStep,
            Math.floor(rawHeight / pxStep) * pxStep
          );
          el.style.height = `${quantized}px`;
        }
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(updateWaves);
      }
    };

    const handleScroll = () => {
      if (prefersReducedMotion) {
        updateWaves(performance.now());
      }
    };

    updateWaves(performance.now());
    if (prefersReducedMotion) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [layers, pxStep]);

  return (
    <div
      className={`pointer-events-none select-none absolute inset-x-0 bottom-0 w-full overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {layers.map((layer, wIdx) => (
        <div
          key={layer.id}
          className="absolute inset-x-0 bottom-0 flex items-end"
          style={{ zIndex: layer.zIndex }}
        >
          {Array.from({ length: COLUMN_COUNT }).map((_, colIdx) => (
            <i
              key={colIdx}
              ref={(node) => {
                barRefs.current[wIdx][colIdx] = node;
              }}
              className="block flex-1 cp-scanline-bar"
              style={
                {
                  '--px': `${pxStep}px`,
                  height: `${layer.base}px`,
                  background: `linear-gradient(${layer.c1}, ${layer.c2})`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
};
