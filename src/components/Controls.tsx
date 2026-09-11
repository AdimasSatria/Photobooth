import React from 'react';
import { Layers, Palette, Sparkles, Zap } from 'lucide-react';
import { BoothSettings } from '../types';

interface ControlsProps {
  settings: BoothSettings;
  onUpdateSettings: (partial: Partial<BoothSettings>) => void;
  onTriggerCapture: () => void;
  isCapturing: boolean;
  countdown: number | null;
  burstIndex: number | null;
  totalShots: number;
  onOpenSidebar: (tab: 'frames' | 'filters' | 'settings') => void;
}

export const Controls: React.FC<ControlsProps> = ({
  settings,
  onUpdateSettings,
  onTriggerCapture,
  isCapturing,
  countdown,
  burstIndex,
  totalShots,
  onOpenSidebar
}) => {
  return (
    <footer 
      id="adimas-controls-footer"
      className="w-full h-28 sm:h-32 bg-[#0D0D0D] border-t border-[#1A1A1A] flex items-center justify-between px-4 sm:px-12 z-30 shrink-0"
    >
      {/* Left 1/3: Aspect & Customization Triggers */}
      <div className="w-1/3 flex items-center gap-4 sm:gap-8">
        {/* Frame Trigger */}
        <button
          id="open-frames-drawer-btn"
          onClick={() => onOpenSidebar('frames')}
          className="flex flex-col items-start gap-1 text-left cursor-pointer group"
          title="Choose Digital Frame"
        >
          <span className="text-[10px] text-[#555] group-hover:text-[#888] uppercase tracking-widest font-bold transition-colors">
            Frame
          </span>
          <div className="flex items-center gap-1.5 text-xs text-white group-hover:text-white/80">
            <Layers className="w-3.5 h-3.5 text-white/70" />
            <span className="font-mono capitalize hidden sm:inline">{settings.frameId}</span>
          </div>
        </button>

        {/* Filter Trigger */}
        <button
          id="open-filters-drawer-btn"
          onClick={() => onOpenSidebar('filters')}
          className="flex flex-col items-start gap-1 text-left cursor-pointer group"
          title="Choose Filter"
        >
          <span className="text-[10px] text-[#555] group-hover:text-[#888] uppercase tracking-widest font-bold transition-colors">
            Emulsion
          </span>
          <div className="flex items-center gap-1.5 text-xs text-white group-hover:text-white/80">
            <Palette className="w-3.5 h-3.5 text-white/70" />
            <span className="font-mono capitalize hidden sm:inline">{settings.filter}</span>
          </div>
        </button>

        {/* Aspect Ratio Display / Toggle */}
        <div 
          onClick={() => onUpdateSettings({ aspectRatio: settings.aspectRatio === '4:3' ? '16:9' : '4:3' })}
          className="hidden md:flex flex-col gap-1 cursor-pointer select-none"
        >
          <span className="text-[10px] text-[#555] uppercase tracking-widest font-bold">Aspect</span>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs transition-colors ${settings.aspectRatio === '4:3' ? 'text-white font-bold' : 'text-[#444]'}`}>
              4:3
            </span>
            <div className="w-10 h-[2px] bg-[#222] relative rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 h-full w-1/2 bg-white transition-all duration-300 ${
                  settings.aspectRatio === '16:9' ? 'left-1/2' : 'left-0'
                }`}
              />
            </div>
            <span className={`text-xs transition-colors ${settings.aspectRatio === '16:9' ? 'text-white font-bold' : 'text-[#444]'}`}>
              16:9
            </span>
          </div>
        </div>
      </div>

      {/* Center 1/3: The Signature Immersive UI Shutter Button */}
      <div className="w-1/3 flex flex-col items-center justify-center">
        <div className="relative group cursor-pointer">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-white blur-xl opacity-20 group-hover:opacity-45 transition-opacity" />

          <button
            id="main-shutter-btn"
            onClick={onTriggerCapture}
            disabled={isCapturing}
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[5px] sm:border-[6px] border-white bg-transparent flex items-center justify-center transition-all ${
              isCapturing ? 'scale-95 opacity-80 cursor-wait' : 'group-active:scale-95 hover:border-[#EEE]'
            }`}
            title="Trigger Photobooth Shutter"
          >
            {isCapturing ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center text-black font-black text-sm font-mono">
                {countdown !== null ? countdown : `${(burstIndex ?? 0) + 1}/${totalShots}`}
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white group-hover:scale-95 transition-transform" />
            )}
          </button>
        </div>

        <span className="text-[10px] text-[#555] uppercase tracking-widest mt-2 font-mono">
          {isCapturing 
            ? (settings.shotMode === 'strip' ? `Exposing ${(burstIndex ?? 0) + 1} of ${totalShots}` : 'Exposing...')
            : (settings.shotMode === 'strip' ? 'Burst 4-Strip' : 'Single Frame')}
        </span>
      </div>

      {/* Right 1/3: Flash State & Mode Options */}
      <div className="w-1/3 flex justify-end items-center gap-4 sm:gap-8">
        <div className="text-right hidden sm:block">
          <span className="block text-[10px] text-[#555] uppercase tracking-widest font-bold mb-0.5">Flash State</span>
          <span className="text-xs text-white uppercase tracking-tight flex items-center justify-end gap-1 font-mono">
            <Zap className="w-3 h-3 text-white fill-white inline" />
            Enabled (Soft White)
          </span>
        </div>

        {/* Quick Mode Toggle Icon Box */}
        <button
          id="toggle-shot-mode-footer-btn"
          onClick={() => onUpdateSettings({ shotMode: settings.shotMode === 'strip' ? 'single' : 'strip' })}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-[#333] cursor-pointer hover:bg-[#222] transition-colors"
          title={`Mode: ${settings.shotMode === 'strip' ? 'Burst 4-Strip' : 'Single Frame'}`}
        >
          <div className="w-5 h-5 border-2 border-white rounded-sm relative flex items-center justify-center">
            {settings.shotMode === 'strip' ? (
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            ) : (
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </div>
        </button>
      </div>
    </footer>
  );
};
