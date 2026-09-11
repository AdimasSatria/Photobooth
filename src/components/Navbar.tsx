import React from 'react';
import { Volume2, VolumeX, FlipHorizontal, Ratio } from 'lucide-react';
import { AspectRatio } from '../types';

interface NavbarProps {
  aspectRatio: AspectRatio;
  onToggleAspectRatio: () => void;
  mirror: boolean;
  onToggleMirror: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeView: 'booth' | 'preview';
}

export const Navbar: React.FC<NavbarProps> = ({
  aspectRatio,
  onToggleAspectRatio,
  mirror,
  onToggleMirror,
  soundEnabled,
  onToggleSound,
  activeView
}) => {
  return (
    <header id="adimas-navbar" className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-[#1A1A1A] bg-[#0D0D0D] sticky top-0 z-40">
      {/* Brand Identity - Immersive UI circular aperture icon */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
          <div className="w-4 h-4 rounded-full border-2 border-black"></div>
        </div>
        <h1 className="text-lg sm:text-xl font-medium tracking-tight uppercase text-[#F5F5F5]">
          Adimas<span className="font-light opacity-60">Booth</span>
        </h1>
      </div>

      {/* Center Nav Indicators */}
      <div className="hidden md:flex items-center gap-6 text-xs font-medium tracking-widest text-[#888]">
        <span className={`transition-colors uppercase ${
          activeView === 'booth' ? 'text-white border-b-2 border-white pb-1' : 'opacity-60'
        }`}>
          LIVE FEED
        </span>
        <span className={`transition-colors uppercase ${
          activeView === 'preview' ? 'text-white border-b-2 border-white pb-1' : 'opacity-60'
        }`}>
          STUDIO ARCHIVE
        </span>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {activeView === 'booth' && (
          <>
            {/* Aspect Ratio */}
            <button
              id="toggle-aspect-ratio-btn"
              onClick={onToggleAspectRatio}
              className="px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-widest bg-[#141414] border border-[#2A2A2A] hover:border-white text-[#CCC] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title={`Switch aspect ratio (Currently ${aspectRatio})`}
            >
              <Ratio className="w-3.5 h-3.5 text-white/80" />
              <span className="font-mono">{aspectRatio}</span>
            </button>

            {/* Mirror Toggle */}
            <button
              id="toggle-mirror-btn"
              onClick={onToggleMirror}
              className={`p-2 rounded-full text-xs border transition-all cursor-pointer ${
                mirror
                  ? 'bg-white text-black border-white'
                  : 'bg-[#141414] border-[#2A2A2A] text-[#888] hover:text-white hover:border-[#444]'
              }`}
              title={mirror ? 'Mirror Mode Active' : 'Mirror Mode Off'}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Sound Toggle */}
        <button
          id="toggle-sound-btn"
          onClick={onToggleSound}
          className={`p-2 rounded-full text-xs border transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-[#141414] border-[#2A2A2A] text-white hover:border-white'
              : 'bg-[#0A0A0A] border-[#1F1F1F] text-[#555]'
          }`}
          title={soundEnabled ? 'Shutter audio enabled' : 'Muted'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
