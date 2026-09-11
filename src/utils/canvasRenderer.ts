import QRCode from 'qrcode';
import { BoothSettings, CapturedShot } from '../types';
import { FILTER_OPTIONS, FRAME_OPTIONS } from './presets';

/**
 * Generates a QR Code as an HTMLImageElement
 */
export async function generateQrImage(
  text: string, 
  darkColor = '#000000', 
  lightColor = '#ffffff'
): Promise<HTMLImageElement> {
  const qrDataUrl = await QRCode.toDataURL(text, {
    margin: 1,
    width: 240,
    color: {
      dark: darkColor,
      light: lightColor
    }
  });
  return loadImage(qrDataUrl);
}

/**
 * Loads an image from a Data URL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * High-Resolution Canvas Generator for AdimasBooth
 * Generates an ultra-crisp photo strip or single polaroid frame
 */
export async function renderPhotoStrip(
  shots: CapturedShot[],
  settings: BoothSettings,
  sessionId?: string
): Promise<string> {
  if (shots.length === 0) return '';

  const isStrip = shots.length > 1;
  const frameConfig = FRAME_OPTIONS.find((f) => f.id === settings.frameId) || FRAME_OPTIONS[0];
  const filterConfig = FILTER_OPTIONS.find((f) => f.id === settings.filter) || FILTER_OPTIONS[0];

  // Canvas dimensions (high-res for printing & sharing)
  // Base photo cell size:
  const isWide = settings.aspectRatio === '16:9';
  const photoW = 800;
  const photoH = isWide ? Math.round((photoW * 9) / 16) : Math.round((photoW * 3) / 4);

  // Margins and paddings
  const isVintage = settings.frameId === 'vintage';
  const sideMargin = isVintage ? 120 : 60; // extra space for film sprockets
  const topMargin = 70;
  const photoGap = 36;
  const bottomFooterH = isStrip ? 220 : 160;

  const canvasW = photoW + sideMargin * 2;
  const canvasH = isStrip
    ? topMargin + shots.length * photoH + (shots.length - 1) * photoGap + bottomFooterH
    : topMargin + photoH + bottomFooterH;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // 1. Draw Background
  const bgColor = settings.frameBgColor || frameConfig.bgHex;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Background specific flourishes
  if (settings.frameId === 'stage') {
    // Stage concert gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
    bgGrad.addColorStop(0, '#0b0f19');
    bgGrad.addColorStop(0.5, '#120f24');
    bgGrad.addColorStop(1, '#080d14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Subtle neon border accent around entire card
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, canvasW - 24, canvasH - 24);

    ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, canvasW - 36, canvasH - 36);
  } else if (settings.frameId === 'vintage') {
    // Subtle sepia paper warmth
    ctx.fillStyle = '#f6f0dd';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw 35mm film negative sprockets (perforations) along left and right borders
    const sprocketW = 28;
    const sprocketH = 38;
    const sprocketRadius = 6;
    const sprocketInterval = 65;

    ctx.fillStyle = '#1c1917';
    for (let y = 30; y < canvasH - 30; y += sprocketInterval) {
      // Left sprocket
      drawRoundedRect(ctx, 35, y, sprocketW, sprocketH, sprocketRadius);
      ctx.fill();
      // Right sprocket
      drawRoundedRect(ctx, canvasW - 35 - sprocketW, y, sprocketW, sprocketH, sprocketRadius);
      ctx.fill();
    }

    // Vintage film brand markings along left edge
    ctx.save();
    ctx.translate(22, canvasH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 16px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SAFETY FILM  •  ADIMAS 400-DX  •  35MM', 0, 0);
    ctx.restore();
  }

  // 2. Render Photos
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const img = await loadImage(shot.dataUrl);

    const x = sideMargin;
    const y = topMargin + i * (photoH + photoGap);

    // Save state for filter & clipping
    ctx.save();

    // Subtle shadow behind photo (for classic or pastel frames)
    if (settings.frameId === 'classic' || settings.frameId === 'pastel') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
    }

    // Border around each individual photo
    if (settings.frameId === 'stage') {
      ctx.strokeStyle = i % 2 === 0 ? '#38bdf8' : '#f43f5e';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4);
    } else if (settings.frameId === 'vintage') {
      ctx.fillStyle = '#111827';
      ctx.fillRect(x - 6, y - 6, photoW + 12, photoH + 12);
    } else if (settings.frameId === 'monochrome') {
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, photoW + 2, photoH + 2);
    }

    // Clip to rounded rectangle
    const cornerRadius = settings.frameId === 'vintage' ? 4 : 8;
    drawRoundedRect(ctx, x, y, photoW, photoH, cornerRadius);
    ctx.clip();

    // Apply Filter to Canvas context
    if (filterConfig.canvasFilter && filterConfig.canvasFilter !== 'none') {
      ctx.filter = filterConfig.canvasFilter;
    }

    // Draw the image filling the frame correctly (crop / object-fit cover)
    const imgAspect = img.width / img.height;
    const cellAspect = photoW / photoH;

    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (imgAspect > cellAspect) {
      // Image is wider than cell -> crop sides
      sw = img.height * cellAspect;
      sx = (img.width - sw) / 2;
    } else {
      // Image is taller than cell -> crop top/bottom
      sh = img.width / cellAspect;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, photoW, photoH);

    // Reset filter
    ctx.restore();

    // Frame index badge in corner of each photo
    if (isStrip) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      drawRoundedRect(ctx, x + 16, y + 16, 44, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`0${i + 1}`, x + 38, y + 30);
      ctx.restore();
    }
  }

  // 3. Footer Branding & Typography
  const footerCenterY = canvasH - bottomFooterH / 2 + 10;
  ctx.textAlign = 'center';

  // Format date and time
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).toUpperCase();

  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const mainCaption = settings.customCaption.trim() || 'ADIMAS BOOTH';

  if (settings.frameId === 'adimas-noir' || settings.frameId === 'adimas-white') {
    // Minimalist Studio Branding
    const isDark = settings.frameId === 'adimas-noir';
    const primaryColor = isDark ? '#ffffff' : '#0a0a0a';
    const secondaryColor = isDark ? '#888888' : '#777777';

    ctx.save();
    ctx.fillStyle = primaryColor;
    ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.textAlign = 'left';
    const brandX = sideMargin + 10;
    
    const brandTitle = (settings.customCaption.trim() || 'adimas studio').toLowerCase();
    ctx.fillText(brandTitle, brandX, footerCenterY - 24);

    ctx.fillStyle = secondaryColor;
    ctx.font = '600 13px "Space Mono", monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText(`SELF PHOTO STUDIO  •  ORIGINAL 35MM`, brandX, footerCenterY + 6);

    ctx.fillText(`${dateFormatted} ${timeFormatted}  •  ARCHIVE BOX`, brandX, footerCenterY + 32);
    ctx.restore();

  } else if (settings.frameId === 'classic') {
    // Minimalist Studio Branding
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 32px "Cabinet Grotesk", "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(mainCaption.toUpperCase(), canvasW / 2, footerCenterY - 24);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 15px "Space Mono", monospace';
    ctx.letterSpacing = '3px';
    const subText = settings.showDate
      ? `${dateFormatted}  •  STUDIO ARCHIVE  •  ${timeFormatted}`
      : 'STUDIO ARCHIVE  •  35MM PHOTOBOOTH';
    ctx.fillText(subText, canvasW / 2, footerCenterY + 14);

    // Thin accent line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(canvasW / 2 - 140, footerCenterY + 36);
    ctx.lineTo(canvasW / 2 + 140, footerCenterY + 36);
    ctx.stroke();

  } else if (settings.frameId === 'stage') {
    // Concert / Stage aesthetic
    // Sound wave graphic bars
    const barCount = 19;
    const barW = 4;
    const barGap = 6;
    const totalWaveW = barCount * (barW + barGap);
    const waveStartX = (canvasW - totalWaveW) / 2;

    for (let b = 0; b < barCount; b++) {
      const h = 8 + Math.sin(b * 0.4) * 14 + (b % 3) * 6;
      ctx.fillStyle = b % 2 === 0 ? '#38bdf8' : '#f43f5e';
      ctx.fillRect(waveStartX + b * (barW + barGap), footerCenterY - 48 - h / 2, barW, h);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(mainCaption.toUpperCase(), canvasW / 2, footerCenterY - 6);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px "Space Mono", monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText(`★ VIP PASS  •  ${dateFormatted}  •  WORLD TOUR ★`, canvasW / 2, footerCenterY + 26);

  } else if (settings.frameId === 'vintage') {
    // Retro Y2K film with orange LCD date
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 30px "Space Mono", monospace';
    ctx.letterSpacing = '4px';
    ctx.fillText(mainCaption.toUpperCase(), canvasW / 2, footerCenterY - 20);

    ctx.fillStyle = '#b45309';
    ctx.font = '14px "Space Mono", monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText('ANALOG EMULSION  •  DX CODED  •  ISO 400', canvasW / 2, footerCenterY + 10);

    // Retro Orange Datestamp in bottom right
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const retroDate = `'${yy} ${mm} ${dd}`;

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 22px "Space Mono", monospace';
    ctx.shadowColor = '#fdba74';
    ctx.shadowBlur = 6;
    ctx.fillText(retroDate, canvasW - sideMargin, footerCenterY + 38);
    ctx.shadowBlur = 0;

  } else if (settings.frameId === 'pastel') {
    // Dreamy Blush / Purikura aesthetic
    ctx.fillStyle = '#831843';
    ctx.font = '800 32px "Plus Jakarta Sans", cursive, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(`✧ ${mainCaption} ✧`, canvasW / 2, footerCenterY - 18);

    ctx.fillStyle = '#db2777';
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`♡ sweetest memories ♡  ${dateFormatted}`, canvasW / 2, footerCenterY + 16);

  } else if (settings.frameId === 'monochrome') {
    // Luxury Editorial Noir with Barcode
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 30px "Cabinet Grotesk", sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText(mainCaption.toUpperCase(), canvasW / 2, footerCenterY - 30);

    // Draw Barcode lines
    const barcodeW = 280;
    const barStartX = (canvasW - barcodeW) / 2;
    const barY = footerCenterY - 10;
    const barHeight = 24;

    ctx.fillStyle = '#e2e8f0';
    let currX = barStartX;
    const pattern = [2, 1, 3, 1, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 2, 3, 1];
    for (let p = 0; p < pattern.length && currX < barStartX + barcodeW; p++) {
      const w = pattern[p] * 2.5;
      if (p % 2 === 0) {
        ctx.fillRect(currX, barY, w, barHeight);
      }
      currX += w + 2.5;
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Space Mono", monospace';
    ctx.letterSpacing = '3px';
    ctx.fillText(`NO. ${Math.floor(now.getTime() / 1000)}  •  EDITION 01/01`, canvasW / 2, footerCenterY + 32);
  }

  // Draw QR Code on the bottom right corner if enabled and on strip
  if (isStrip && settings.showQrCode !== false) {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://adimasbooth.app';
      const qrUrl = sessionId ? `${baseUrl}/?session=${sessionId}` : baseUrl;
      const isDarkCard = settings.frameId === 'adimas-noir' || settings.frameId === 'monochrome' || settings.frameId === 'stage';
      const qrImg = await generateQrImage(
        qrUrl, 
        isDarkCard ? '#ffffff' : '#000000', 
        isDarkCard ? '#0a0a0a' : '#ffffff'
      );
      const qrSize = 100;
      const qrX = canvasW - sideMargin - qrSize;
      const qrY = canvasH - bottomFooterH + (bottomFooterH - qrSize) / 2 - 8;

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = isDarkCard ? '#888888' : '#777777';
      ctx.font = 'bold 9px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN PHOTO', qrX + qrSize / 2, qrY + qrSize + 14);
    } catch (err) {
      console.warn('QR Code drawing failed:', err);
    }
  }

  // Draw optional sticker overlay
  if (settings.sticker !== 'none') {
    drawStickerBadge(ctx, settings.sticker, canvasW - sideMargin - 15, footerCenterY - 45);
  }

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * High-Resolution Single Photo Renderer (Mentahan / Polosan 1/1)
 * Renders the clean, full-bleed raw photo without borders, frames, or footers
 */
export async function renderSinglePhoto(
  shot: CapturedShot,
  settings: BoothSettings
): Promise<string> {
  const filterConfig = FILTER_OPTIONS.find((f) => f.id === settings.filter) || FILTER_OPTIONS[0];
  const img = await loadImage(shot.dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  if (filterConfig.canvasFilter && filterConfig.canvasFilter !== 'none') {
    ctx.filter = filterConfig.canvasFilter;
  }

  ctx.drawImage(img, 0, 0, img.width, img.height);
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Draws rounded rectangle path on canvas
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draws sticker badge embellishment
 */
function drawStickerBadge(
  ctx: CanvasRenderingContext2D,
  sticker: string,
  x: number,
  y: number
) {
  ctx.save();
  ctx.font = '28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (sticker === 'hearts') {
    ctx.fillText('💖', x, y);
  } else if (sticker === 'stars') {
    ctx.fillText('✨', x, y);
  } else if (sticker === 'barcode') {
    ctx.fillText('⚡', x, y);
  } else if (sticker === 'film') {
    ctx.fillText('🎞️', x, y);
  }
  ctx.restore();
}
