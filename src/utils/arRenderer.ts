import { ArHeadEffect } from '../types';

interface ArRenderOptions {
  width: number;
  height: number;
  time: number; // in seconds
  headOffset?: number; // 0.15 to 0.40 of canvas height (default ~0.26)
  mirror?: boolean;
  beautyMode?: boolean;
}

/**
 * Draws a crisp 2D vector heart
 */
function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  glow = true
) {
  ctx.save();
  ctx.translate(x, y);

  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.8;
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  const d = size;
  ctx.moveTo(0, d * 0.3);
  ctx.bezierCurveTo(-d * 0.7, -d * 0.3, -d * 0.7, -d * 0.8, 0, -d * 0.4);
  ctx.bezierCurveTo(d * 0.7, -d * 0.8, d * 0.7, -d * 0.3, 0, d * 0.3);
  ctx.closePath();
  ctx.fill();

  // Glossy highlight on left lobe
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.ellipse(-d * 0.25, -d * 0.5, d * 0.12, d * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a 4-point twinkle sparkle star
 */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = '#FFFFFF',
  rotation = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 0.5;

  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size * 0.3, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size * 0.3, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size * 0.3);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size * 0.3);
  ctx.quadraticCurveTo(0, 0, -size, 0);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a 5-point cartoon star
 */
