import * as THREE from 'three';

// Shared texture cache for reusable storybook materials (disposed on GameEngine.dispose)
const sharedTextureCache = new Map<string, THREE.CanvasTexture>();

function makeSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(Math.max(maxAnisotropy, 1), 8);
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function finalizeDataTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = Math.min(Math.max(maxAnisotropy, 1), 4);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function paintPaperGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  strength = 0.045,
): void {
  const rand = makeSeededRandom(seed);
  // Subtle cold-pressed watercolor paper speckles & dry-brush fibers
  for (let i = 0; i < 420; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 1 + rand() * 3.5;
    ctx.fillStyle = rand() > 0.5
      ? `rgba(255, 250, 236, ${strength * (0.6 + rand() * 0.7)})`
      : `rgba(92, 68, 44, ${strength * (0.45 + rand() * 0.6)})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineWidth = 1;
  for (let i = 0; i < 120; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const len = 8 + rand() * 24;
    const ang = (rand() - 0.5) * 0.35;
    ctx.strokeStyle = rand() > 0.5
      ? `rgba(255, 249, 232, ${strength * 0.8})`
      : `rgba(105, 80, 52, ${strength * 0.55})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
}

function getCachedTexture(
  key: string,
  factory: () => THREE.CanvasTexture,
): THREE.CanvasTexture {
  const existing = sharedTextureCache.get(key);
  if (existing) return existing;
  const created = factory();
  sharedTextureCache.set(key, created);
  return created;
}

export function disposeSharedStorybookTextures(): void {
  sharedTextureCache.forEach((tex) => tex.dispose());
  sharedTextureCache.clear();
}

/**
 * Tileable cold-pressed watercolor paper & fine gouache brush bump map (NoColorSpace)
 */
export function getPaperBumpTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  return getCachedTexture('paper_bump', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = makeSeededRandom(4021);

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    // Soft organic watercolor cotton dimples
    for (let i = 0; i < 900; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const r = 1.2 + rand() * 4.5;
      const lum = Math.floor(110 + rand() * 38);
      ctx.fillStyle = `rgba(${lum},${lum},${lum},0.35)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine directional gouache brush streaks
    for (let i = 0; i < 180; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const len = 14 + rand() * 34;
      const lum = rand() > 0.5 ? 148 : 108;
      ctx.strokeStyle = `rgba(${lum},${lum},${lum},0.22)`;
      ctx.lineWidth = 1.5 + rand() * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (rand() - 0.5) * 4);
      ctx.stroke();
    }

    return finalizeDataTexture(canvas, maxAnisotropy, 2, 2);
  });
}

/**
 * Sunny morning watercolor sky dome texture matching the start screen illustration:
 * robin's-egg cerulean zenith -> soft cream-gold horizon with glowing morning sun & cloud wisps
 */
export function createWatercolorSkyTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const rand = makeSeededRandom(1108);

  // Vertical sky wash (top = zenith, mid = horizon, bottom = warm meadow mist)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 256);
  skyGrad.addColorStop(0.0, '#72B5DC');
  skyGrad.addColorStop(0.22, '#93CAE7');
  skyGrad.addColorStop(0.38, '#C8E4F0');
  skyGrad.addColorStop(0.47, '#F6ECCF');
  skyGrad.addColorStop(0.53, '#FCE7B7');
  skyGrad.addColorStop(0.62, '#EFE2BF');
  skyGrad.addColorStop(1.0, '#C7D3A3');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 512, 256);

  // Warm morning sun glow on horizon (upper-right panorama position)
  const sunGlow = ctx.createRadialGradient(356, 118, 6, 356, 118, 128);
  sunGlow.addColorStop(0.0, 'rgba(255, 251, 224, 0.96)');
  sunGlow.addColorStop(0.25, 'rgba(255, 238, 178, 0.72)');
  sunGlow.addColorStop(0.6, 'rgba(255, 224, 152, 0.25)');
  sunGlow.addColorStop(1.0, 'rgba(255, 224, 152, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(190, 0, 322, 220);

  // Soft painterly watercolor cloud banks drifting above horizon
  const drawCloudWash = (cx: number, cy: number, rx: number, ry: number, alpha: number) => {
    const g = ctx.createRadialGradient(cx, cy - ry * 0.2, rx * 0.1, cx, cy, rx);
    g.addColorStop(0, `rgba(255, 252, 240, ${alpha})`);
    g.addColorStop(0.65, `rgba(252, 241, 218, ${alpha * 0.65})`);
    g.addColorStop(1, 'rgba(252, 241, 218, 0)');
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const cloudBanks: [number, number, number, number, number][] = [
    [65, 96, 56, 20, 0.62],
    [135, 88, 68, 22, 0.55],
    [228, 98, 58, 18, 0.58],
    [320, 86, 72, 22, 0.5],
    [425, 92, 64, 21, 0.64],
    [488, 98, 48, 16, 0.52],
    [95, 68, 42, 13, 0.35],
    [275, 64, 46, 14, 0.32],
    [400, 62, 50, 14, 0.34],
  ];
  for (const [cx, cy, rx, ry, a] of cloudBanks) {
    drawCloudWash(cx, cy, rx, ry, a);
  }

  // Subtle watercolor pigment granulation
  for (let i = 0; i < 300; i++) {
    const x = rand() * 512;
    const y = rand() * 140;
    const r = 4 + rand() * 16;
    ctx.fillStyle = rand() > 0.5
      ? 'rgba(255, 251, 236, 0.045)'
      : 'rgba(116, 178, 214, 0.04)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 1, 1);
}

/**
 * Sun-dappled picture-book meadow grass with warm chartreuse/olive washes & tiny wildflowers
 */
export function createGrassTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const rand = makeSeededRandom(2025);

  ctx.fillStyle = '#89B54E';
  ctx.fillRect(0, 0, 512, 512);

  // Soft painterly watercolor grass washes (sunlit lime-gold & meadow olive)
  const washes = [
    { x: 95, y: 110, r: 120, c: 'rgba(182, 214, 98, 0.58)' },
    { x: 350, y: 170, r: 135, c: 'rgba(110, 156, 62, 0.48)' },
    { x: 205, y: 385, r: 125, c: 'rgba(168, 204, 88, 0.54)' },
    { x: 435, y: 425, r: 105, c: 'rgba(104, 148, 56, 0.46)' },
    { x: 40, y: 440, r: 95, c: 'rgba(194, 218, 108, 0.45)' },
    { x: 465, y: 75, r: 95, c: 'rgba(176, 208, 92, 0.45)' },
  ];
  for (const w of washes) {
    const grad = ctx.createRadialGradient(w.x, w.y, 12, w.x, w.y, w.r);
    grad.addColorStop(0, w.c);
    grad.addColorStop(1, 'rgba(137, 181, 78, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Colored-pencil & gouache grass tuft strokes
  for (let i = 0; i < 320; i++) {
    const gx = rand() * 512;
    const gy = rand() * 512;
    const h = 6 + rand() * 7;
    ctx.strokeStyle =
      i % 3 === 0 ? '#5D8735' : i % 3 === 1 ? '#B5D666' : '#739F40';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx - 2, gy - h * 0.6, gx - 4, gy - h);
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + 2, gy - h * 0.6, gx + 3.5, gy - h * 0.9);
    ctx.stroke();
  }

  // Delicate storybook meadow daisies & buttercups
  const flowerColors = ['#FFFBEB', '#FDE68A', '#F9B4AB', '#FEF3C7'];
  for (let i = 0; i < 36; i++) {
    const fx = 16 + rand() * 480;
    const fy = 16 + rand() * 480;
    ctx.fillStyle = flowerColors[i % flowerColors.length];
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#EAB308';
    ctx.beginPath();
    ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  paintPaperGrain(ctx, 512, 512, 7102, 0.045);
  return finalizeColorTexture(canvas, maxAnisotropy, 14, 14);
}

/**
 * Patchwork sunlit countryside hills texture echoing the start screen's rolling green pastures
 */
export function createHillPatchworkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, 0, 256);
  baseGrad.addColorStop(0, '#B9D76B');
  baseGrad.addColorStop(0.5, '#8EB850');
  baseGrad.addColorStop(1, '#68933C');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 256);

  // Curved painted patchwork fields
  const fieldBands = [
    { y: 55, amp: 14, color: 'rgba(202, 224, 118, 0.52)', h: 52 },
    { y: 112, amp: 16, color: 'rgba(122, 168, 66, 0.45)', h: 58 },
    { y: 170, amp: 12, color: 'rgba(172, 206, 88, 0.44)', h: 56 },
  ];
  for (const b of fieldBands) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(0, b.y);
    for (let x = 0; x <= 512; x += 32) {
      ctx.lineTo(x, b.y + Math.sin((x / 512) * Math.PI * 2) * b.amp);
    }
    ctx.lineTo(512, b.y + b.h);
    ctx.lineTo(0, b.y + b.h);
    ctx.closePath();
    ctx.fill();

    // Soft hand-drawn hedgerow boundary line
    ctx.strokeStyle = 'rgba(72, 106, 42, 0.34)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 16) {
      const yy = b.y + Math.sin((x / 512) * Math.PI * 2) * b.amp;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // Subtle vertical furrow pencil lines
  ctx.strokeStyle = 'rgba(255, 250, 220, 0.16)';
  ctx.lineWidth = 1.5;
  for (let x = 14; x < 512; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.quadraticCurveTo(x + 8, 128, x - 4, 240);
    ctx.stroke();
  }

  paintPaperGrain(ctx, 512, 256, 3309, 0.045);
  return finalizeColorTexture(canvas, maxAnisotropy, 2, 1);
}

/**
 * Hand-illustrated warm sandstone & oatmeal-cream cobblestone paving for town plaza & pads
 */
export function createCobblestoneTexture(
  maxAnisotropy: number,
  repeatX = 5,
  repeatY = 5,
): THREE.CanvasTexture {
  const key = `cobble_${repeatX}_${repeatY}`;
  return getCachedTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const rand = makeSeededRandom(5512);

    // Warm sepia-sand mortar bed
    ctx.fillStyle = '#9D8972';
    ctx.fillRect(0, 0, 512, 512);

    const stonePalette = [
      '#E8DAC2',
      '#DFCDAE',
      '#D5C1A0',
      '#ECE1CC',
      '#CEB998',
      '#E2D2B8',
    ];

    const rows = 12;
    const rowH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const offset = (r % 2) * 26;
      let x = -offset;
      while (x < 512) {
        const w = 40 + rand() * 20;
        const h = rowH - 5;
        const color = stonePalette[Math.floor(rand() * stonePalette.length)];
        const sx = x + 2.5;
        const sy = y + 2.5;
        const sw = Math.max(20, w - 5);

        // Soft shadow edge under each cobble
        ctx.fillStyle = 'rgba(84, 65, 48, 0.38)';
        ctx.beginPath();
        ctx.roundRect(sx + 1, sy + 2, sw, h, 8);
        ctx.fill();

        // Main cobble fill
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, h, 8);
        ctx.fill();

        // Sunlit top bevel highlight
        ctx.fillStyle = 'rgba(255, 251, 240, 0.34)';
        ctx.beginPath();
        ctx.roundRect(sx + 3, sy + 2, sw - 6, h * 0.38, 5);
        ctx.fill();

        // Fine storybook pencil ink outline
        ctx.strokeStyle = 'rgba(96, 76, 56, 0.45)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, h, 8);
        ctx.stroke();

        x += w;
      }
    }

    paintPaperGrain(ctx, 512, 512, 8821, 0.05);
    return finalizeColorTexture(canvas, maxAnisotropy, repeatX, repeatY);
  });
}

/**
 * Warm storybook cobblestone village road with carved granite curbs & subtle ivory guide stones
 */
export function createRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const rand = makeSeededRandom(6123);

  // Warm taupe-sandstone road mortar base
  ctx.fillStyle = '#97846F';
  ctx.fillRect(0, 0, 512, 256);

  const pavers = ['#DDD0B8', '#D3C2A6', '#CBB89A', '#E4D8C4', '#C6B396'];

  // Hand-drawn horizontal rows of village street cobbles
  const topCurb = 24;
  const botCurb = 232;
  const laneRows = 8;
  const rowH = (botCurb - topCurb) / laneRows;

  for (let r = 0; r < laneRows; r++) {
    const y = topCurb + r * rowH;
    let x = -((r % 2) * 20);
    while (x < 512) {
      const w = 34 + rand() * 14;
      const sx = x + 2;
      const sy = y + 2;
      const sw = w - 4;
      const sh = rowH - 4;

      ctx.fillStyle = pavers[Math.floor(rand() * pavers.length)];
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, 6);
      ctx.fill();

      ctx.strokeStyle = 'rgba(92, 72, 54, 0.36)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      x += w;
    }
  }

  // Carved warm granite curbs along both sides
  const drawCurb = (cy: number, ch: number) => {
    ctx.fillStyle = '#C9B9A2';
    ctx.fillRect(0, cy, 512, ch);
    for (let x = 0; x < 512; x += 64) {
      ctx.fillStyle = x % 128 === 0 ? '#E5DAC6' : '#D9CCB4';
      ctx.beginPath();
      ctx.roundRect(x + 2, cy + 2, 60, ch - 4, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(84, 66, 48, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };
  drawCurb(0, topCurb);
  drawCurb(botCurb, 256 - botCurb);

  // Subtle sunlit warm-cream center stone dashes (friendly & cozy, never harsh neon)
  ctx.fillStyle = 'rgba(255, 250, 236, 0.78)';
  ctx.strokeStyle = 'rgba(116, 94, 70, 0.35)';
  ctx.lineWidth = 1.5;
  for (let x = 22; x < 512; x += 96) {
    ctx.beginPath();
    ctx.roundRect(x, 122, 48, 12, 6);
    ctx.fill();
    ctx.stroke();
  }

  paintPaperGrain(ctx, 512, 256, 4419, 0.045);
  return finalizeColorTexture(canvas, maxAnisotropy, 7, 1);
}

/**
 * Overlapping hand-painted clay terracotta or slate-blue cottage roof shingles
 */
export function createRoofShingleTexture(
  style: 'terracotta' | 'slate',
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return getCachedTexture(`roof_${style}`, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = makeSeededRandom(style === 'terracotta' ? 3001 : 3099);

    const palette =
      style === 'terracotta'
        ? ['#C8673F', '#D6784B', '#B95A36', '#DD8758', '#C1623D']
        : ['#6F8EA9', '#7E9DB8', '#617F9A', '#89A7C0', '#6987A1'];

    ctx.fillStyle = style === 'terracotta' ? '#8E3F24' : '#4A6177';
    ctx.fillRect(0, 0, 256, 256);

    const rows = 9;
    const cols = 8;
    const rh = 256 / rows;
    const cw = 256 / cols;

    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      const shift = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * cw + shift;
        ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y + 1, cw - 3, rh + 3, [2, 2, 8, 8]);
        ctx.fill();

        // Warm sunlit rim
        ctx.fillStyle = 'rgba(255, 245, 220, 0.22)';
        ctx.fillRect(x + 4, y + 3, cw - 8, 4);

        // Ink tile edge
        ctx.strokeStyle = 'rgba(66, 38, 24, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }

    paintPaperGrain(ctx, 256, 256, 3911, 0.05);
    return finalizeColorTexture(canvas, maxAnisotropy, 2, 2);
  });
}

/**
 * Warm cream/butter/blue stucco wall with hand-drawn oak timber framing & stone base plinth
 */
export function createCottageWallTexture(
  wallHex: string,
  timberHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return getCachedTexture(`cottage_wall_${wallHex}_${timberHex}`, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = makeSeededRandom(wallHex.charCodeAt(1) * 97 + 13);

    // Base warm stucco wash
    ctx.fillStyle = wallHex;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle watercolor plaster blotches
    for (let i = 0; i < 28; i++) {
      const x = rand() * 256;
      const y = rand() * 220;
      const r = 18 + rand() * 44;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, rand() > 0.5 ? 'rgba(255,250,235,0.22)' : 'rgba(140,108,74,0.12)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lower stone plinth band (bottom 42px)
    ctx.fillStyle = '#BFB39E';
    ctx.fillRect(0, 214, 256, 42);
    for (let x = 0; x < 256; x += 32) {
      ctx.fillStyle = x % 64 === 0 ? '#CFC3AE' : '#C2B49E';
      ctx.beginPath();
      ctx.roundRect(x + 2, 218, 28, 16, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(((x + 14) % 256) + 2, 236, 28, 16, 4);
      ctx.fill();
    }

    // Dark oak timber frame beams (classic storybook cottage half-timbering)
    ctx.fillStyle = timberHex;
    ctx.fillRect(0, 0, 256, 14); // top beam
    ctx.fillRect(0, 118, 256, 12); // mid horizontal beam
    ctx.fillRect(0, 206, 256, 10); // plinth sill beam
    ctx.fillRect(0, 0, 14, 216); // left post
    ctx.fillRect(242, 0, 14, 216); // right post
    ctx.fillRect(122, 0, 12, 124); // upper center post

    // Subtle sepia pencil outlines along timber edges
    ctx.strokeStyle = 'rgba(56, 38, 24, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 14, 108, 104);
    ctx.strokeRect(134, 14, 108, 104);
    ctx.strokeRect(14, 130, 228, 76);

    paintPaperGrain(ctx, 256, 256, 6012, 0.05);
    return finalizeColorTexture(canvas, maxAnisotropy, 1, 1);
  });
}

/**
 * Dry-stone village garden wall texture (stacked warm limestone & mossy shadows)
 */
export function createStoneWallTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return getCachedTexture('stone_wall', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const rand = makeSeededRandom(9142);

    ctx.fillStyle = '#6D6255';
    ctx.fillRect(0, 0, 256, 128);

    const stones = ['#D6C9B4', '#C7B8A0', '#B9AA92', '#DDD1BE', '#AEA18C'];
    const rows = 5;
    const rh = 128 / rows;
    for (let r = 0; r < rows; r++) {
      let x = -((r % 2) * 18);
      while (x < 256) {
        const w = 28 + rand() * 24;
        ctx.fillStyle = stones[Math.floor(rand() * stones.length)];
        ctx.beginPath();
        ctx.roundRect(x + 2, r * rh + 2, w - 4, rh - 3.5, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(72, 58, 44, 0.5)';
        ctx.lineWidth = 1.3;
        ctx.stroke();
        x += w;
      }
    }
    paintPaperGrain(ctx, 256, 128, 9199, 0.05);
    return finalizeColorTexture(canvas, maxAnisotropy, 3, 1);
  });
}

/**
 * Hand-painted honey-oak or rustic wood planks for truck beds, crates, seesaw & barn beams
 */
export function createWoodPlankTexture(
  baseHex: string,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  return getCachedTexture(`wood_${baseHex}_${repeatX}_${repeatY}`, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = makeSeededRandom(baseHex.charCodeAt(2) * 131 + 19);

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);

    const planks = 5;
    const ph = 256 / planks;
    for (let p = 0; p < planks; p++) {
      const y = p * ph;
      // Warm plank tone shift
      ctx.fillStyle = p % 2 === 0 ? 'rgba(255, 244, 214, 0.14)' : 'rgba(96, 56, 24, 0.12)';
      ctx.fillRect(0, y, 256, ph);

      // Painted wood grain waves
      for (let g = 0; g < 6; g++) {
        const gy = y + 6 + g * ((ph - 12) / 5);
        ctx.strokeStyle = g % 2 === 0 ? 'rgba(88, 52, 22, 0.22)' : 'rgba(255, 240, 200, 0.16)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(85, gy + (rand() - 0.5) * 6, 170, gy + (rand() - 0.5) * 6, 256, gy);
        ctx.stroke();
      }

      // Plank seam
      ctx.fillStyle = 'rgba(64, 38, 18, 0.52)';
      ctx.fillRect(0, y, 256, 2.5);

      // Cute iron nail dots near plank ends
      ctx.fillStyle = 'rgba(60, 48, 38, 0.65)';
      ctx.beginPath();
      ctx.arc(14, y + ph * 0.5, 2.8, 0, Math.PI * 2);
      ctx.arc(242, y + ph * 0.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    paintPaperGrain(ctx, 256, 256, 7421, 0.045);
    return finalizeColorTexture(canvas, maxAnisotropy, repeatX, repeatY);
  });
}

/**
 * Hand-painted clay masonry brick texture (tinted cleanly by material color for Molen & cargo bricks)
 */
export function createBrickTexture(
  baseHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return getCachedTexture(`brick_${baseHex}`, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = makeSeededRandom(8311);

    // Warm cream-sepia mortar background
    ctx.fillStyle = '#E8DFCF';
    ctx.fillRect(0, 0, 256, 256);

    const rows = 8;
    const rh = 256 / rows;
    const bw = 64;
    for (let r = 0; r < rows; r++) {
      const shift = (r % 2) * (bw / 2);
      for (let x = -bw; x < 256 + bw; x += bw) {
        const bx = x + shift + 2.5;
        const by = r * rh + 2.5;
        ctx.fillStyle = baseHex;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw - 5, rh - 5, 4);
        ctx.fill();

        // Gouache tonal dab per brick
        ctx.fillStyle =
          rand() > 0.5 ? 'rgba(255, 248, 228, 0.16)' : 'rgba(72, 42, 24, 0.12)';
        ctx.fill();

        ctx.strokeStyle = 'rgba(84, 54, 34, 0.32)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    paintPaperGrain(ctx, 256, 256, 8399, 0.045);
    return finalizeColorTexture(canvas, maxAnisotropy, 1, 1);
  });
}

/**
 * Gouache hand-painted vehicle enamel swatch (cached by hex color)
 * Adds warm painterly brushwork & fine cotton-paper tooth so trucks never look like flat CGI plastic.
 */
export function createGouachePaintTexture(
  baseHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return getCachedTexture(`gouache_${baseHex}`, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    let seed = 101;
    for (let i = 0; i < baseHex.length; i++) {
      seed = seed * 31 + baseHex.charCodeAt(i);
    }
    const rand = makeSeededRandom(seed);

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle sunlit top-to-bottom painterly wash
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(255, 250, 232, 0.14)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(1, 'rgba(66, 44, 24, 0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Broad soft gouache brush dabs
    for (let i = 0; i < 65; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const rw = 26 + rand() * 44;
      const rh = 10 + rand() * 20;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rand() - 0.5) * 0.4);
      ctx.fillStyle =
        rand() > 0.48
          ? `rgba(255, 250, 234, ${0.04 + rand() * 0.05})`
          : `rgba(58, 38, 22, ${0.03 + rand() * 0.045})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, rw * 0.5, rh * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    paintPaperGrain(ctx, 256, 256, seed + 77, 0.04);
    return finalizeColorTexture(canvas, maxAnisotropy, 1, 1);
  });
}

