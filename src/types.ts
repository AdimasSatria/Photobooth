export type AspectRatio = '4:3' | '16:9';

export type FilterType = 
  | 'normal' 
  | 'beauty-glow'
  | 'grayscale' 
  | 'sepia' 
  | 'high-contrast' 
  | 'warm-film' 
  | 'cyber-neon'
  | 'dreamy-pastel';

export type ArHeadEffect = 
  | 'none' 
  | 'birds' 
  | 'hearts' 
  | 'halo' 
  | 'stars' 
  | 'butterflies' 
  | 'cat-ears';

export interface ArEffectOption {
  id: ArHeadEffect;
  name: string;
  tagline: string;
  emoji: string;
  description: string;
}

export interface FilterOption {
  id: FilterType;
  name: string;
  cssFilter: string;
  canvasFilter: string;
  badge: string;
}

export type FrameId = 
  | 'adimas-noir'
  | 'adimas-white'
  | 'classic' 
  | 'stage' 
  | 'vintage' 
  | 'pastel' 
  | 'monochrome';

export interface FrameOption {
  id: FrameId;
  name: string;
  tagline: string;
  bgHex: string;
  textHex: string;
  accentHex: string;
  styleDesc: string;
}

export interface CapturedShot {
  id: string;
  dataUrl: string;
  timestamp: number;
  filter: FilterType;
}

export interface BoothSettings {
  aspectRatio: AspectRatio;
  mirror: boolean;
  timerSeconds: number; // 0, 3, 5
  shotMode: 'strip' | 'single'; // 4 shots vs 1 shot
  soundEnabled: boolean;
  filter: FilterType;
  frameId: FrameId;
  customCaption: string;
  showDate: boolean;
  showTimestamp: boolean;
  frameBgColor: string;
  showQrCode: boolean;
  sticker: 'none' | 'stars' | 'hearts' | 'barcode' | 'film';
  arHeadEffect: ArHeadEffect;
  beautyMode: boolean;
  headPositionOffset: number;
}
