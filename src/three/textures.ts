import * as THREE from 'three';

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(maxAnisotropy, 8);
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createGrassTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#7CCB54';
  ctx.fillRect(0, 0, 512, 512);

  // Soft storybook meadow patches
  const patches = [
    { x: 90, y: 110, r: 95, c: '#86D45F' },
    { x: 340, y: 180, r: 120, c: '#70BF49' },
    { x: 210, y: 380, r: 110, c: '#88D862' },
    { x: 430, y: 420, r: 85, c: '#6EBA47' },
  ];
  for (const p of patches) {
    const grad = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.r);
    grad.addColorStop(0, p.c);
    grad.addColorStop(1, 'rgba(124,203,84,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny storybook grass tufts & daisies
  for (let i = 0; i < 160; i++) {
    const gx = (i * 97) % 512;
    const gy = (i * 151) % 512;
    ctx.strokeStyle = i % 2 === 0 ? '#5FA83D' : '#96E26E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - 3, gy - 8);
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 3, gy - 7);
    ctx.stroke();
  }

  for (let i = 0; i < 16; i++) {
    const fx = (i * 137 + 40) % 500;
    const fy = (i * 193 + 30) % 500;
    ctx.fillStyle = i % 3 === 0 ? '#FFFBEB' : '#FEF08A';
    ctx.beginPath();
    ctx.arc(fx, fy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 12, 12);
}

export function createRoadTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Friendly warm slate asphalt
  ctx.fillStyle = '#536275';
  ctx.fillRect(0, 0, 512, 256);

  // Subtle curb edges
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(0, 0, 512, 18);
  ctx.fillRect(0, 238, 512, 18);

  // Dashed center lines
  ctx.fillStyle = '#F8FAFC';
  for (let x = 20; x < 512; x += 96) {
    ctx.beginPath();
    ctx.roundRect(x, 121, 52, 14, 6);
    ctx.fill();
  }

  return finalizeColorTexture(canvas, maxAnisotropy, 6, 1);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 12, 64, 64, 60);
  grad.addColorStop(0, 'rgba(20, 35, 55, 0.45)');
  grad.addColorStop(0.6, 'rgba(20, 35, 55, 0.2)');
  grad.addColorStop(1, 'rgba(20, 35, 55, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function createMixerStripeTexture(
  accentHex: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFDF7';
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
  }

  return finalizeColorTexture(canvas, maxAnisotropy);
}

export function createSignTexture(
  bigText: string,
  subText: string,
  bgHex: string,
  fgHex = '#FFFFFF',
  maxAnisotropy = 4,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 512);

  // Crisp storybook border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 22;
  ctx.strokeRect(24, 24, 464, 464);

  ctx.fillStyle = fgHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 240px "Bricolage Grotesque", sans-serif';
  ctx.fillText(bigText, 256, subText ? 215 : 260);

  if (subText) {
    ctx.font = '700 46px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subText, 256, 395);
  }

  return finalizeColorTexture(canvas, maxAnisotropy);
}