/**
 * Dappled sunlit storybook foliage leaf-dab texture (white-neutral so instanceColor tints cleanly)
 */
export function createFoliageTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return getCachedTexture('foliage_dabs', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = makeSeededRandom(5050);

    ctx.fillStyle = '#D8DFC8';
    ctx.fillRect(0, 0, 256, 256);

    // Layered gouache leaf cluster dabs (bright sunlit tips + shaded leaf pockets)
    for (let i = 0; i < 240; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const r = 7 + rand() * 14;
      const v = rand();
      ctx.fillStyle =
        v > 0.62
          ? 'rgba(255, 253, 232, 0.52)'
          : v > 0.28
            ? 'rgba(218, 228, 198, 0.45)'
            : 'rgba(132, 148, 114, 0.42)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tiny colored-pencil leaf contour accents
    ctx.strokeStyle = 'rgba(98, 112, 82, 0.28)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 80; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      ctx.beginPath();
      ctx.arc(x, y, 6 + rand() * 7, 0.2, Math.PI * 1.1);
      ctx.stroke();
    }

    return finalizeColorTexture(canvas, maxAnisotropy, 2, 2);
  });
}

/**
 * Striped village market awning canvas texture (cozy storybook stripes)
 */
export function createAwningStripeTexture(
  stripeHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  return getCachedTexture(`awning_${stripeHex}`, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FAF3E1';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = stripeHex;
    const stripes = 6;
    const sw = 256 / (stripes * 2);
    for (let i = 0; i < stripes; i++) {
      ctx.fillRect(i * sw * 2, 0, sw, 256);
    }

    // Soft scalloped cloth seam hint at bottom
    ctx.fillStyle = 'rgba(72, 48, 30, 0.16)';
    ctx.fillRect(0, 236, 256, 20);
    paintPaperGrain(ctx, 256, 256, 7711, 0.05);
    return finalizeColorTexture(canvas, maxAnisotropy, 1, 1);
  });
}

