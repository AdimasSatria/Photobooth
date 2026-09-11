import React, { useEffect, useState, useRef } from 'react';
import {
  Download,
  Layers,
  Sparkles,
  Film,
  FileArchive,
  ArrowLeft,
  Check,
  Share2,
  ExternalLink,
  Camera,
  Play,
  Video
} from 'lucide-react';
import JSZip from 'jszip';
import { generatePhotoboothGif } from '../utils/gifGenerator';
import { generatePhotoboothVideo } from '../utils/videoGenerator';

interface SessionData {
  id: string;
  strip: string;
  rawShots: string[];
  gif?: string;
  video?: string;
  createdAt: number;
}

interface MobileScanResultProps {
  sessionId: string;
  onBackToBooth: () => void;
}

export const MobileScanResult: React.FC<MobileScanResultProps> = ({ sessionId, onBackToBooth }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'strip' | 'mentahan' | 'gif' | 'video'>('strip');
  const [isZipping, setIsZipping] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifLoadError, setGifLoadError] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/session/${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Sesi foto tidak ditemukan atau sudah kadaluarsa.');
        }
        return res.json();
      })
      .then((data: SessionData) => {
        if (isMounted) {
          setSession(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Gagal memuat hasil foto.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Active polling: If session is loaded but GIF or Video hasn't arrived yet from desktop
  useEffect(() => {
    if (!session || (session.gif && session.video)) return;
    const interval = setInterval(() => {
      fetch(`/api/session/${sessionId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((updated: SessionData | null) => {
          if (updated) {
            setSession((prev) => {
              if (!prev) return updated;
              const hasNewGif = !prev.gif && updated.gif;
              const hasNewVideo = !prev.video && updated.video;
              if (hasNewGif || hasNewVideo) {
                return {
                  ...prev,
                  gif: updated.gif || prev.gif,
                  video: updated.video || prev.video,
                };
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 1500);

    return () => clearInterval(interval);
  }, [session?.gif, session?.video, sessionId]);

  // Client-side fallback: If GIF is missing or failed to load, generate it directly in mobile browser!
  useEffect(() => {
    if (!session || (session.gif && !gifLoadError) || !session.rawShots || session.rawShots.length === 0 || isGeneratingGif) {
      return;
    }

    const timer = setTimeout(async () => {
      if (session.gif && !gifLoadError) return;
      setIsGeneratingGif(true);
      try {
        const shots = session.rawShots.map((url, idx) => ({
          id: String(idx),
          dataUrl: url,
          timestamp: Date.now(),
        }));
        const { dataUrl } = await generatePhotoboothGif(shots, {
          caption: 'ADIMAS BOOTH',
          delay: 450,
          boomerang: true,
          showWatermark: false,
        });
        setSession((prev) => (prev ? { ...prev, gif: dataUrl } : prev));
        setGifLoadError(false);

        // Update server cache so downloads are synchronized
        fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sessionId,
            strip: session.strip,
            rawShots: session.rawShots,
            gif: dataUrl,
            video: session.video,
          }),
        }).catch(() => {});
      } catch (err) {
        console.warn('Fallback mobile GIF generation error:', err);
      } finally {
        setIsGeneratingGif(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [session, isGeneratingGif, gifLoadError, sessionId]);

  // Client-side fallback: If Video is missing, generate it directly in mobile browser!
  useEffect(() => {
    if (!session || session.video || !session.rawShots || session.rawShots.length === 0 || isGeneratingVideo) {
      return;
    }

    const timer = setTimeout(async () => {
      if (session.video) return;
      setIsGeneratingVideo(true);
      try {
        const shots = session.rawShots.map((url, idx) => ({
          id: String(idx),
          dataUrl: url,
          timestamp: Date.now(),
        }));
        const res = await generatePhotoboothVideo(shots, {
          boomerang: true,
          loops: 2,
        });
        setSession((prev) => (prev ? { ...prev, video: res.dataUrl } : prev));

        // Update server cache so downloads are synchronized
        fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sessionId,
            strip: session.strip,
            rawShots: session.rawShots,
            gif: session.gif,
            video: res.dataUrl,
          }),
        }).catch(() => {});
      } catch (err) {
        console.warn('Fallback mobile video generation error:', err);
      } finally {
        setIsGeneratingVideo(false);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [session, isGeneratingVideo, sessionId]);

  const handleDownloadStrip = () => {
    if (!session?.strip) return;
    const a = document.createElement('a');
    a.href = `/api/download/${session.id}/strip`;
    a.download = `adimasbooth-strip-${session.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSingleMentahan = (index: number) => {
    if (!session?.rawShots[index]) return;
    const a = document.createElement('a');
    a.href = session.rawShots[index];
    a.download = `adimas-mentahan-0${index + 1}-${session.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadGif = () => {
    if (!session?.gif) return;
    const a = document.createElement('a');
    if (session.gif.startsWith('data:image/gif')) {
      a.href = session.gif;
    } else {
      a.href = `/api/download/${session.id}/gif`;
    }
    a.download = `adimasbooth-animated-${session.id}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadVideo = () => {
    if (!session?.video) return;
    const isWebm = session.video.startsWith('data:video/webm');
    const ext = isWebm ? 'webm' : 'mp4';
    const a = document.createElement('a');
    if (session.video.startsWith('data:video/')) {
      a.href = session.video;
    } else {
      a.href = `/api/download/${session.id}/video`;
    }
    a.download = `adimasbooth-story-${session.id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAllZip = async () => {
    if (!session) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // 1. Strip
      if (session.strip) {
        const stripBase64 = session.strip.split(',')[1];
        zip.file('01-adimasbooth-photo-strip.png', stripBase64, { base64: true });
      }

      // 2. Mentahan raw shots
      if (session.rawShots && session.rawShots.length > 0) {
        const mentahanFolder = zip.folder('02-mentahan-1-1');
        session.rawShots.forEach((shot, i) => {
          const rawBase64 = shot.split(',')[1];
          mentahanFolder?.file(`mentahan-shot-0${i + 1}.png`, rawBase64, { base64: true });
        });
      }

      // 3. GIF
      if (session.gif) {
        try {
          if (session.gif.startsWith('data:image/gif;base64,')) {
            const gifBase64 = session.gif.split(',')[1];
            zip.file('03-adimasbooth-animated.gif', gifBase64, { base64: true });
          } else {
            const gifRes = await fetch(session.gif);
            const gifBlob = await gifRes.blob();
            zip.file('03-adimasbooth-animated.gif', gifBlob);
          }
        } catch (e) {
          console.warn('GIF archive skip:', e);
        }
      }

      // 4. Video Story (.mp4 / .webm)
      if (session.video) {
        try {
          const isWebm = session.video.startsWith('data:video/webm');
          const ext = isWebm ? 'webm' : 'mp4';
          if (session.video.startsWith('data:video/')) {
            const videoBase64 = session.video.split(',')[1];
            zip.file(`04-adimasbooth-story.${ext}`, videoBase64, { base64: true });
          } else {
            const vidRes = await fetch(session.video);
            const vidBlob = await vidRes.blob();
            zip.file(`04-adimasbooth-story.${ext}`, vidBlob);
          }
        } catch (e) {
          console.warn('Video archive skip:', e);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `adimasbooth-lengkap-4-format-${session.id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
    } catch (e) {
      console.error('ZIP creation error:', e);
    } finally {
      setIsZipping(false);
    }
  };

  const handleNativeShare = async () => {
    if (!session?.strip || !navigator.share) return;
    try {
      const response = await fetch(session.strip);
      const blob = await response.blob();
      const file = new File([blob], `adimasbooth-${session.id}.png`, { type: 'image/png' });
      await navigator.share({
        title: 'Adimas Studio Photo Result',
        text: 'Hasil photobooth dari AdimasBooth!',
        files: [file]
      });
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    } catch (e) {
      console.log('Native share canceled or unsupported', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
        <h2 className="text-base font-semibold tracking-wider uppercase">Mengambil Foto Anda...</h2>
        <p className="text-xs text-[#888] font-mono mt-1">Menghubungkan ke AdimasBooth Studio Session</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 font-mono text-xl">
          !
        </div>
        <h2 className="text-lg font-semibold tracking-tight uppercase">Foto Tidak Ditemukan</h2>
        <p className="text-xs text-[#888] font-mono max-w-md mt-2 mb-6 leading-relaxed">
          {error || 'Sesi foto mungkin telah kadaluarsa atau laptop/komputer belum menyelesaikan render foto.'}
        </p>
        <button
          onClick={onBackToBooth}
          className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-[#eee] font-medium text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Buka Photobooth
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center p-4 sm:p-6 pb-20 selection:bg-white selection:text-black">
      {/* Top Header */}
      <header className="w-full max-w-md flex items-center justify-between py-3 border-b border-[#1A1A1A] mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-xs font-bold uppercase tracking-widest text-white">ADIMAS STUDIO</h1>
            <p className="text-[10px] font-mono text-[#777]">ID: #{session.id}</p>
          </div>
        </div>

        <button
          onClick={onBackToBooth}
          className="px-3 py-1.5 rounded-full bg-[#151515] border border-[#262626] text-[11px] font-mono text-[#BBB] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Camera className="w-3 h-3" />
          <span>Ke Booth</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md space-y-4">
        {/* Banner Alert */}
        <div className="p-3.5 rounded-xl bg-[#111] border border-[#222] flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Hasil Foto Siap</h2>
            <p className="text-[11px] text-[#888] font-mono mt-0.5">Tersedia dalam 4 format lengkap</p>
          </div>
          <span className="text-[10px] font-mono bg-white text-black px-2 py-0.5 rounded font-bold">
            READY
          </span>
        </div>

        {/* Master One-Click Download Bundle Button */}
        <button
          onClick={handleDownloadAllZip}
          disabled={isZipping}
          className="w-full py-3.5 px-4 rounded-xl bg-white text-black hover:bg-[#EEE] font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <FileArchive className="w-4 h-4" />
          <span>{isZipping ? 'Menyiapkan Paket ZIP...' : 'Download Paket Lengkap (4 Format .ZIP)'}</span>
        </button>

        {/* Format Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#121212] border border-[#202020] rounded-xl">
          <button
            onClick={() => setActiveTab('strip')}
            className={`py-2 px-1 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'strip' ? 'bg-white text-black font-bold shadow-sm' : 'text-[#888] hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Strip</span>
          </button>

          <button
            onClick={() => setActiveTab('mentahan')}
            className={`py-2 px-1 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'mentahan' ? 'bg-white text-black font-bold shadow-sm' : 'text-[#888] hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Mentah</span>
          </button>

          <button
            onClick={() => setActiveTab('gif')}
            className={`py-2 px-1 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'gif' ? 'bg-white text-black font-bold shadow-sm' : 'text-[#888] hover:text-white'
            }`}
          >
            <Film className="w-3 h-3" />
            <span>GIF</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`py-2 px-1 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'video' ? 'bg-white text-black font-bold shadow-sm' : 'text-[#888] hover:text-white'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>Story</span>
          </button>
        </div>

        {/* Tab 1: Photo Strip */}
        {activeTab === 'strip' && (
          <div className="space-y-3">
            <div className="p-3 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl flex flex-col items-center">
              <div className="max-w-[280px] w-full rounded-lg overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={session.strip}
                  alt="Adimas Photo Strip"
                  className="w-full h-auto object-contain select-none"
                />
              </div>
              <p className="text-[10px] text-[#666] font-mono mt-3 text-center">
                Tips: Tekan dan tahan foto di atas untuk &quot;Simpan ke Foto/Galeri&quot; di iPhone / Android
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleDownloadStrip}
                className="py-3 px-4 rounded-xl bg-white text-black hover:bg-[#EEE] font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Photo Strip
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="py-3 px-4 rounded-xl bg-[#161616] hover:bg-[#222] border border-[#2E2E2E] text-white font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                  {shareSuccess ? 'Tersimpan!' : 'Share / AirDrop'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Mentahan 1/1 Photos */}
        {activeTab === 'mentahan' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#111] border border-[#222]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">4 Foto Mentahan Polosan</h3>
                  <p className="text-[10px] text-[#777] font-mono mt-0.5">Raw cut foto asli tanpa frame atau tulisan</p>
                </div>
                <span className="text-[10px] font-mono bg-white/10 text-white px-2 py-0.5 rounded">
                  RAW 1/1
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {session.rawShots.map((shot, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-[#0F0F0F] border border-[#222] flex flex-col gap-2">
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-4/3 border border-white/10">
                    <img
                      src={shot}
                      alt={`Mentahan ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/80 text-white">
                      0{idx + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadSingleMentahan(idx)}
                    className="py-1.5 rounded-lg bg-[#181818] hover:bg-white hover:text-black border border-[#2C2C2C] text-white text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Unduh
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Animated GIF */}
        {activeTab === 'gif' && (
          <div className="space-y-3">
            <div className="p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl flex flex-col items-center">
              {session.gif && !gifLoadError ? (
                <>
                  <div className="max-w-[280px] w-full rounded-xl overflow-hidden shadow-2xl border border-white/15 relative bg-black">
                    <img
                      src={session.gif}
                      alt="Animated Photobooth GIF"
                      className="w-full h-auto object-cover select-none block"
                      onError={() => setGifLoadError(true)}
                    />
                  </div>
                  <p className="text-[11px] text-[#888] font-mono mt-3 text-center leading-relaxed">
                    Animasi loop format .gif • Tekan &amp; tahan gambar untuk simpan langsung ke Galeri HP
                  </p>
                </>
              ) : isGeneratingGif ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-3" />
                  <p className="text-xs font-mono text-white font-medium">Membuat Animasi GIF...</p>
                  <p className="text-[10px] text-[#666] font-mono mt-1">Menggabungkan 4 frame foto photobooth</p>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-emerald-400 animate-spin mb-3" />
                  <p className="text-xs font-mono text-white font-medium">Menyiapkan Animasi GIF...</p>
                  <p className="text-[10px] text-[#666] font-mono mt-1 mb-4">Sedang memproses 4 frame foto photobooth</p>
                  {session.rawShots && session.rawShots.length > 0 && (
                    <button
                      onClick={async () => {
                        setIsGeneratingGif(true);
                        try {
                          const shots = session.rawShots.map((url, idx) => ({
                            id: String(idx),
                            dataUrl: url,
                            timestamp: Date.now(),
                          }));
                          const { dataUrl } = await generatePhotoboothGif(shots, {
                            caption: 'ADIMAS BOOTH',
                            delay: 450,
                            boomerang: true,
                            showWatermark: false,
                          });
                          setSession((prev) => (prev ? { ...prev, gif: dataUrl } : prev));
                          setGifLoadError(false);
                        } catch (err) {
                          console.warn(err);
                        } finally {
                          setIsGeneratingGif(false);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/15 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Proses Sekarang
                    </button>
                  )}
                </div>
              )}
            </div>

            {session.gif && !gifLoadError && (
              <button
                onClick={handleDownloadGif}
                className="w-full py-3.5 px-4 rounded-xl bg-white text-black hover:bg-[#EEE] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" />
                Unduh Animated GIF (.gif)
              </button>
            )}
          </div>
        )}

        {/* Tab 4: Video Story (.mp4) */}
        {activeTab === 'video' && (
          <div className="space-y-3">
            <div className="p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl flex flex-col items-center">
              {session.video ? (
                <>
                  <div className="max-w-[280px] w-full rounded-xl overflow-hidden shadow-2xl border border-white/15 relative bg-black">
                    <video
                      src={session.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      className="w-full h-auto object-cover block"
                    />
                  </div>
                  <p className="text-[11px] text-[#888] font-mono mt-3 text-center leading-relaxed">
                    Video looping (.mp4) • Siap langsung di-upload ke Instagram Story atau WhatsApp Status
                  </p>
                </>
              ) : isGeneratingVideo ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-3" />
                  <p className="text-xs font-mono text-white font-medium">Membuat Video Story MP4...</p>
                  <p className="text-[10px] text-[#666] font-mono mt-1">Mengonversi 4 frame foto jadi MP4 looping</p>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-7 h-7 rounded-full border-2 border-white/20 border-t-emerald-400 animate-spin mb-3" />
                  <p className="text-xs font-mono text-white font-medium">Menyiapkan Video Story...</p>
                  <p className="text-[10px] text-[#666] font-mono mt-1 mb-4">Format video MP4 untuk Instagram Story</p>
                  {session.rawShots && session.rawShots.length > 0 && (
                    <button
                      onClick={async () => {
                        setIsGeneratingVideo(true);
                        try {
                          const shots = session.rawShots.map((url, idx) => ({
                            id: String(idx),
                            dataUrl: url,
                            timestamp: Date.now(),
                          }));
                          const res = await generatePhotoboothVideo(shots, {
                            boomerang: true,
                            loops: 2,
                          });
                          setSession((prev) => (prev ? { ...prev, video: res.dataUrl } : prev));
                        } catch (err) {
                          console.warn(err);
                        } finally {
                          setIsGeneratingVideo(false);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/15 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Proses Video Sekarang
                    </button>
                  )}
                </div>
              )}
            </div>

            {session.video && (
              <button
                onClick={handleDownloadVideo}
                className="w-full py-3.5 px-4 rounded-xl bg-white text-black hover:bg-[#EEE] font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" />
                Unduh Video Story (.mp4)
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
