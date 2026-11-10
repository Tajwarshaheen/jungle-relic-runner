import * as THREE from 'three';

/**
 * Procedural Canvas Texture Generator
 * All textures are generated deterministically in memory, zero 404s.
 */

// 1. Weathered Ancient Stone Track Texture
export function createStoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base stone tone
  ctx.fillStyle = '#44403c';
  ctx.fillRect(0, 0, 512, 512);

  // Cobblestone / slab pattern
  const rows = 8;
  const cols = 4;
  const rowHeight = 512 / rows;
  const colWidth = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colWidth / 2);
    for (let c = -1; c < cols + 1; c++) {
      const x = c * colWidth + offset;
      const y = r * rowHeight;

      // Random stone shade
      const shade = 70 + Math.floor(Math.random() * 40);
      const greenTint = Math.random() > 0.6 ? 20 : 0; // moss
      ctx.fillStyle = `rgb(${shade}, ${shade + greenTint}, ${shade - 10})`;
      ctx.fillRect(x + 3, y + 3, colWidth - 6, rowHeight - 6);

      // Inner noise & cracks
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let k = 0; k < 12; k++) {
        ctx.fillRect(x + Math.random() * colWidth, y + Math.random() * rowHeight, 4, 4);
      }

      // Edge bevels
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, colWidth - 6, rowHeight - 6);
    }
  }

  // Moss overgrowth on edges
  ctx.fillStyle = 'rgba(34, 85, 45, 0.35)';
  for (let m = 0; m < 30; m++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    const radius = 10 + Math.random() * 25;
    ctx.beginPath();
    ctx.arc(rx, ry, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 2. Wooden Bridge Plank Texture
export function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3f2512';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankCount = 12;
  const plankH = 512 / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const tone = 70 + Math.floor(Math.random() * 35);
    ctx.fillStyle = `rgb(${tone + 30}, ${tone + 10}, ${tone - 20})`;
    ctx.fillRect(4, y + 2, 504, plankH - 4);

    // Wood grain lines
    ctx.strokeStyle = 'rgba(20, 10, 5, 0.3)';
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 4; g++) {
      ctx.beginPath();
      ctx.moveTo(4, y + 4 + Math.random() * (plankH - 8));
      ctx.bezierCurveTo(150, y + Math.random() * plankH, 350, y + Math.random() * plankH, 508, y + Math.random() * plankH);
      ctx.stroke();
    }

    // Nail heads on left and right
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(24, y + plankH / 2, 4, 0, Math.PI * 2);
    ctx.arc(488, y + plankH / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 3. Ancient Relief Carving Texture for Temple Pillars & Idols
export function createRelicRuinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#57534e';
  ctx.fillRect(0, 0, 256, 256);

  // Carved glyph geometric patterns
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 216, 216);
  ctx.strokeRect(50, 50, 156, 156);

  // Cross & diamond motif
  ctx.beginPath();
  ctx.moveTo(128, 50);
  ctx.lineTo(206, 128);
  ctx.lineTo(128, 206);
  ctx.lineTo(50, 128);
  ctx.closePath();
  ctx.stroke();

  // Center idol eye glyph
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(128, 128, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.arc(128, 128, 7, 0, Math.PI * 2);
  ctx.fill();

  // Weathering
  ctx.fillStyle = 'rgba(20, 50, 25, 0.25)';
  for (let k = 0; k < 15; k++) {
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 16, 16);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 4. Gold Coin Relic Emblem Texture
export function createCoinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Shiny gold base
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.6, '#eab308');
  grad.addColorStop(1, '#a16207');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  // Outer border with dots
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 110, 0, Math.PI * 2);
  ctx.stroke();

  // Ancient sun emblem in center
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(128, 128, 40, 0, Math.PI * 2);
  ctx.fill();

  // Sun rays
  for (let a = 0; a < 8; a++) {
    const angle = (a * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(angle) * 45, 128 + Math.sin(angle) * 45);
    ctx.lineTo(128 + Math.cos(angle) * 80, 128 + Math.sin(angle) * 80);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 5. Fire Flame Particle Texture
export function createFlameParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const rad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  rad.addColorStop(0, 'rgba(255, 240, 180, 1)');
  rad.addColorStop(0.3, 'rgba(255, 140, 20, 0.8)');
  rad.addColorStop(0.7, 'rgba(220, 40, 0, 0.4)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 6. Glowing Ancient Turn Arrow Indicator
export function createTurnArrowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Glowing chevron arrow pointing forward (rotate mesh as needed)
  ctx.shadowColor = '#facc15';
  ctx.shadowBlur = 20;

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(128, 40);
  ctx.lineTo(210, 150);
  ctx.lineTo(165, 150);
  ctx.lineTo(165, 220);
  ctx.lineTo(91, 220);
  ctx.lineTo(91, 150);
  ctx.lineTo(46, 150);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 8;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Pre-create singleton textures for performance
export const stoneTexture = createStoneTexture();
export const woodTexture = createWoodTexture();
export const relicRuinTexture = createRelicRuinTexture();
export const coinTexture = createCoinTexture();
export const flameParticleTexture = createFlameParticleTexture();
export const turnArrowTexture = createTurnArrowTexture();