function draw5PointStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  color = '#FFD700',
  rotation = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.shadowColor = '#F59E0B';
  ctx.shadowBlur = 10;

  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const aOuter = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const aInner = aOuter + Math.PI / 5;
    if (i === 0) {
      ctx.moveTo(Math.cos(aOuter) * outerR, Math.sin(aOuter) * outerR);
    } else {
      ctx.lineTo(Math.cos(aOuter) * outerR, Math.sin(aOuter) * outerR);
    }
    ctx.lineTo(Math.cos(aInner) * innerR, Math.sin(aInner) * innerR);
  }
  ctx.closePath();
  ctx.fill();

  // Subtle cute cartoon face inside star
  if (outerR > 18) {
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-outerR * 0.25, -outerR * 0.1, outerR * 0.08, 0, Math.PI * 2);
    ctx.arc(outerR * 0.25, -outerR * 0.1, outerR * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 0.18, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws the iconic Apple Photo Booth Yellow Cartoon Bird
 */
function drawAppleBoothBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  movingRight: boolean,
  wingPhase: number,
  depthAlpha = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = depthAlpha;

  // Orient bird towards movement direction
  if (!movingRight) {
    ctx.scale(-1, 1);
  }

  const s = size;

  // Drop shadow for 3D realism
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  // 1. Tail Feathers
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, s * 0.1);
  ctx.lineTo(-s * 1.1, -s * 0.2);
  ctx.lineTo(-s * 0.8, s * 0.2);
  ctx.lineTo(-s * 1.1, s * 0.4);
  ctx.lineTo(-s * 0.5, s * 0.3);
  ctx.closePath();
  ctx.fill();

  // 2. Main Body (Chubby Cute Yellow Canary)
  const bodyGrad = ctx.createRadialGradient(-s * 0.1, -s * 0.1, s * 0.1, 0, 0, s * 0.8);
  bodyGrad.addColorStop(0, '#FEF08A'); // bright cream yellow top
  bodyGrad.addColorStop(0.6, '#FACC15'); // rich yellow
  bodyGrad.addColorStop(1, '#EAB308'); // warm amber bottom
  ctx.fillStyle = bodyGrad;

  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.65, s * 0.5, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // 3. Head & Crest
  ctx.beginPath();
  ctx.arc(s * 0.4, -s * 0.3, s * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Cute top crest tuft of feathers
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(s * 0.3, -s * 0.65);
  ctx.quadraticCurveTo(s * 0.2, -s * 1.0, s * 0.4, -s * 0.95);
  ctx.quadraticCurveTo(s * 0.5, -s * 0.8, s * 0.5, -s * 0.65);
  ctx.fill();

  // 4. Rosy Cheek Blush
  ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
  ctx.beginPath();
  ctx.arc(s * 0.45, -s * 0.15, s * 0.14, 0, Math.PI * 2);
  ctx.fill();

  // 5. Cartoon Big Eye (White + Black + Shiny highlight)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(s * 0.48, -s * 0.38, s * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(s * 0.52, -s * 0.38, s * 0.11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(s * 0.55, -s * 0.42, s * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // 6. Orange Cartoon Beak
  ctx.fillStyle = '#F97316';
  ctx.beginPath();
  ctx.moveTo(s * 0.75, -s * 0.38);
  ctx.lineTo(s * 1.15, -s * 0.3);
  ctx.lineTo(s * 0.72, -s * 0.2);
  ctx.closePath();
  ctx.fill();

  // 7. Flapping Wing
  const wingAngle = Math.sin(wingPhase) * 0.75; // dynamic flap rotation
  ctx.save();
  ctx.translate(-s * 0.1, -s * 0.1);
  ctx.rotate(wingAngle);

  ctx.fillStyle = '#EAB308';
  ctx.strokeStyle = '#CA8A04';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.45, s * 0.28, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Draws a colorful Butterfly
 */
function drawButterfly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colorA: string,
  colorB: string,
  wingPhase: number
) {
  ctx.save();
  ctx.translate(x, y);

  const flap = Math.abs(Math.sin(wingPhase));
  const s = size;

  // Left Wing
  ctx.save();
  ctx.scale(flap, 1);
  ctx.fillStyle = colorA;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-s * 0.9, -s * 1.1, -s * 1.4, -s * 0.4, -s * 0.6, s * 0.2);
  ctx.bezierCurveTo(-s * 1.1, s * 0.7, -s * 0.4, s * 1.1, 0, s * 0.3);
  ctx.closePath();
  ctx.fill();

  // Inner wing gradient accent
  ctx.fillStyle = colorB;
  ctx.beginPath();
  ctx.ellipse(-s * 0.45, -s * 0.3, s * 0.25, s * 0.35, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right Wing
  ctx.save();
  ctx.scale(-flap, 1);
  ctx.fillStyle = colorA;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-s * 0.9, -s * 1.1, -s * 1.4, -s * 0.4, -s * 0.6, s * 0.2);
  ctx.bezierCurveTo(-s * 1.1, s * 0.7, -s * 0.4, s * 1.1, 0, s * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = colorB;
  ctx.beginPath();
  ctx.ellipse(-s * 0.45, -s * 0.3, s * 0.25, s * 0.35, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Slender Butterfly Body
  ctx.fillStyle = '#1E1B4B';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.1, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Antennae
  ctx.strokeStyle = '#1E1B4B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.3);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.7, -s * 0.4, -s * 0.85);
  ctx.moveTo(0, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.7, s * 0.4, -s * 0.85);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws Cute Anime / Photobooth Cat Ears & Whiskers
 */
function drawCatEars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  t: number
) {
  const earDistance = width * 0.16;
  const earW = width * 0.13;
  const earH = width * 0.16;
  const earY = cy - width * 0.08;

  // Gentle cute ear twitch
  const twitch = Math.sin(t * 1.2) > 0.85 ? Math.sin(t * 24) * 0.08 : 0;

  // Left Ear
  ctx.save();
  ctx.translate(cx - earDistance, earY);
  ctx.rotate(-0.35 + twitch);

  // Outer ear
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.moveTo(-earW * 0.5, earH * 0.3);
  ctx.quadraticCurveTo(-earW * 0.3, -earH * 0.8, 0, -earH);
  ctx.quadraticCurveTo(earW * 0.3, -earH * 0.8, earW * 0.5, earH * 0.3);
  ctx.closePath();
  ctx.fill();

  // Inner fluffy pink ear
  ctx.fillStyle = '#F472B6';
  ctx.beginPath();
  ctx.moveTo(-earW * 0.3, earH * 0.2);
  ctx.quadraticCurveTo(-earW * 0.15, -earH * 0.55, 0, -earH * 0.75);
  ctx.quadraticCurveTo(earW * 0.15, -earH * 0.55, earW * 0.3, earH * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Right Ear
  ctx.save();
  ctx.translate(cx + earDistance, earY);
  ctx.rotate(0.35 - twitch);

  // Outer ear
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.moveTo(-earW * 0.5, earH * 0.3);
  ctx.quadraticCurveTo(-earW * 0.3, -earH * 0.8, 0, -earH);
  ctx.quadraticCurveTo(earW * 0.3, -earH * 0.8, earW * 0.5, earH * 0.3);
  ctx.closePath();
  ctx.fill();

  // Inner fluffy pink ear
  ctx.fillStyle = '#F472B6';
  ctx.beginPath();
  ctx.moveTo(-earW * 0.3, earH * 0.2);
  ctx.quadraticCurveTo(-earW * 0.15, -earH * 0.55, 0, -earH * 0.75);
  ctx.quadraticCurveTo(earW * 0.15, -earH * 0.55, earW * 0.3, earH * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Soft Rosy Cheeks
  const cheekDist = width * 0.14;
  const cheekY = cy + width * 0.18;
  const cheekGradL = ctx.createRadialGradient(cx - cheekDist, cheekY, 5, cx - cheekDist, cheekY, width * 0.08);
  cheekGradL.addColorStop(0, 'rgba(244, 114, 182, 0.45)');
  cheekGradL.addColorStop(1, 'rgba(244, 114, 182, 0)');
  ctx.fillStyle = cheekGradL;
  ctx.fillRect(cx - cheekDist - width * 0.08, cheekY - width * 0.08, width * 0.16, width * 0.16);

  const cheekGradR = ctx.createRadialGradient(cx + cheekDist, cheekY, 5, cx + cheekDist, cheekY, width * 0.08);
  cheekGradR.addColorStop(0, 'rgba(244, 114, 182, 0.45)');
  cheekGradR.addColorStop(1, 'rgba(244, 114, 182, 0)');
  ctx.fillStyle = cheekGradR;
  ctx.fillRect(cx + cheekDist - width * 0.08, cheekY - width * 0.08, width * 0.16, width * 0.16);

  // Little cute pink heart nose
  drawHeart(ctx, cx, cy + width * 0.13, width * 0.024, '#FB7185', false);
}

/**
 * Main Master function to render AR Head Effects & Beauty Glow onto any Canvas
 */
export function drawArHeadEffect(
  ctx: CanvasRenderingContext2D,
  effect: ArHeadEffect,
  opts: ArRenderOptions
) {
  const { width, height, time, headOffset = 0.26, mirror = false, beautyMode = false } = opts;
  const cx = width * 0.5;
  const cy = height * headOffset;

  ctx.save();

  // 1. Beauty Glow Layer (Soft-focus radiant bloom & skin tone brightening)
  if (beautyMode) {
    ctx.save();
    // Warm, flattering ambient light bloom overlay
    const bloomGrad = ctx.createRadialGradient(cx, cy, width * 0.1, cx, cy, width * 0.6);
    bloomGrad.addColorStop(0, 'rgba(255, 235, 240, 0.16)');
    bloomGrad.addColorStop(0.5, 'rgba(255, 215, 225, 0.08)');
    bloomGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bloomGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle soft vignettes around edges to frame the face
    const edgeVignette = ctx.createRadialGradient(cx, cy, width * 0.35, cx, cy, width * 0.85);
    edgeVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edgeVignette.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
    ctx.fillStyle = edgeVignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  if (effect === 'none') {
    ctx.restore();
    return;
  }

  // -------------------------------------------------------------
  // EFFECT 1: BURUNG DI KEPALA (Apple Photo Booth 3D Circling Birds)
  // -------------------------------------------------------------
  if (effect === 'birds') {
    const rx = width * 0.24;
    const ry = width * 0.085;
    const birdSize = Math.max(22, width * 0.038);
    const speed = 2.4;
    const numBirds = 3;

    // Faint dotted 3D orbit trail
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 240, 180, 0.3)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Sort birds by Z-depth so behind birds render first, front birds render on top!
    const birds = [];
    for (let i = 0; i < numBirds; i++) {
      const angle = time * speed + (i * 2 * Math.PI) / numBirds;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      const z = Math.sin(angle); // -1 is behind head, +1 is in front of head
      // Tangent velocity X indicates flying direction
      const vx = -rx * Math.sin(angle);
      const movingRight = mirror ? vx < 0 : vx > 0;
      const wingPhase = time * 20 + i * 2.5;

      birds.push({ x, y, z, angle, movingRight, wingPhase, index: i });
    }

    // Sort by depth
    birds.sort((a, b) => a.z - b.z);

    for (const bird of birds) {
      const scale = 0.8 + 0.35 * ((bird.z + 1) / 2);
      const depthAlpha = bird.z < -0.3 ? 0.75 : 1.0;

      // Trailing cute yellow stars behind bird
      const trailAngle = bird.angle - 0.22;
      const trailX = cx + rx * Math.cos(trailAngle);
      const trailY = cy + ry * Math.sin(trailAngle);
      drawSparkle(ctx, trailX, trailY, birdSize * 0.45, '#FDE047', time * 3 + bird.index);

      // Draw the animated Bird
      drawAppleBoothBird(
        ctx,
        bird.x,
        bird.y,
        birdSize * scale,
        bird.movingRight,
        bird.wingPhase,
        depthAlpha
      );
    }
  }

  // -------------------------------------------------------------
  // EFFECT 2: LOVE DI KEPALA (Floating Hearts Crown Halo)
  // -------------------------------------------------------------
  else if (effect === 'hearts') {
    const rx = width * 0.20;
    const ry = width * 0.075;
    const baseHeartSize = Math.max(22, width * 0.038);
    const speed = 1.8;
    const numHearts = 6;
    const heartColors = ['#FF2D55', '#FB7185', '#F43F5E', '#EC4899', '#FDA4AF', '#F472B6'];

    const hearts = [];
    for (let i = 0; i < numHearts; i++) {
      const angle = time * speed + (i * 2 * Math.PI) / numHearts;
      const bob = Math.sin(time * 3 + i * 1.3) * (width * 0.015);
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle) + bob;
      const z = Math.sin(angle);
      hearts.push({ x, y, z, index: i, color: heartColors[i % heartColors.length] });
    }

    hearts.sort((a, b) => a.z - b.z);

    for (const h of hearts) {
      const scale = 0.75 + 0.4 * ((h.z + 1) / 2);
      drawHeart(ctx, h.x, h.y, baseHeartSize * scale, h.color, true);
    }

    // Sparkles popping around the hearts
    for (let s = 0; s < 3; s++) {
      const spAngle = time * 1.5 + (s * 2 * Math.PI) / 3;
      const sx = cx + (rx * 1.15) * Math.cos(spAngle);
      const sy = cy + (ry * 1.3) * Math.sin(spAngle) - width * 0.02;
      drawSparkle(ctx, sx, sy, width * 0.02, '#FFE4E6', time * 4 + s);
    }

    // Soft sweet pink cheek blush
    const cheekDist = width * 0.14;
    const cheekY = cy + width * 0.18;
    const blushL = ctx.createRadialGradient(cx - cheekDist, cheekY, 4, cx - cheekDist, cheekY, width * 0.07);
    blushL.addColorStop(0, 'rgba(255, 105, 135, 0.45)');
    blushL.addColorStop(1, 'rgba(255, 105, 135, 0)');
    ctx.fillStyle = blushL;
    ctx.fillRect(cx - cheekDist - width * 0.08, cheekY - width * 0.08, width * 0.16, width * 0.16);

    const blushR = ctx.createRadialGradient(cx + cheekDist, cheekY, 4, cx + cheekDist, cheekY, width * 0.07);
    blushR.addColorStop(0, 'rgba(255, 105, 135, 0.45)');
    blushR.addColorStop(1, 'rgba(255, 105, 135, 0)');
    ctx.fillStyle = blushR;
    ctx.fillRect(cx + cheekDist - width * 0.08, cheekY - width * 0.08, width * 0.16, width * 0.16);
  }

  // -------------------------------------------------------------
  // EFFECT 3: ANGEL HALO (Golden Radiance & Sparkles)
  // -------------------------------------------------------------
  else if (effect === 'halo') {
    const haloW = width * 0.22;
    const haloH = width * 0.07;
    const haloY = cy - width * 0.12 + Math.sin(time * 2.2) * 8;
    const tilt = -0.15; // tilted stylish angle

    ctx.save();
    ctx.translate(cx, haloY);
    ctx.rotate(tilt);

    // Glowing Neon Golden Halo Ring
    ctx.shadowColor = '#FBBF24';
    ctx.shadowBlur = 24;
    ctx.lineWidth = Math.max(6, width * 0.012);
    ctx.strokeStyle = '#FEF08A';

    ctx.beginPath();
    ctx.ellipse(0, 0, haloW, haloH, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bright core
    ctx.lineWidth = Math.max(2.5, width * 0.005);
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Radiant flare points on halo rim
    drawSparkle(ctx, -haloW * 0.7, 0, width * 0.035, '#FFFFFF', time * 2);
    drawSparkle(ctx, haloW * 0.65, haloH * 0.3, width * 0.03, '#FEF08A', time * 3);
    ctx.restore();
  }

  // -------------------------------------------------------------
  // EFFECT 4: DIZZY CARTOON STARS (Retro Looney Tunes Cartoon Stars)
  // -------------------------------------------------------------
  else if (effect === 'stars') {
    const rx = width * 0.23;
    const ry = width * 0.08;
    const starOuter = Math.max(16, width * 0.032);
    const starInner = starOuter * 0.45;
    const numStars = 4;
    const speed = 2.6;

    // Spiral dizziness trail
    ctx.save();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < numStars; i++) {
      const angle = time * speed + (i * 2 * Math.PI) / numStars;
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle);
      const z = Math.sin(angle);
      const scale = 0.8 + 0.35 * ((z + 1) / 2);
      const starRot = time * 4 + i;

      draw5PointStar(ctx, x, y, starOuter * scale, starInner * scale, '#FACC15', starRot);
    }
  }

  // -------------------------------------------------------------
  // EFFECT 5: BUTTERFLIES (Pastel Morpho Butterfly Garden)
  // -------------------------------------------------------------
  else if (effect === 'butterflies') {
    const rx = width * 0.22;
    const ry = width * 0.08;
    const numB = 3;
    const butterflyColors = [
      { a: '#38BDF8', b: '#818CF8' }, // Sky Cyan
      { a: '#EC4899', b: '#F472B6' }, // Pastel Pink
      { a: '#A855F7', b: '#C084FC' }, // Lilac Violet
    ];

    for (let i = 0; i < numB; i++) {
      const angle = time * 1.8 + (i * 2 * Math.PI) / numB;
      const bob = Math.sin(time * 4 + i * 2) * (width * 0.02);
      const x = cx + rx * Math.cos(angle);
      const y = cy + ry * Math.sin(angle) + bob;
      const z = Math.sin(angle);
      const size = Math.max(18, width * 0.028) * (0.8 + 0.3 * ((z + 1) / 2));

      drawButterfly(
        ctx,
        x,
        y,
        size,
        butterflyColors[i].a,
        butterflyColors[i].b,
        time * 16 + i * 3
      );
    }
  }

  // -------------------------------------------------------------
  // EFFECT 6: CAT EARS (Cute Anime Kitty Ears & Blushing Cheeks)
  // -------------------------------------------------------------
  else if (effect === 'cat-ears') {
    drawCatEars(ctx, cx, cy, width, time);
  }

  ctx.restore();
}