/**
 * Warm sepia-tinted soft contact shadow grounding trucks onto the sandstone plaza
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 60);
  grad.addColorStop(0, 'rgba(62, 42, 26, 0.46)');
  grad.addColorStop(0.58, 'rgba(74, 52, 34, 0.22)');
  grad.addColorStop(1, 'rgba(74, 52, 34, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Hand-painted spiral stripe texture for Truk Molen's cement drum
 */
export function createMixerStripeTexture(
  accentHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FAF3E2';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = accentHex;
  for (let i = -2; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 96, 0);
    ctx.lineTo(i * 96 + 46, 0);
    ctx.lineTo(i * 96 + 150, 256);
    ctx.lineTo(i * 96 + 104, 256);
    ctx.closePath();
    ctx.fill();

    // Subtle hand-painted sepia trim line along stripe edge
    ctx.strokeStyle = 'rgba(76, 52, 32, 0.28)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  paintPaperGrain(ctx, 512, 256, 2299, 0.055);
  return finalizeColorTexture(canvas, maxAnisotropy);
}

/**
 * Hand-painted wooden storybook plaque sign for mission letters & park bins
 */
export function createSignTexture(
  bigText: string,
  subText: string,
  bgHex: string,
  fgHex = '#FFFDF6',
  maxAnisotropy = 4,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm honey-oak outer frame
  ctx.fillStyle = '#8B5A32';
  ctx.fillRect(0, 0, 512, 512);

  // Inner parchment-cream border
  ctx.fillStyle = '#FBF3E1';
  ctx.beginPath();
  ctx.roundRect(18, 18, 476, 476, 24);
  ctx.fill();

  // Painted centerpiece panel
  ctx.fillStyle = bgHex;
  ctx.beginPath();
  ctx.roundRect(38, 38, 436, 436, 18);
  ctx.fill();

  // Subtle gouache wash across panel
  const g = ctx.createLinearGradient(0, 38, 0, 474);
  g.addColorStop(0, 'rgba(255, 250, 232, 0.16)');
  g.addColorStop(1, 'rgba(48, 28, 14, 0.14)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(38, 38, 436, 436, 18);
  ctx.fill();

  // Warm ink inner dashed storybook stitch border
  ctx.strokeStyle = 'rgba(255, 250, 235, 0.55)';
  ctx.lineWidth = 5;
  ctx.strokeRect(54, 54, 404, 404);

  // Corner brass rivets
  ctx.fillStyle = '#EAB656';
  for (const [rx, ry] of [
    [68, 68],
    [444, 68],
    [68, 444],
    [444, 444],
  ]) {
    ctx.beginPath();
    ctx.arc(rx, ry, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hand-lettered shadow + main glyph
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 228px "Bricolage Grotesque", sans-serif';
  ctx.fillStyle = 'rgba(45, 25, 12, 0.28)';
  ctx.fillText(bigText, 260, subText ? 221 : 266);
  ctx.fillStyle = fgHex;
  ctx.fillText(bigText, 256, subText ? 215 : 260);

  if (subText) {
    ctx.font = '700 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(45, 25, 12, 0.25)';
    ctx.fillText(subText, 258, 397);
    ctx.fillStyle = fgHex;
    ctx.fillText(subText, 256, 394);
  }

  paintPaperGrain(ctx, 512, 512, 9912, 0.05);
  return finalizeColorTexture(canvas, maxAnisotropy);
}
