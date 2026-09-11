import React, { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { 
  Download, 
  RotateCcw, 
  Copy, 
  Check, 
  Sliders, 
  QrCode, 
  Film, 
  Layers, 
  Share2, 
  X, 
  FileArchive,
  Play,
  Sparkles,
  ExternalLink,
  Video
} from 'lucide-react';
import { BoothSettings, CapturedShot } from '../types';
import { renderPhotoStrip, renderSinglePhoto } from '../utils/canvasRenderer';
import { generatePhotoboothGif } from '../utils/gifGenerator';
import { generatePhotoboothVideo } from '../utils/videoGenerator';
import { FILTER_OPTIONS, FRAME_OPTIONS } from '../utils/presets';

interface PreviewRoomProps {
  shots: CapturedShot[];
  settings: BoothSettings;
  onUpdateSettings: (partial: Partial<BoothSettings>) => void;
  onRetake: () => void;
}

type ViewMode = 'strip' | 'singles' | 'gif' | 'video';

export const PreviewRoom: React.FC<PreviewRoomProps> = ({
  shots,
  settings,
  onUpdateSettings,
  onRetake
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('strip');
  const [renderedImageUrl, setRenderedImageUrl] = useState<string>('');
  const [singleRenders, setSingleRenders] = useState<string[]>([]);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'frames' | 'filters' | 'caption'>('frames');

  // GIF State
  const [gifUrl, setGifUrl] = useState<string>('');
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(false);
  const [isBoomerang, setIsBoomerang] = useState<boolean>(true);
  const [gifSpeed, setGifSpeed] = useState<number>(450); // 450ms default, 250ms fast

  // Video Story State (.mp4 / .webm)
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDataUrl, setVideoDataUrl] = useState<string>('');
  const [videoExt, setVideoExt] = useState<'mp4' | 'webm'>('mp4');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);

  // QR Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [modalQrDataUrl, setModalQrDataUrl] = useState<string>('');
  const [nativeShareSuccess, setNativeShareSuccess] = useState<boolean>(false);

  // Unique session ID for instant mobile scan transfer
  const [sessionId] = useState<string>(() => 'adimas-' + Math.random().toString(36).substring(2, 8));
  const [isSyncedToServer, setIsSyncedToServer] = useState<boolean>(false);

  // Generate high-resolution render of strip
  const updateRender = useCallback(async () => {
    if (shots.length === 0) return;
    setIsRendering(true);
    try {
      const dataUrl = await renderPhotoStrip(shots, settings, sessionId);
      setRenderedImageUrl(dataUrl);
    } catch (err) {
      console.error('Failed to render photo strip:', err);
    } finally {
      setIsRendering(false);
    }
  }, [shots, settings, sessionId]);

  // Generate single photo renders (Mentahan / Polosan)
  useEffect(() => {
    let active = true;
    if (shots.length === 0) return;
    Promise.all(shots.map((s) => renderSinglePhoto(s, settings)))
      .then((renders) => {
        if (active) setSingleRenders(renders);
      })
      .catch((err) => console.error('Failed to render single photos:', err));
    return () => {
      active = false;
    };
  }, [shots, settings]);

  // Generate GIF
  const triggerGifGeneration = useCallback(async () => {
    if (shots.length === 0) return;
    setIsGeneratingGif(true);
    try {
      const { url, dataUrl } = await generatePhotoboothGif(shots, {
        filter: settings.filter,
        caption: settings.customCaption,
        boomerang: isBoomerang,
        delay: gifSpeed,
        showWatermark: false
      });
      setGifUrl(dataUrl || url);
    } catch (err) {
      console.error('Failed to generate photobooth GIF:', err);
    } finally {
      setIsGeneratingGif(false);
    }
  }, [shots, settings.filter, settings.customCaption, isBoomerang, gifSpeed]);

  // Generate Video Story (MP4/WebM)
  const triggerVideoGeneration = useCallback(async () => {
    if (shots.length === 0) return;
    setIsGeneratingVideo(true);
    try {
      const res = await generatePhotoboothVideo(shots, {
        filter: settings.filter,
        boomerang: isBoomerang,
        loops: 2,
      });
      setVideoUrl(res.url);
      setVideoDataUrl(res.dataUrl);
      setVideoExt(res.extension);
    } catch (err) {
      console.error('Failed to generate photobooth video:', err);
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [shots, settings.filter, isBoomerang]);

  // Render on load and changes
  useEffect(() => {
    updateRender();
  }, [updateRender]);

  useEffect(() => {
    triggerGifGeneration();
  }, [triggerGifGeneration]);

  useEffect(() => {
    triggerVideoGeneration();
  }, [triggerVideoGeneration]);

  // Synchronize session data to local Express server for mobile phone scan transfer
  useEffect(() => {
    if (!renderedImageUrl || shots.length === 0) return;

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sessionId,
        strip: renderedImageUrl,
        rawShots: shots.map((s) => s.dataUrl),
        gif: gifUrl || undefined,
        video: videoDataUrl || undefined,
      }),
    })
      .then((res) => {
        if (res.ok) setIsSyncedToServer(true);
      })
      .catch((err) => console.warn('Local session sync failed:', err));
  }, [sessionId, renderedImageUrl, shots, gifUrl, videoDataUrl]);

  // Generate QR Code for modal pointing to session viewer
  useEffect(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://adimasbooth.app';
    const targetUrl = `${baseUrl}/?session=${sessionId}`;
    QRCode.toDataURL(targetUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(setModalQrDataUrl)
      .catch((err) => console.error('Failed to create QR code:', err));
  }, [sessionId]);

  // Trigger celebration confetti on initial room entry
  useEffect(() => {
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#ffffff', '#888888', '#111111', '#555555']
      });
    } catch {
      // safe fallback
    }
  }, []);

  // Download high-resolution PNG Strip
  const handleDownloadStrip = () => {
    if (!renderedImageUrl) return;
    const a = document.createElement('a');
    a.href = renderedImageUrl;
    const time = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `adimasbooth-${settings.frameId}-${time}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download Single Shot
  const handleDownloadSingle = (index: number) => {
    const imgData = singleRenders[index] || shots[index]?.dataUrl;
    if (!imgData) return;
    const a = document.createElement('a');
    a.href = imgData;
    a.download = `adimasbooth-shot-0${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download All 1/1 Raw Photos as ZIP
  const handleDownloadAllZip = async () => {
    if (shots.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < shots.length; i++) {
        const singleData = singleRenders[i] || (await renderSinglePhoto(shots[i], settings));
        const base64 = singleData.split(',')[1];
        zip.file(`adimas-mentahan-shot-0${i + 1}.png`, base64, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `adimas-mentahan-1-1-all-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error('Error generating mentahan zip archive:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Download Complete Bundle (Strip + 4 Mentahan 1/1 + GIF)
  const handleDownloadCompleteBundle = async () => {
    if (shots.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // 1. Photo Strip
      if (renderedImageUrl) {
        const stripBase64 = renderedImageUrl.split(',')[1];
        zip.file(`01-adimasbooth-photo-strip.png`, stripBase64, { base64: true });
      }

      // 2. Mentahan 1/1 Photos
      const mentahanFolder = zip.folder('02-mentahan-1-1');
      for (let i = 0; i < shots.length; i++) {
        const singleData = singleRenders[i] || (await renderSinglePhoto(shots[i], settings));
        const base64 = singleData.split(',')[1];
        mentahanFolder?.file(`mentahan-shot-0${i + 1}.png`, base64, { base64: true });
      }

      // 3. GIF (if generated)
      if (gifUrl) {
        try {
          if (gifUrl.startsWith('data:image/gif;base64,')) {
            const base64Data = gifUrl.split(',')[1];
            zip.file(`03-adimasbooth-animated.gif`, base64Data, { base64: true });
          } else {
            const gifRes = await fetch(gifUrl);
            const gifBlob = await gifRes.blob();
            zip.file(`03-adimasbooth-animated.gif`, gifBlob);
          }
        } catch (e) {
          console.warn('GIF inclusion skipped in zip:', e);
        }
      }

      // 4. Video Story (.mp4 / .webm)
      if (videoUrl || videoDataUrl) {
        try {
          const vUrl = videoDataUrl || videoUrl;
          if (vUrl.startsWith('data:video/')) {
            const base64Data = vUrl.split(',')[1];
            zip.file(`04-adimasbooth-story.${videoExt}`, base64Data, { base64: true });
          } else {
            const vidRes = await fetch(vUrl);
            const vidBlob = await vidRes.blob();
            zip.file(`04-adimasbooth-story.${videoExt}`, vidBlob);
          }
        } catch (e) {
          console.warn('Video inclusion skipped in zip:', e);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `adimasbooth-paket-lengkap-4-format-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (err) {
      console.error('Error generating full bundle zip archive:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Download Animated GIF
  const handleDownloadGif = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `adimasbooth-animated-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download Video Story (.mp4 / .webm)
  const handleDownloadVideo = () => {
    const targetUrl = videoUrl || videoDataUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = `adimasbooth-story-${Date.now()}.${videoExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Copy strip to clipboard
  const handleCopyClipboard = async () => {
    if (!renderedImageUrl) return;
    try {
      const response = await fetch(renderedImageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy failed, downloading instead:', err);
      handleDownloadStrip();
    }
  };

  // Native Mobile Web Share
  const handleNativeShare = async () => {
    if (!renderedImageUrl || typeof navigator === 'undefined' || !navigator.share) {
      setIsQrModalOpen(true);
      return;
    }
    try {
      const response = await fetch(renderedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'adimasbooth-strip.png', { type: 'image/png' });
      await navigator.share({
        title: 'AdimasBooth Photo Strip',
        text: 'Scanned from AdimasBooth studio photobooth!',
        files: [file]
      });
      setNativeShareSuccess(true);
      setTimeout(() => setNativeShareSuccess(false), 2500);
    } catch (err) {
      // If file share rejected or unsupported, show QR modal
      setIsQrModalOpen(true);
    }
  };

  return (
    <div id="preview-room-view" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8 items-start justify-center">
      {/* Left Column: Visual Display with View Mode Selector */}
      <div className="w-full lg:w-7/12 flex flex-col items-center">
        {/* Top View Selector Tabs */}
        <div className="w-full flex items-center justify-between mb-4 bg-[#0D0D0D] border border-[#1A1A1A] p-1.5 rounded-2xl">
          <div className="flex items-center gap-1.5">
            <button
              id="view-strip-tab"
              onClick={() => setViewMode('strip')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'strip'
                  ? 'bg-white text-black shadow-sm font-semibold'
                  : 'text-[#888] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              1. Photo Strip
            </button>

            <button
              id="view-singles-tab"
              onClick={() => setViewMode('singles')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'singles'
                  ? 'bg-white text-black shadow-sm font-semibold'
                  : 'text-[#888] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              2. Mentahan 1/1 ({shots.length})
            </button>

            <button
              id="view-gif-tab"
              onClick={() => setViewMode('gif')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'gif'
                  ? 'bg-white text-black shadow-sm font-semibold'
                  : 'text-[#888] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              3. GIF
            </button>

            <button
              id="view-video-tab"
              onClick={() => setViewMode('video')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'video'
                  ? 'bg-white text-black shadow-sm font-semibold'
                  : 'text-[#888] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              4. Video Story
            </button>
          </div>

          <div className="text-[10px] font-mono text-[#666] pr-2 hidden sm:block">
            {viewMode === 'strip' && 'FORMAT 1: STRIP JADI'}
            {viewMode === 'singles' && 'FORMAT 2: MENTAHAN 1/1'}
            {viewMode === 'gif' && 'FORMAT 3: ANIMATED GIF'}
            {viewMode === 'video' && 'FORMAT 4: VIDEO STORY (.MP4)'}
          </div>
        </div>

        {/* View Mode 1: Photo Strip */}
        {viewMode === 'strip' && (
          <div className="relative p-6 rounded-2xl bg-[#050505] border border-[#1A1A1A] shadow-[0_0_80px_rgba(255,255,255,0.02)] flex flex-col items-center justify-center max-h-[76vh] overflow-y-auto w-full">
            {isRendering ? (
              <div className="flex flex-col items-center justify-center py-24 text-[#888] gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <p className="text-xs font-mono uppercase tracking-widest">Exposing 300 DPI strip...</p>
              </div>
            ) : renderedImageUrl ? (
              <div className="relative group max-w-xs drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:scale-[1.01]">
                <img
                  src={renderedImageUrl}
                  alt="AdimasBooth Render"
                  className="w-full h-auto rounded shadow-2xl"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white border border-white/20 pointer-events-none">
                  300 DPI • QR STAMPED
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#666] font-mono">No frames captured.</p>
            )}
          </div>
        )}

        {/* View Mode 2: Individual 1/1 Photos (Mentahan Polosan) */}
        {viewMode === 'singles' && (
          <div className="relative p-5 rounded-2xl bg-[#050505] border border-[#1A1A1A] w-full max-h-[76vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A]">
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider text-white flex items-center gap-2">
                  <span>Foto Mentahan 1/1 (Polosan)</span>
                  <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded font-mono">NO FRAME / RAW</span>
                </h3>
                <p className="text-[11px] text-[#666] font-mono">Foto murni tanpa frame, border, atau footer. Resolusi asli kamera.</p>
              </div>
              <button
                id="download-all-zip-btn"
                onClick={handleDownloadAllZip}
                disabled={isZipping || shots.length === 0}
                className="px-3 py-1.5 rounded-full bg-white text-black hover:bg-[#ddd] text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileArchive className="w-3.5 h-3.5" />
                {isZipping ? 'Archiving...' : 'Download Semua Mentahan (.ZIP)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shots.map((shot, idx) => {
                const previewSrc = singleRenders[idx] || shot.dataUrl;
                return (
                  <div key={shot.id} className="p-3 rounded-xl bg-[#0D0D0D] border border-[#1F1F1F] flex flex-col gap-2.5">
                    {/* Pure photo without frames */}
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-white/10">
                      <img
                        src={previewSrc}
                        alt={`Mentahan Shot ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-white border border-white/20">
                        MENTAHAN 0{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[#777]">1/1 Polosan (Raw Cut)</span>
                      <button
                        onClick={() => handleDownloadSingle(idx)}
                        className="px-3 py-1 rounded-full bg-[#181818] hover:bg-white hover:text-black border border-[#2A2A2A] text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        Unduh PNG
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 3: Animated Photobooth GIF */}
        {viewMode === 'gif' && (
          <div className="relative p-6 rounded-2xl bg-[#050505] border border-[#1A1A1A] w-full max-h-[76vh] overflow-y-auto flex flex-col items-center">
            {isGeneratingGif ? (
              <div className="flex flex-col items-center justify-center py-24 text-[#888] gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <p className="text-xs font-mono uppercase tracking-widest">Encoding Photobooth GIF...</p>
              </div>
            ) : gifUrl ? (
              <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <div className="relative rounded-xl overflow-hidden border border-[#222] shadow-2xl bg-black">
                  <img
                    src={gifUrl}
                    alt="AdimasBooth Animated GIF"
                    className="w-full h-auto block"
                  />
                </div>

                {/* GIF Playback controls */}
                <div className="w-full flex items-center justify-between bg-[#0D0D0D] border border-[#1F1F1F] p-2.5 rounded-xl text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsBoomerang(!isBoomerang)}
                      className={`px-2.5 py-1 rounded text-[10px] uppercase transition-all cursor-pointer ${
                        isBoomerang ? 'bg-white text-black font-semibold' : 'bg-[#181818] text-[#888]'
                      }`}
                    >
                      Boomerang
                    </button>
                    <button
                      onClick={() => setGifSpeed(gifSpeed === 450 ? 250 : 450)}
                      className={`px-2.5 py-1 rounded text-[10px] uppercase transition-all cursor-pointer ${
                        gifSpeed === 250 ? 'bg-white text-black font-semibold' : 'bg-[#181818] text-[#888]'
                      }`}
                    >
                      {gifSpeed === 250 ? 'Fast' : 'Normal'}
                    </button>
                  </div>

                  <button
                    onClick={handleDownloadGif}
                    className="px-3 py-1 rounded bg-white text-black hover:bg-[#ddd] font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Save .GIF
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#666] font-mono">Failed to render GIF.</p>
            )}
          </div>
        )}

        {/* View Mode 4: Video Story (.mp4 / .webm) */}
        {viewMode === 'video' && (
          <div className="relative p-6 rounded-2xl bg-[#050505] border border-[#1A1A1A] w-full max-h-[76vh] overflow-y-auto flex flex-col items-center">
            {isGeneratingVideo ? (
              <div className="flex flex-col items-center justify-center py-24 text-[#888] gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <p className="text-xs font-mono uppercase tracking-widest">Membuat Video Story MP4...</p>
                <p className="text-[10px] text-[#666] font-mono">Format pas untuk IG Story & WA Status (~4 detik)</p>
              </div>
            ) : (videoUrl || videoDataUrl) ? (
              <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <div className="relative rounded-xl overflow-hidden border border-[#222] shadow-2xl bg-black">
                  <video
                    src={videoUrl || videoDataUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-auto block"
                  />
                </div>

                {/* Video playback & download bar */}
                <div className="w-full flex items-center justify-between bg-[#0D0D0D] border border-[#1F1F1F] p-2.5 rounded-xl text-xs font-mono">
                  <div className="flex items-center gap-1 text-[11px] text-[#888]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Story Ready (~4s)</span>
                  </div>

                  <button
                    onClick={handleDownloadVideo}
                    className="px-3 py-1 rounded bg-white text-black hover:bg-[#ddd] font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Save .{videoExt}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#666] font-mono">Gagal memproses video story.</p>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Customization Deck & Export Actions */}
      <div className="w-full lg:w-5/12 flex flex-col gap-5">
        {/* Action Header Card */}
        <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-[#1A1A1A] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#888]">
                Studio Archive • 4 Format Siap Unduh
              </span>
              <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight uppercase mt-0.5">
                Hasil Photobooth Ready
              </h2>
            </div>
            <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          </div>

          <p className="text-xs text-[#888] font-mono leading-relaxed">
            Dapatkan 4 format lengkap: <strong className="text-white">Photo Strip</strong>, <strong className="text-white">Foto Mentahan 1/1</strong>, <strong className="text-white">Animated GIF</strong>, dan <strong className="text-white">Video Story (MP4)</strong>.
          </p>

          {/* Master Complete Bundle Button */}
          <button
            id="download-complete-bundle-btn"
            onClick={handleDownloadCompleteBundle}
            disabled={isZipping || isRendering}
            className="w-full py-3.5 px-4 rounded-xl bg-white text-black hover:bg-[#EEE] font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            {isZipping ? 'Menyiapkan Paket...' : '✨ Download Paket Lengkap (4 Format .ZIP)'}
          </button>

          {/* Individual Format Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* 1. Strip */}
            <button
              id="download-strip-btn"
              onClick={handleDownloadStrip}
              disabled={isRendering || !renderedImageUrl}
              className="py-2.5 px-2 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#262626] text-white font-medium text-[11px] font-mono uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-white">
                <Layers className="w-3.5 h-3.5" />
                <span>1. Strip</span>
              </div>
              <span className="text-[9px] text-[#777]">PNG</span>
            </button>

            {/* 2. Mentahan 1/1 */}
            <button
              id="download-all-shots-quick-btn"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="py-2.5 px-2 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#262626] text-white font-medium text-[11px] font-mono uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-white">
                <FileArchive className="w-3.5 h-3.5" />
                <span>2. Mentah</span>
              </div>
              <span className="text-[9px] text-[#777]">ZIP</span>
            </button>

            {/* 3. GIF */}
            <button
              id="download-gif-quick-btn"
              onClick={handleDownloadGif}
              disabled={!gifUrl || isGeneratingGif}
              className="py-2.5 px-2 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#262626] text-white font-medium text-[11px] font-mono uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-white">
                <Film className="w-3.5 h-3.5" />
                <span>3. GIF</span>
              </div>
              <span className="text-[9px] text-[#777]">{isGeneratingGif ? '...' : '.gif'}</span>
            </button>

            {/* 4. Video Story */}
            <button
              id="download-video-quick-btn"
              onClick={handleDownloadVideo}
              disabled={(!videoUrl && !videoDataUrl) || isGeneratingVideo}
              className="py-2.5 px-2 rounded-xl bg-[#141414] hover:bg-[#202020] border border-[#262626] text-white font-medium text-[11px] font-mono uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1 text-white">
                <Video className="w-3.5 h-3.5" />
                <span>4. Video</span>
              </div>
              <span className="text-[9px] text-[#777]">{isGeneratingVideo ? '...' : `.${videoExt}`}</span>
            </button>
          </div>

          {/* Barcode & Share Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              id="open-barcode-scan-btn"
              onClick={() => setIsQrModalOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-white font-medium text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-white" />
              Scan Barcode / QR
            </button>

            <button
              id="copy-strip-clipboard-btn"
              onClick={handleCopyClipboard}
              disabled={isRendering || !renderedImageUrl}
              className="py-2.5 px-3 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-[#BBB] hover:text-white text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#777]" />
                  <span>Copy Strip</span>
                </>
              )}
            </button>

            <button
              id="native-share-btn"
              onClick={handleNativeShare}
              className="py-2.5 px-3 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-[#BBB] hover:text-white text-[11px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer sm:col-span-2"
            >
              <Share2 className="w-3.5 h-3.5 text-[#777]" />
              <span>{nativeShareSuccess ? 'Shared!' : 'Share / AirDrop'}</span>
            </button>
          </div>

          {/* Retake Session Button */}
          <button
            id="retake-photos-btn"
            onClick={onRetake}
            className="w-full py-2.5 px-4 rounded-full border border-[#2A2A2A] hover:border-white text-[#888] hover:text-white text-xs uppercase tracking-widest font-mono flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Start New Session
          </button>
        </div>

        {/* Live Re-Styling Deck */}
        <div className="p-6 rounded-2xl bg-[#0D0D0D] border border-[#1A1A1A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-white/80" />
              <h3 className="font-medium text-xs text-white uppercase tracking-widest">
                Real-Time Re-Styling
              </h3>
            </div>
            <div className="flex bg-[#141414] rounded-full p-0.5 border border-[#222]">
              <button
                onClick={() => setActiveSubTab('frames')}
                className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === 'frames' ? 'bg-white text-black font-semibold' : 'text-[#888] hover:text-white'
                }`}
              >
                Frames
              </button>
              <button
                onClick={() => setActiveSubTab('filters')}
                className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === 'filters' ? 'bg-white text-black font-semibold' : 'text-[#888] hover:text-white'
                }`}
              >
                Emulsion
              </button>
              <button
                onClick={() => setActiveSubTab('caption')}
                className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === 'caption' ? 'bg-white text-black font-semibold' : 'text-[#888] hover:text-white'
                }`}
              >
                Caption & QR
              </button>
            </div>
          </div>

          {/* Sub-tab 1: Frames (Adimas Noir, Adimas White, etc.) */}
          {activeSubTab === 'frames' && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FRAME_OPTIONS.map((f) => {
                  const isSelected = settings.frameId === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => onUpdateSettings({ frameId: f.id, frameBgColor: f.bgHex })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-[#181818] border-white text-white shadow-sm'
                          : 'bg-[#111] border-[#222] text-[#888] hover:border-[#444]'
                      }`}
                    >
                      <div
                        className="w-4 h-6 rounded-xs border shrink-0"
                        style={{ backgroundColor: f.bgHex, borderColor: f.accentHex }}
                      />
                      <div className="truncate">
                        <div className="font-medium text-xs uppercase tracking-wider truncate text-white flex items-center gap-1.5">
                          {f.name}
                          {f.id.startsWith('adimas') && (
                            <span className="text-[8px] bg-white text-black px-1 rounded-xs font-bold font-mono">
                              SIGNATURE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#666] truncate font-mono">{f.tagline.slice(0, 24)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Filters */}
          {activeSubTab === 'filters' && (
            <div className="grid grid-cols-3 gap-2">
              {FILTER_OPTIONS.map((fil) => {
                const isSelected = settings.filter === fil.id;
                return (
                  <button
                    key={fil.id}
                    onClick={() => onUpdateSettings({ filter: fil.id })}
                    className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white font-medium'
                        : 'bg-[#111] border-[#222] text-[#888] hover:text-white text-xs'
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider">{fil.name}</div>
                    <div className="text-[9px] font-mono mt-0.5 opacity-60">{fil.badge}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sub-tab 3: Caption & QR Editor */}
          {activeSubTab === 'caption' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-1">
                  Bottom Caption / Title
                </label>
                <input
                  type="text"
                  value={settings.customCaption}
                  onChange={(e) => onUpdateSettings({ customCaption: e.target.value })}
                  placeholder="ADIMAS BOOTH"
                  className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white text-xs font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]">
                <div>
                  <span className="text-xs text-white font-medium uppercase tracking-wider">Scannable QR Stamp</span>
                  <p className="text-[10px] text-[#666] font-mono">Prints direct scan barcode onto bottom corner</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showQrCode}
                  onChange={(e) => onUpdateSettings({ showQrCode: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1A1A1A]">
                <div>
                  <span className="text-xs text-white font-medium uppercase tracking-wider">Date Stamp</span>
                  <p className="text-[10px] text-[#666] font-mono">Include camera date and timestamp</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showDate}
                  onChange={(e) => onUpdateSettings({ showDate: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Scan Modal (No external database required) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D0D0D] border border-[#2A2A2A] p-6 flex flex-col items-center text-center shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[#888] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon Header */}
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-medium text-white uppercase tracking-tight">
              Scan Barcode / Buka di HP
            </h3>
            <p className="text-xs text-[#AAA] font-mono mt-1 mb-4 leading-relaxed">
              Arahkan kamera smartphone ke barcode di bawah untuk langsung membuka &amp; mendownload 3 format foto kamu ke galeri HP.
            </p>

            {/* High-Resolution QR Canvas */}
            <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20 mb-3">
              {modalQrDataUrl ? (
                <img
                  src={modalQrDataUrl}
                  alt="Scannable Photobooth QR Code"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-white/90">
                Sesi #{sessionId} {isSyncedToServer ? '• Siap di-scan' : '• Menyinkronkan...'}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="w-full space-y-2">
              <a
                href={`/?session=${sessionId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#eee] transition-all cursor-pointer shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka Tampilan Hasil HP (Tab Baru)
              </a>

              <button
                onClick={() => {
                  const url = `${window.location.origin}/?session=${sessionId}`;
                  navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full py-2 px-4 rounded-xl bg-[#181818] hover:bg-[#222] border border-[#2B2B2B] text-[#BBB] hover:text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Link Berhasil Disalin!' : 'Salin Link Langsung'}
              </button>

              <button
                onClick={() => setIsQrModalOpen(false)}
                className="w-full py-2 px-4 rounded-xl border border-[#222] text-[#888] hover:text-white text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
