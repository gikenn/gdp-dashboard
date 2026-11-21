import React, { useEffect, useRef } from 'react';

// Global currencies: symbols and short codes representing economies across all regions
const CURRENCY_CHARS: string[] = [
  '$', '€', '£', '¥', '₹', '₩', '₣', '₦', '₱', '฿',
  '₫', '₪', '₴', '₸', '₺', '₽', '₵', '₡', '₲', '₭',
  'R$', 'C$', 'A$', 'S$', 'HK$', 'MX$', 'NZ$',
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CHF', 'BRL',
  'KRW', 'AUD', 'CAD', 'SAR', 'AED', 'ZAR', 'NGN', 'KES',
  'ETB', 'IDR', 'MYR', 'SGD', 'THB', 'PLN', 'SEK', 'NOK',
];

// Luminous coastal + aurora-harmonized colors for trails and leading heads
const TRAIL_COLORS = [
  'rgba(168, 218, 220, 0.34)', // Frosted Blue
  'rgba(103, 232, 249, 0.28)', // Aurora Cyan
  'rgba(255, 140, 105, 0.30)', // Warm Coral / Globe Terracotta
  'rgba(110, 231, 183, 0.30)', // Economic Emerald
  'rgba(253, 224, 71, 0.26)',  // Amber Gold
];

const HEAD_COLORS = [
  'rgba(241, 250, 238, 0.85)', // Honeydew bright tip
  'rgba(165, 243, 252, 0.82)', // Cyan bright tip
  'rgba(253, 224, 71, 0.82)',  // Gold bright tip
  'rgba(255, 159, 128, 0.82)', // Coral bright tip
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

class CurrencyDrop {
  x: number;
  y: number;
  speed: number;
  value: string;
  trailColor: string;
  headColor: string;
  tickCounter: number;
  mutateInterval: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.speed = randomFloat(1.1, 3.4);
    this.value = CURRENCY_CHARS[randomInt(0, CURRENCY_CHARS.length - 1)];
    this.trailColor = TRAIL_COLORS[randomInt(0, TRAIL_COLORS.length - 1)];
    this.headColor = HEAD_COLORS[randomInt(0, HEAD_COLORS.length - 1)];
    this.tickCounter = 0;
    this.mutateInterval = randomInt(4, 10);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    ctx2: CanvasRenderingContext2D,
    ch: number,
    fontSize: number
  ) {
    this.tickCounter++;
    if (this.tickCounter % this.mutateInterval === 0) {
      this.value = CURRENCY_CHARS[randomInt(0, CURRENCY_CHARS.length - 1)];
    }

    const fontStr = `600 ${fontSize}px "IBM Plex Mono", ui-monospace, monospace`;

    // Bright leading currency head on canvas2
    ctx2.fillStyle = this.headColor;
    ctx2.font = fontStr;
    ctx2.fillText(this.value, this.x, this.y);

    // Persistent fading trail glyph on canvas1
    ctx.fillStyle = this.trailColor;
    ctx.font = fontStr;
    ctx.fillText(this.value, this.x, this.y);

    this.y += this.speed;
    if (this.y > ch + 24) {
      this.y = randomFloat(-140, -10);
      this.speed = randomFloat(1.2, 3.6);
      this.value = CURRENCY_CHARS[randomInt(0, CURRENCY_CHARS.length - 1)];
      this.trailColor = TRAIL_COLORS[randomInt(0, TRAIL_COLORS.length - 1)];
      this.headColor = HEAD_COLORS[randomInt(0, HEAD_COLORS.length - 1)];
    }
  }
}

export const CurrencyMatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const canvas2 = canvas2Ref.current;
    if (!canvas || !canvas2) return;

    const ctx = canvas.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    if (!ctx || !ctx2) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fontSize = 13;
    const colSpacing = 28;
    let cw = window.innerWidth;
    let ch = window.innerHeight;
    let fallingDrops: CurrencyDrop[] = [];
    let rafId = 0;

    const initGrid = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = window.innerWidth;
      ch = window.innerHeight;

      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas2.width = Math.floor(cw * dpr);
      canvas2.height = Math.floor(ch * dpr);

      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      canvas2.style.width = `${cw}px`;
      canvas2.style.height = `${ch}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);

      const maxColumns = Math.ceil(cw / colSpacing);
      fallingDrops = [];
      for (let i = 0; i < maxColumns; i++) {
        fallingDrops.push(
          new CurrencyDrop(i * colSpacing + 4, randomFloat(-ch, ch))
        );
      }
    };

    initGrid();

    let lastFrameTime = 0;
    const frameIntervalMs = 33;

    const update = (now: number) => {
      if (now - lastFrameTime >= frameIntervalMs) {
        lastFrameTime = now;

        // Fade trails cleanly to transparent so the Aurora background below never gets obscured
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();

        // Clear leading-edge canvas and redraw crisp currency heads
        ctx2.clearRect(0, 0, cw, ch);

        for (let i = fallingDrops.length - 1; i >= 0; i--) {
          fallingDrops[i].draw(ctx, ctx2, ch, fontSize);
        }
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(update);
      }
    };

    if (prefersReducedMotion) {
      for (let i = fallingDrops.length - 1; i >= 0; i--) {
        fallingDrops[i].draw(ctx, ctx2, ch, fontSize);
      }
    } else {
      rafId = requestAnimationFrame(update);
    }

    const handleResize = () => {
      initGrid();
      if (prefersReducedMotion) {
        for (let i = fallingDrops.length - 1; i >= 0; i--) {
          fallingDrops[i].draw(ctx, ctx2, ch, fontSize);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-[1] overflow-hidden"
      aria-hidden="true"
      id="currency-matrix-backdrop"
    >
      <canvas ref={canvasRef} id="canvas" className="block absolute top-0 left-0" />
      <canvas ref={canvas2Ref} id="canvas2" className="block absolute top-0 left-0" />
    </div>
  );
};
