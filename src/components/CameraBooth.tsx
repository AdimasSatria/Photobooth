import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, AlertCircle, RefreshCw, Upload, Sparkles, Instagram, ExternalLink, Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { BoothSettings, ArHeadEffect } from '../types';
import { FrameOverlay } from './FrameOverlay';
import { FILTER_OPTIONS, AR_EFFECT_OPTIONS } from '../utils/presets';
import { drawArHeadEffect } from '../utils/arRenderer';

interface CameraBoothProps {
  settings: BoothSettings;
  isCapturing: boolean;
  countdown: number | null;
  flashActive: boolean;
  burstIndex: number | null;
  totalShots: number;
  onFrameCaptured?: (dataUrl: string) => void;
  registerCaptureHandler: (fn: () => Promise<string>) => void;
  onUpdateSettings?: (partial: Partial<BoothSettings>) => void;
}

export const CameraBooth: React.FC<CameraBoothProps> = ({
  settings,
  isCapturing,
  countdown,
  flashActive,
  burstIndex,
  totalShots,
  registerCaptureHandler,
  onUpdateSettings
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const arCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraState, setCameraState] = useState<'idle' | 'loading' | 'ready' | 'error' | 'simulated'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [timecode, setTimecode] = useState<string>('00:12:44:02');

  // Simulated running timecode
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const f = String(Math.floor((now.getMilliseconds() / 1000) * 24)).padStart(2, '0');
      setTimecode(`${h}:${m}:${s}:${f}`);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Get active filter css (including beauty mode enhancement)
  const baseFilter = FILTER_OPTIONS.find((f) => f.id === settings.filter)?.cssFilter || 'none';
  const activeFilter = (settings.filter === 'normal' && settings.beautyMode)
    ? 'contrast(104%) brightness(109%) saturate(118%)'
    : baseFilter;

  // Real-time 60fps AR Canvas Render Loop
  useEffect(() => {
    let animId: number;

    const renderLoop = () => {
      const canvas = arCanvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
          canvas.width = Math.round(rect.width);
          canvas.height = Math.round(rect.height);
        }

        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (settings.arHeadEffect !== 'none' || settings.beautyMode) {
            drawArHeadEffect(ctx, settings.arHeadEffect, {
              width: canvas.width,
              height: canvas.height,
              time: performance.now() / 1000,
              headOffset: settings.headPositionOffset ?? 0.26,
              mirror: settings.mirror,
              beautyMode: settings.beautyMode,
            });
          }
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [settings.arHeadEffect, settings.beautyMode, settings.headPositionOffset, settings.mirror]);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setCameraState('loading');
    setErrorMessage('');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setCameraState('ready');
        };
      }
    } catch (err: unknown) {
      const error = err as Error;
      setCameraState('error');
      setErrorMessage(
        error.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please enable webcam access.'
          : 'Camera device unavailable. You can continue in Studio Simulation mode.'
      );
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Fallback simulated frame generator
  const generateSimulatedFrame = useCallback((): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = settings.aspectRatio === '16:9' ? 720 : 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#151515');
    grad.addColorStop(0.5, '#222222');
    grad.addColorStop(1, '#0A0A0A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vignette
    const spot = ctx.createRadialGradient(
      canvas.width * 0.5,
      canvas.height * 0.45,
      50,
      canvas.width * 0.5,
      canvas.height * 0.5,
      500
    );
    spot.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    spot.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subject silhouette
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height * 0.42, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height * 0.9, 260, 180, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ADIMAS BOOTH • IMMERSIVE LIVE', canvas.width / 2, canvas.height - 40);

    // Bake AR Head effect into simulated frame
    if (settings.arHeadEffect !== 'none' || settings.beautyMode) {
      drawArHeadEffect(ctx, settings.arHeadEffect, {
        width: canvas.width,
        height: canvas.height,
        time: performance.now() / 1000,
        headOffset: settings.headPositionOffset ?? 0.26,
        mirror: false,
        beautyMode: settings.beautyMode,
      });
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [settings.aspectRatio, settings.arHeadEffect, settings.beautyMode, settings.headPositionOffset]);

  // Capture frame handler
  const captureFrame = useCallback(async (): Promise<string> => {
    if (uploadedImage) {
      if (settings.arHeadEffect !== 'none' || settings.beautyMode) {
        const img = new Image();
        img.src = uploadedImage;
        await new Promise((res) => {
          img.onload = res;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 1280;
        canvas.height = img.height || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          drawArHeadEffect(ctx, settings.arHeadEffect, {
            width: canvas.width,
            height: canvas.height,
            time: performance.now() / 1000,
            headOffset: settings.headPositionOffset ?? 0.26,
            mirror: false,
            beautyMode: settings.beautyMode,
          });
          return canvas.toDataURL('image/jpeg', 0.95);
        }
      }
      return uploadedImage;
    }

    if (cameraState === 'simulated' || !videoRef.current || cameraState !== 'ready') {
      return generateSimulatedFrame();
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;

    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    if (settings.mirror) {
      ctx.translate(vw, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Bake AR Effect and Beauty Glow directly into high-res snapshot
    if (settings.arHeadEffect !== 'none' || settings.beautyMode) {
      drawArHeadEffect(ctx, settings.arHeadEffect, {
        width: vw,
        height: vh,
        time: performance.now() / 1000,
        headOffset: settings.headPositionOffset ?? 0.26,
        mirror: false,
        beautyMode: settings.beautyMode,
      });
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [cameraState, uploadedImage, settings.mirror, settings.arHeadEffect, settings.beautyMode, settings.headPositionOffset, generateSimulatedFrame]);

  useEffect(() => {
    registerCaptureHandler(captureFrame);
  }, [registerCaptureHandler, captureFrame]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          setCameraState('simulated');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center bg-[#050505] p-4 sm:p-8 relative overflow-hidden">
      {/* Immersive Viewfinder Box */}
      <div 
        id="camera-viewfinder-container"
        className={`relative w-full max-w-[720px] bg-[#111] rounded-2xl overflow-hidden border border-[#222] shadow-[0_0_80px_rgba(255,255,255,0.02)] transition-all duration-300 ${
          settings.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/3]'
        }`}
      >
        {/* Shutter Flash Animation Overlay */}
        {flashActive && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-shutter-flash" />
        )}

        {/* Live Camera Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-200 ${
            settings.mirror ? 'scale-x-[-1]' : 'scale-x-100'
          }`}
          style={{ filter: activeFilter }}
        />

        {/* Live Real-time AR Effects & Beauty Canvas Overlay */}
        <canvas
          ref={arCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-15"
        />

        {/* Uploaded Image fallback display */}
        {cameraState === 'simulated' && uploadedImage && (
          <img
            src={uploadedImage}
            alt="Simulated Booth View"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: activeFilter }}
          />
        )}

        {/* Simulated Standby View with Immersive UI pulsing circle */}
        {cameraState === 'simulated' && !uploadedImage && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]"
            style={{ filter: activeFilter }}
          >
            <div className="text-center">
              <div className="w-20 h-20 border-2 border-[#444] rounded-full flex items-center justify-center animate-pulse mb-4 mx-auto">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              </div>
              <p className="text-[#888] uppercase text-xs tracking-widest font-mono">Camera Active · Mirrored</p>
            </div>
          </div>
        )}

        {/* Subtle 24px framing overlay */}
        <div className="absolute inset-0 border-[24px] border-white pointer-events-none opacity-5" />

        {/* Frame Overlays (Classic / Stage / Y2K) */}
        <FrameOverlay
          frameId={settings.frameId}
          aspectRatio={settings.aspectRatio}
          showViewfinderGuides={!isCapturing}
        />

        {/* Top-Left: REC Indicator & Timecode */}
        <div className="absolute top-6 left-6 flex items-center gap-2 z-20 pointer-events-none">
          <div className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded uppercase tracking-tighter shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            REC
          </div>
          <span className="text-xs font-mono text-white/80 tracking-wider drop-shadow-md">
            {timecode}
          </span>
        </div>

        {/* Bottom-Left: Technical Specs */}
        <div className="absolute bottom-6 left-6 text-xs text-[#888] uppercase tracking-widest font-mono z-20 pointer-events-none drop-shadow-md">
          ISO 400 · 1/60 · f2.8
        </div>

        {/* Bottom-Right: Burst Indicator Dots */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 z-20 pointer-events-none">
          {[0, 1, 2, 3].map((idx) => {
            const isDone = burstIndex !== null && idx < burstIndex;
            const isCurrent = burstIndex === idx;
            return (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-red-600 scale-125 shadow-[0_0_8px_rgba(220,38,38,0.8)]'
                    : isDone
                    ? 'bg-white opacity-90'
                    : 'bg-white opacity-20'
                }`}
              />
            );
          })}
        </div>

        {/* Large Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
            <div className="relative flex items-center justify-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/40 flex items-center justify-center animate-pulse">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black/80 border border-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.2)]">
                  <span className="text-6xl sm:text-7xl font-light text-white font-mono scale-110 transition-transform">
                    {countdown}
                  </span>
                </div>
              </div>
            </div>

            {burstIndex !== null && (
              <div className="mt-5 px-4 py-1.5 rounded-full bg-[#111] border border-[#333] text-xs font-mono text-white uppercase tracking-widest">
                Shot {burstIndex + 1} of {totalShots}
              </div>
            )}
          </div>
        )}

        {/* Camera Permission / Error Dialog Fallback */}
        {cameraState === 'error' && (
          <div className="absolute inset-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full border border-[#333] bg-[#111] flex items-center justify-center mb-3 text-white">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-medium uppercase tracking-widest text-white mb-1">Camera Permission Required</h4>
            <p className="text-xs text-[#888] max-w-sm mb-5 font-mono leading-relaxed">{errorMessage}</p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={startCamera}
                className="px-5 py-2 rounded-full border border-[#333] text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>

              <button
                onClick={() => setCameraState('simulated')}
                className="px-5 py-2 rounded-full bg-white text-black text-xs uppercase tracking-widest font-medium hover:bg-[#CCC] transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simulation Mode
              </button>

              <label className="px-5 py-2 rounded-full border border-[#333] text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                Upload Photo
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* AR & Beauty Filter Bar */}
      {onUpdateSettings && (
        <div className="mt-5 w-full max-w-[720px] flex flex-col items-center gap-2.5 z-10 px-2">
          {/* Row 1: Beauty Glow + Effect Quick Selectors */}
          <div className="w-full flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {/* Beauty Glow Toggle Button */}
            <button
              id="btn-toggle-beauty-glow"
              onClick={() => onUpdateSettings({ beautyMode: !settings.beautyMode })}
              className={`shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                settings.beautyMode
                  ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-400 text-pink-200 ring-1 ring-pink-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-[#111] border-[#333] text-[#888] hover:text-white hover:border-[#555]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${settings.beautyMode ? 'text-pink-400 animate-pulse' : ''}`} />
              <span>Beauty Glow: {settings.beautyMode ? 'ON ✨' : 'OFF'}</span>
            </button>

            {/* Quick AR Effect Buttons */}
            <div className="flex items-center gap-1.5">
              {AR_EFFECT_OPTIONS.map((eff) => {
                const isActive = settings.arHeadEffect === eff.id;
                return (
                  <button
                    key={eff.id}
                    id={`btn-ar-effect-${eff.id}`}
                    onClick={() => onUpdateSettings({ arHeadEffect: eff.id })}
                    title={eff.description}
                    className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black border-white font-semibold shadow-[0_0_12px_rgba(255,255,255,0.25)]'
                        : 'bg-[#111] border-[#262626] text-[#AAA] hover:text-white hover:border-[#444]'
                    }`}
                  >
                    <span>{eff.emoji}</span>
                    <span className="text-[11px] whitespace-nowrap">{eff.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Head Offset Adjuster (if an effect is active) */}
          {settings.arHeadEffect !== 'none' && (
            <div className="flex items-center gap-3 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#AAA]">
              <span>Posisi Efek:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onUpdateSettings({
                      headPositionOffset: Math.max(0.16, (settings.headPositionOffset ?? 0.26) - 0.03),
                    })
                  }
                  title="Naikkan posisi efek di kepala"
                  className="px-2 py-0.5 rounded bg-[#222] hover:bg-white hover:text-black transition-colors flex items-center gap-1 text-[10px]"
                >
                  <ChevronUp className="w-3 h-3" />
                  Naik
                </button>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      headPositionOffset: Math.min(0.38, (settings.headPositionOffset ?? 0.26) + 0.03),
                    })
                  }
                  title="Turunkan posisi efek di kepala"
                  className="px-2 py-0.5 rounded bg-[#222] hover:bg-white hover:text-black transition-colors flex items-center gap-1 text-[10px]"
                >
                  <ChevronDown className="w-3 h-3" />
                  Turun
                </button>
                <button
                  onClick={() => onUpdateSettings({ headPositionOffset: 0.26 })}
                  className="px-1.5 py-0.5 text-[9px] text-[#666] hover:text-white underline ml-1"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Option Pills under Viewfinder (Matching Immersive UI) */}
      {onUpdateSettings && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 z-10">
          <button
            onClick={() => onUpdateSettings({ timerSeconds: settings.timerSeconds === 3 ? 0 : 3 })}
            className={`px-5 py-2 rounded-full border text-xs uppercase tracking-widest transition-all cursor-pointer ${
              settings.timerSeconds === 3
                ? 'bg-white text-black border-white'
                : 'border-[#333] text-[#AAA] hover:bg-white hover:text-black'
            }`}
          >
            3s Timer
          </button>
          <button
            onClick={() => onUpdateSettings({ timerSeconds: settings.timerSeconds === 5 ? 0 : 5 })}
            className={`px-5 py-2 rounded-full border text-xs uppercase tracking-widest transition-all cursor-pointer ${
              settings.timerSeconds === 5
                ? 'bg-white text-black border-white'
                : 'border-[#333] text-[#AAA] hover:bg-white hover:text-black'
            }`}
          >
            5s Timer
          </button>
          <button
            onClick={() => onUpdateSettings({ shotMode: settings.shotMode === 'strip' ? 'single' : 'strip' })}
            className={`px-5 py-2 rounded-full border text-xs uppercase tracking-widest transition-all cursor-pointer ${
              settings.shotMode === 'strip'
                ? 'bg-[#1A1A1A] text-white border-[#555]'
                : 'border-[#333] text-[#AAA] hover:bg-white hover:text-black'
            }`}
          >
            {settings.shotMode === 'strip' ? 'Burst Mode (4 Shots)' : 'Single Shot'}
          </button>
        </div>
      )}

      {/* Subtle Support / Contact Link */}
      {!isCapturing && (
        <div className="mt-4 pb-2 flex items-center justify-center text-center z-10">
          <a
            href="https://www.instagram.com/hi_adimassatria?stkn=eDc3OHk3em5sYXkw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 hover:border-white/20 text-[11px] font-mono text-[#888] hover:text-white transition-all group"
          >
            <Instagram className="w-3 h-3 text-pink-400 group-hover:scale-110 transition-transform" />
            <span>If you find any problem, please contact me: <strong className="text-white">@hi_adimassatria</strong></span>
            <ExternalLink className="w-2.5 h-2.5 text-[#555] group-hover:text-white transition-colors" />
          </a>
        </div>
      )}
    </div>
  );
};
