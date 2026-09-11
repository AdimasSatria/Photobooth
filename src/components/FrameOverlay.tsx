import React from 'react';
import { FrameId } from '../types';

interface FrameOverlayProps {
  frameId: FrameId;
  aspectRatio: '4:3' | '16:9';
  showViewfinderGuides?: boolean;
}

export const FrameOverlay: React.FC<FrameOverlayProps> = ({
  frameId,
  showViewfinderGuides = true,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 select-none overflow-hidden">
      {/* 0. Adimas Noir Overlay */}
      {frameId === 'adimas-noir' && (
        <div className="absolute inset-0 border-[10px] sm:border-[16px] border-[#0a0a0a]">
          <div className="absolute inset-0 border border-white/20" />
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="text-[11px] font-bold tracking-widest text-white uppercase">ADIMAS STUDIO</span>
          </div>
          <div className="absolute bottom-2 right-3 text-[9px] font-mono text-zinc-400 tracking-wider uppercase">
            SELF PHOTO STUDIO
          </div>
        </div>
      )}

      {/* 0b. Adimas White Overlay */}
      {frameId === 'adimas-white' && (
        <div className="absolute inset-0 border-[10px] sm:border-[16px] border-white">
          <div className="absolute inset-0 border border-black/15" />
          <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-black" />
            <span className="text-[11px] font-bold tracking-widest text-black uppercase">ADIMAS STUDIO</span>
          </div>
          <div className="absolute bottom-2 right-3 text-[9px] font-mono text-zinc-600 tracking-wider uppercase">
            SELF PHOTO STUDIO
          </div>
        </div>
      )}

      {/* 1. Classic Clean Border Overlay */}
      {frameId === 'classic' && (
        <div className="absolute inset-0 border-8 border-white/20 sm:border-[14px]">
          <div className="absolute bottom-2 left-4 text-[10px] font-mono-film text-white/60 tracking-widest uppercase">
            Adimas Studio • 35mm
          </div>
        </div>
      )}

      {/* 2. Stage Vibe Neon Glow Border */}
      {frameId === 'stage' && (
        <div className="absolute inset-0 border-4 border-cyan-400/40 shadow-[inset_0_0_25px_rgba(56,189,248,0.3)]">
          <div className="absolute inset-2 border-2 border-rose-500/40 shadow-[inset_0_0_20px_rgba(244,63,94,0.3)]" />
          <div className="absolute top-3 left-4 flex items-center gap-1 text-[10px] font-mono-film text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>STAGE VIP // LIVE FEED</span>
          </div>
          <div className="absolute bottom-3 right-4 text-[10px] font-mono-film text-rose-300">
            AUDIO // STEREO 48kHz
          </div>
        </div>
      )}

      {/* 3. Y2K Vintage Film Look */}
      {frameId === 'vintage' && (
        <div className="absolute inset-0 border-8 border-[#3f2715]/40">
          {/* Film sprockets simulated on sides */}
          <div className="absolute top-0 bottom-0 left-1 w-2 flex flex-col justify-around py-4 opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-2 h-3 bg-amber-200/50 rounded-xs" />
            ))}
          </div>
          <div className="absolute top-0 bottom-0 right-1 w-2 flex flex-col justify-around py-4 opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-2 h-3 bg-amber-200/50 rounded-xs" />
            ))}
          </div>
          <div className="absolute bottom-2 right-4 text-[11px] font-mono-film text-amber-500 font-bold tracking-wider drop-shadow-md">
            '04 09 '26
          </div>
          <div className="absolute top-2 left-4 text-[9px] font-mono-film text-amber-300/80">
            KODAK ADM-400
          </div>
        </div>
      )}

      {/* 4. Pastel Dream */}
      {frameId === 'pastel' && (
        <div className="absolute inset-0 border-6 border-pink-300/30 rounded-lg">
          <div className="absolute top-3 right-4 text-pink-300 text-sm animate-pulse">
            ✧ ♡ ✧
          </div>
          <div className="absolute bottom-3 left-4 text-[10px] text-pink-300/90 font-medium">
            adimas photobooth ♡
          </div>
        </div>
      )}

      {/* 5. Editorial Noir */}
      {frameId === 'monochrome' && (
        <div className="absolute inset-0 border-8 border-black/60">
          <div className="absolute top-3 left-3 text-[9px] font-mono-film text-zinc-400 tracking-widest uppercase">
            ARCHIVE / 01
          </div>
          <div className="absolute bottom-3 right-3 text-[9px] font-mono-film text-zinc-400 tracking-widest uppercase">
            ISO 400 • F/1.8
          </div>
        </div>
      )}

      {/* Viewfinder Camera Guides (Corner brackets & Center target) */}
      {showViewfinderGuides && (
        <>
          {/* Top-Left Bracket */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/60" />
          {/* Top-Right Bracket */}
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/60" />
          {/* Bottom-Left Bracket */}
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/60" />
          {/* Bottom-Right Bracket */}
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/60" />

          {/* Subtle Center Focus crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
            <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500/80" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
