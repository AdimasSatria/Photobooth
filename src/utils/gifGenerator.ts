import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { CapturedShot, FilterType } from '../types';
import { FILTER_OPTIONS } from './presets';
import { loadImage } from './canvasRenderer';

export interface GifOptions {
  delay?: number; // ms per frame (default: 450ms)
  width?: number; // GIF width (default: 540px)
  boomerang?: boolean; // 1-2-3-4-3-2 looping (default: true)
  filter?: FilterType;
  caption?: string;
  showWatermark?: boolean;
}

/**
 * Generates an animated photobooth looping GIF from captured shots
 */
export async function generatePhotoboothGif(
  shots: CapturedShot[],
  options: GifOptions = {}
): Promise<{ url: string; blob: Blob; dataUrl: string }> {
  if (shots.length === 0) {
    throw new Error('No shots available to create GIF');
  }

  const {
    delay = 450,
    width = 540,
    boomerang = true,
    filter = 'normal',
    caption = 'ADIMAS BOOTH',
    showWatermark = false
  } = options;

  const filterConfig = FILTER_OPTIONS.find((f) => f.id === filter) || FILTER_OPTIONS[0];

  // Load first image to determine aspect ratio
  const firstImg = await loadImage(shots[0].dataUrl);
  const aspect = firstImg.width / firstImg.height;
  const height = Math.round(width / aspect);

  // Setup offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable for GIF');

  // Load all images in parallel
  const images = await Promise.all(shots.map((s) => loadImage(s.dataUrl)));

  // Build frame sequence (boomerang: 0,1,2,3,2,1 if 4 shots)
  const sequence: number[] = [];
  for (let i = 0; i < images.length; i++) {
    sequence.push(i);
  }
  if (boomerang && images.length > 2) {
    for (let i = images.length - 2; i > 0; i--) {
      sequence.push(i);
    }
  }

  const gif = GIFEncoder();

  for (let sIdx = 0; sIdx < sequence.length; sIdx++) {
    const frameIndex = sequence[sIdx];
    const img = images[frameIndex];

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Apply filter
    if (filterConfig.canvasFilter && filterConfig.canvasFilter !== 'none') {
      ctx.filter = filterConfig.canvasFilter;
    }

    // Draw image to fill canvas (cover)
    const imgAspect = img.width / img.height;
    const cellAspect = width / height;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (imgAspect > cellAspect) {
      sw = img.height * cellAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / cellAspect;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
    ctx.restore();

    // Draw photobooth HUD watermark on GIF frames
    if (showWatermark) {
      ctx.save();
      // Top bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, width, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Space Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(`● REC [${frameIndex + 1}/${images.length}]`, 12, 14);

      // Bottom bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, height - 32, width, 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '2px';
      ctx.textAlign = 'left';
      ctx.fillText(caption.toUpperCase(), 12, height - 16);

      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px "Space Mono", monospace';
      ctx.fillText('PHOTOBOOTH GIF', width - 12, height - 16);
      ctx.restore();
    }

    // Read pixel data & encode frame
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;

    // Palette quantization (256 colors)
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);

    // Write frame to GIF
    gif.writeFrame(index, width, height, {
      palette,
      delay
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);

  // Convert to base64 Data URL for cross-device transmission
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  return { url, blob, dataUrl };
}
