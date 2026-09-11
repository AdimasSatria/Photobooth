import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, AlertCircle, RefreshCw, Upload, Sparkles, Instagram, ExternalLink } from 'lucide-react';
import { BoothSettings } from '../types';
import { FrameOverlay } from './FrameOverlay';
import { FILTER_OPTIONS } from '../utils/presets';

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

  // Get active filter css
  const activeFilter = FILTER_OPTIONS.find((f) => f.id === settings.filter)?.cssFilter || 'none';

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

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [settings.aspectRatio]);

  // Capture frame handler
  const captureFrame = useCallback(async (): Promise<string> => {
    if (uploadedImage) return uploadedImage;
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
    return canvas.toDataURL('image/jpeg', 0.95);
  }, [cameraState, uploadedImage, settings.mirror, generateSimulatedFrame]);

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

      {/* Quick Option Pills under Viewfinder (Matching Immersive UI) */}
      {onUpdateSettings && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 z-10">
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
