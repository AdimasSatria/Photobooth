import React from 'react';
import { X, Check, Palette, Layers, Type, Calendar, Sparkles, QrCode, Heart, ChevronUp, ChevronDown } from 'lucide-react';
import { BoothSettings, ArHeadEffect } from '../types';
import { FILTER_OPTIONS, FRAME_OPTIONS, AR_EFFECT_OPTIONS } from '../utils/presets';

interface SidebarOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'frames' | 'filters' | 'settings' | 'ar';
  onChangeTab: (tab: 'frames' | 'filters' | 'settings' | 'ar') => void;
  settings: BoothSettings;
  onUpdateSettings: (partial: Partial<BoothSettings>) => void;
}

export const SidebarOptions: React.FC<SidebarOptionsProps> = ({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div 
        id="options-sidebar-panel"
        className="w-full max-w-md bg-[#0D0D0D] border-l border-[#1A1A1A] h-full flex flex-col shadow-2xl text-[#F5F5F5] animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1A1A1A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <h2 className="font-medium text-sm tracking-widest uppercase">Studio Customizer</h2>
          </div>
          <button
            id="close-sidebar-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#222] hover:border-white text-[#888] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1A1A1A] bg-[#0A0A0A] overflow-x-auto scrollbar-none">
          <button
            id="tab-frames-btn"
            onClick={() => onChangeTab('frames')}
            className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'frames'
                ? 'border-white text-white bg-white/5 font-semibold'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Frames
          </button>
          <button
            id="tab-filters-btn"
            onClick={() => onChangeTab('filters')}
            className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'filters'
                ? 'border-white text-white bg-white/5 font-semibold'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Emulsion
          </button>
          <button
            id="tab-ar-btn"
            onClick={() => onChangeTab('ar')}
            className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ar'
                ? 'border-pink-400 text-pink-300 bg-pink-500/10 font-semibold'
                : 'border-transparent text-[#888] hover:text-pink-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            AR & Beauty
          </button>
          <button
            id="tab-settings-btn"
            onClick={() => onChangeTab('settings')}
            className={`flex-1 py-3 px-2 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider flex items-center justify-center gap-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-white text-white bg-white/5 font-semibold'
                : 'border-transparent text-[#666] hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Caption
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: FRAMES */}
          {activeTab === 'frames' && (
            <div className="space-y-3">
              <p className="text-xs text-[#888] font-mono leading-relaxed">
                Select your architectural frame layout for high-density 300 DPI rendering.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {FRAME_OPTIONS.map((f) => {
                  const isSelected = settings.frameId === f.id;
                  return (
                    <button
                      key={f.id}
                      id={`frame-opt-${f.id}`}
                      onClick={() => onUpdateSettings({ frameId: f.id, frameBgColor: f.bgHex })}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#151515] border-white ring-1 ring-white shadow-lg'
                          : 'bg-[#111] border-[#222] hover:border-[#444]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Swatch */}
                        <div
                          className="w-10 h-14 rounded border shadow-inner shrink-0 flex flex-col justify-between p-1"
                          style={{ backgroundColor: f.bgHex, borderColor: f.accentHex }}
                        >
                          <div className="w-full h-2 rounded-xs bg-black/20" />
                          <div className="w-full h-2 rounded-xs bg-black/20" />
                          <div className="w-full h-2 rounded-xs bg-black/20" />
                          <div
                            className="w-full h-1.5 rounded-xs"
                            style={{ backgroundColor: f.accentHex }}
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white uppercase tracking-wider">{f.name}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-white text-black">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#888] mt-1">{f.tagline}</p>
                          <p className="text-[11px] text-[#666] mt-1 font-mono italic">{f.styleDesc}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FILTERS */}
          {activeTab === 'filters' && (
            <div className="space-y-3">
              <p className="text-xs text-[#888] font-mono leading-relaxed">
                Hardware shader applied live to video frames and baked into the final export.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {FILTER_OPTIONS.map((fil) => {
                  const isSelected = settings.filter === fil.id;
                  return (
                    <button
                      key={fil.id}
                      id={`filter-opt-${fil.id}`}
                      onClick={() => onUpdateSettings({ filter: fil.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white/10 border-white ring-1 ring-white shadow-lg'
                          : 'bg-[#111] border-[#222] hover:border-[#444]'
                      }`}
                    >
                      <div 
                        className="w-full h-16 rounded-lg overflow-hidden relative mb-2.5 bg-black border border-[#2A2A2A] flex items-center justify-center"
                        style={{ filter: fil.cssFilter }}
                      >
                        <div className="w-full h-full bg-gradient-to-tr from-[#333] via-[#666] to-[#999] flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-white uppercase tracking-wider">{fil.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#222] text-[#AAA]">
                          {fil.badge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: AR & BEAUTY EFFECTS (Filter Burung & Love di Kepala) */}
          {activeTab === 'ar' && (
            <div className="space-y-4">
              {/* Beauty Mode Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-pink-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Beauty Glow Filter</h3>
                      <p className="text-[10px] text-pink-400 font-mono">Soft-focus skin smoothing & warm tone</p>
                    </div>
                  </div>
                  <input
                    id="toggle-beauty-mode-sidebar"
                    type="checkbox"
                    checked={settings.beautyMode}
                    onChange={(e) => onUpdateSettings({ beautyMode: e.target.checked })}
                    className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-[#888] font-mono leading-relaxed mt-2">
                  Menghaluskan tekstur kulit, memberi kilau pencahayaan alami (glow), dan mencerahkan wajah seperti booth foto kecantikan.
                </p>
              </div>

              {/* AR Head Effects */}
              <div>
                <label className="block text-[11px] font-medium text-[#AAA] mb-2 uppercase tracking-widest flex items-center justify-between">
                  <span>Pilih Efek di Kepala (Mirip Booth Apple)</span>
                  <span className="text-[10px] text-pink-400 font-mono">Real-time AR</span>
                </label>

                <div className="space-y-2">
                  {AR_EFFECT_OPTIONS.map((eff) => {
                    const isSelected = settings.arHeadEffect === eff.id;
                    return (
                      <button
                        key={eff.id}
                        id={`sidebar-ar-effect-${eff.id}`}
                        onClick={() => onUpdateSettings({ arHeadEffect: eff.id })}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-gradient-to-r from-white/10 to-pink-500/10 border-pink-400 ring-1 ring-pink-400 shadow-md'
                            : 'bg-[#111] border-[#222] hover:border-[#444]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl w-8 text-center">{eff.emoji}</span>
                          <div>
                            <div className="text-xs font-semibold text-white tracking-wide flex items-center gap-2">
                              {eff.name}
                              {eff.id === 'birds' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">Apple Booth</span>
                              )}
                              {eff.id === 'hearts' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono">Popular</span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#888] font-mono mt-0.5">{eff.description}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-pink-400 text-black flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Head Position Calibration */}
              {settings.arHeadEffect !== 'none' && (
                <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white uppercase tracking-wider">Kalibrasi Posisi Efek</span>
                    <span className="text-[11px] text-[#888] font-mono">
                      {Math.round((settings.headPositionOffset ?? 0.26) * 100)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#888] font-mono">
                    Sesuaikan posisi burung / love agar pas berada di atas kepala Anda.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          headPositionOffset: Math.max(0.15, (settings.headPositionOffset ?? 0.26) - 0.03),
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-white hover:text-black transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      Lebih Tinggi
                    </button>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          headPositionOffset: Math.min(0.38, (settings.headPositionOffset ?? 0.26) + 0.03),
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-white hover:text-black transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Lebih Rendah
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ headPositionOffset: 0.26 })}
                      className="text-[11px] text-[#666] hover:text-white underline ml-auto cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CUSTOM CAPTION & STYLE */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Custom Caption */}
              <div>
                <label className="block text-[11px] font-medium text-[#888] mb-2 uppercase tracking-widest">
                  Bottom Caption / Title
                </label>
                <input
                  id="custom-caption-input"
                  type="text"
                  value={settings.customCaption}
                  onChange={(e) => onUpdateSettings({ customCaption: e.target.value })}
                  placeholder="ADIMAS BOOTH"
                  maxLength={36}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white placeholder-[#555] text-sm font-mono focus:outline-none focus:border-white"
                />
                <p className="text-[11px] text-[#666] mt-1.5 font-mono">
                  Printed in high-contrast display typography at the base.
                </p>
              </div>

              {/* Date Stamp Toggle */}
              <div className="pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-white flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-white/80" />
                    Date Stamp
                  </div>
                  <p className="text-[11px] text-[#666] font-mono mt-0.5">Embed current timestamp into strip footer</p>
                </div>
                <input
                  id="toggle-date-stamp-checkbox"
                  type="checkbox"
                  checked={settings.showDate}
                  onChange={(e) => onUpdateSettings({ showDate: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </div>

              {/* QR Code Stamp Toggle */}
              <div className="pt-3 border-t border-[#1A1A1A] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-white flex items-center gap-2">
                    <QrCode className="w-3.5 h-3.5 text-white/80" />
                    QR Scan Stamp
                  </div>
                  <p className="text-[11px] text-[#666] font-mono mt-0.5">Embed scannable studio barcode into strip footer</p>
                </div>
                <input
                  id="toggle-qr-stamp-checkbox"
                  type="checkbox"
                  checked={settings.showQrCode}
                  onChange={(e) => onUpdateSettings({ showQrCode: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </div>

              {/* Frame Card Color */}
              <div className="pt-3 border-t border-[#1A1A1A]">
                <label className="block text-[11px] font-medium text-[#888] mb-2 uppercase tracking-widest">
                  Card Tone
                </label>
                <div className="flex items-center gap-2.5">
                  {[
                    { label: 'Obsidian', hex: '#0D0D0D' },
                    { label: 'Pure White', hex: '#FFFFFF' },
                    { label: 'Bone White', hex: '#F0ECE1' },
                    { label: 'Charcoal', hex: '#1C1C1E' },
                    { label: 'Sepia Noir', hex: '#2A221B' }
                  ].map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateSettings({ frameBgColor: c.hex })}
                      className={`w-8 h-8 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                        settings.frameBgColor === c.hex ? 'ring-2 ring-white scale-110' : 'border-[#333]'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {settings.frameBgColor === c.hex && (
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Embellishment Stamp */}
              <div className="pt-3 border-t border-[#1A1A1A]">
                <label className="block text-[11px] font-medium text-[#888] mb-2 uppercase tracking-widest">
                  Embellishment Stamp
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'none', label: 'None', icon: '✕' },
                    { id: 'hearts', label: 'Hearts', icon: '🖤' },
                    { id: 'stars', label: 'Stars', icon: '✦' },
                    { id: 'barcode', label: 'Flash', icon: '⚡' },
                    { id: 'film', label: '35mm', icon: '🎞' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => onUpdateSettings({ sticker: st.id as BoothSettings['sticker'] })}
                      className={`py-2.5 rounded-lg border text-xs font-mono flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        settings.sticker === st.id
                          ? 'bg-white text-black border-white'
                          : 'bg-[#141414] border-[#2A2A2A] text-[#888] hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{st.icon}</span>
                      <span className="text-[9px] uppercase">{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#1A1A1A] bg-[#0A0A0A]">
          <button
            id="apply-sidebar-btn"
            onClick={onClose}
            className="w-full py-3 rounded-full bg-white text-black hover:bg-[#DDD] font-medium uppercase tracking-widest text-xs transition-all cursor-pointer"
          >
            Apply & Return to Studio
          </button>
        </div>
      </div>
    </div>
  );
};
