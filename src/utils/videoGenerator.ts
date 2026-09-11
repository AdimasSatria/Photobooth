import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { CapturedShot, FilterType } from '../types';
import { FILTER_OPTIONS } from './presets';
import { loadImage } from './canvasRenderer';

export interface VideoOptions {
  frameDuration?: number; // ms per photo shot (default: 380ms)
  width?: number; // video width (default: 720px, even number required for MP4)
  boomerang?: boolean; // 0-1-2-3-2-1 looping (default: true)
  loops?: number; // repeat count so video is ~3.5-5s for Instagram/WhatsApp Story (default: 2)
  filter?: FilterType;
}

export interface VideoResult {
  url: string;
  blob: Blob;
  dataUrl: string;
  mimeType: string;
  extension: 'mp4' | 'webm';
}

/**
 * Generates an MP4/WebM short looping video suitable for Instagram Story / WhatsApp Status
 * Rendered without frames, borders, or watermarks (pure mentahan polosan).
 */
export async function generatePhotoboothVideo(
  shots: CapturedShot[],
  options: VideoOptions = {}
): Promise<VideoResult> {
  if (shots.length === 0) {
    throw new Error('No shots available to create video');
  }

  const {
    frameDuration = 380,
    width = 720,
    boomerang = true,
    loops = 2,
    filter = 'normal',
  } = options;

  const filterConfig = FILTER_OPTIONS.find((f) => f.id === filter) || FILTER_OPTIONS[0];

  // Load first image to determine aspect ratio
  const firstImg = await loadImage(shots[0].dataUrl);
  const aspect = firstImg.width / firstImg.height;

  // H.264 requires even dimensions
  const videoWidth = Math.floor(width / 2) * 2;
  const videoHeight = Math.floor((videoWidth / aspect) / 2) * 2;

  // Setup offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable for video');

  // Pre-load all shot images in parallel
  const images = await Promise.all(shots.map((s) => loadImage(s.dataUrl)));

  // Build boomerang sequence (e.g. 0,1,2,3,2,1)
  const singleLoop: number[] = [];
  for (let i = 0; i < images.length; i++) {
    singleLoop.push(i);
  }
  if (boomerang && images.length > 2) {
    for (let i = images.length - 2; i > 0; i--) {
      singleLoop.push(i);
    }
  }

  // Repeat sequence so video duration meets Instagram Story requirement (~3-5 seconds)
  const fullSequence: number[] = [];
  for (let l = 0; l < Math.max(1, loops); l++) {
    fullSequence.push(...singleLoop);
  }

  // Draw single frame function (clean mentahan, no frames/watermarks)
  const renderFrame = (imgIndex: number) => {
    const img = images[imgIndex];
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    ctx.save();
    if (filterConfig.canvasFilter && filterConfig.canvasFilter !== 'none') {
      ctx.filter = filterConfig.canvasFilter;
    }

    const imgAspect = img.width / img.height;
    const cellAspect = videoWidth / videoHeight;
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

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, videoWidth, videoHeight);
    ctx.restore();
  };

  // Attempt Method 1: WebCodecs VideoEncoder + mp4-muxer (Hardware accelerated, ultra fast, true .mp4)
  if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined') {
    try {
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: {
          codec: 'avc',
          width: videoWidth,
          height: videoHeight,
        },
        fastStart: 'in-memory',
      });

      let encoderError: Error | null = null;
      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => {
          encoderError = e;
        },
      });

      videoEncoder.configure({
        codec: 'avc1.42001f', // H.264 Baseline Profile level 3.1
        width: videoWidth,
        height: videoHeight,
        bitrate: 3_500_000,
      });

      const frameDurationUs = frameDuration * 1000;
      let currentTimestampUs = 0;

      for (let i = 0; i < fullSequence.length; i++) {
        if (encoderError) throw encoderError;
        renderFrame(fullSequence[i]);

        const videoFrame = new VideoFrame(canvas, {
          timestamp: currentTimestampUs,
          duration: frameDurationUs,
        });

        videoEncoder.encode(videoFrame, { keyFrame: i % 8 === 0 });
        videoFrame.close();
        currentTimestampUs += frameDurationUs;
      }

      await videoEncoder.flush();
      videoEncoder.close();
      muxer.finalize();

      const { buffer } = muxer.target;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const dataUrl = await blobToDataUrl(blob);

      return {
        url,
        blob,
        dataUrl,
        mimeType: 'video/mp4',
        extension: 'mp4',
      };
    } catch (err) {
      console.warn('WebCodecs VideoEncoder fallback to MediaRecorder:', err);
    }
  }

  // Method 2: MediaRecorder fallback
  return await recordWithMediaRecorder(
    canvas,
    renderFrame,
    fullSequence,
    frameDuration
  );
}

/**
 * Fallback recorder using canvas.captureStream() and MediaRecorder
 */
async function recordWithMediaRecorder(
  canvas: HTMLCanvasElement,
  renderFrame: (index: number) => void,
  sequence: number[],
  frameDuration: number
): Promise<VideoResult> {
  const fps = 30;
  const stream = canvas.captureStream(fps);

  let mimeType = 'video/mp4';
  let extension: 'mp4' | 'webm' = 'mp4';

  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      mimeType = 'video/mp4;codecs=avc1';
      extension = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
      extension = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
      extension = 'webm';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
      extension = 'webm';
    }
  }

  const chunks: BlobPart[] = [];
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000 })
    : new MediaRecorder(stream);

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }));
    };
    recorder.onerror = (e) => reject(e);
  });

  recorder.start();

  // Play each frame for frameDuration
  for (let i = 0; i < sequence.length; i++) {
    renderFrame(sequence[i]);
    await new Promise((r) => setTimeout(r, frameDuration));
  }

  // Give 100ms for last frame stream buffer
  await new Promise((r) => setTimeout(r, 100));
  recorder.stop();

  const blob = await recordingPromise;
  const url = URL.createObjectURL(blob);
  const dataUrl = await blobToDataUrl(blob);

  return {
    url,
    blob,
    dataUrl,
    mimeType: blob.type || mimeType,
    extension,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
