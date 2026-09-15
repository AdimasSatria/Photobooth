import { FilterOption, FrameOption, ArEffectOption } from '../types';

export const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'normal',
    name: 'Natural',
    cssFilter: 'none',
    canvasFilter: 'none',
    badge: 'Raw'
  },
  {
    id: 'beauty-glow',
    name: 'Beauty Glow',
    cssFilter: 'contrast(103%) brightness(109%) saturate(118%)',
    canvasFilter: 'contrast(103%) brightness(109%) saturate(118%)',
    badge: 'Flawless ✨'
  },
  {
    id: 'dreamy-pastel',
    name: 'Soft Glam',
    cssFilter: 'brightness(106%) contrast(98%) saturate(112%) hue-rotate(4deg)',
    canvasFilter: 'brightness(106%) contrast(98%) saturate(112%) hue-rotate(4deg)',
    badge: 'Korean 🌸'
  },
  {
    id: 'grayscale',
    name: 'Noir Mono',
    cssFilter: 'grayscale(100%) contrast(110%)',
    canvasFilter: 'grayscale(100%) contrast(110%)',
    badge: 'B&W'
  },
  {
    id: 'sepia',
    name: 'Sepia Nostalgia',
    cssFilter: 'sepia(85%) contrast(105%) brightness(95%)',
    canvasFilter: 'sepia(85%) contrast(105%) brightness(95%)',
    badge: 'Warm'
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    cssFilter: 'contrast(160%) brightness(105%) saturate(120%)',
    canvasFilter: 'contrast(160%) brightness(105%) saturate(120%)',
    badge: 'Vivid'
  },
  {
    id: 'warm-film',
    name: '35mm Film',
    cssFilter: 'sepia(30%) saturate(135%) contrast(110%) hue-rotate(-10deg)',
    canvasFilter: 'sepia(30%) saturate(135%) contrast(110%) hue-rotate(-10deg)',
    badge: 'Portra'
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Teal',
    cssFilter: 'hue-rotate(180deg) saturate(140%) contrast(115%)',
    canvasFilter: 'hue-rotate(180deg) saturate(140%) contrast(115%)',
    badge: 'Neon'
  }
];

export const AR_EFFECT_OPTIONS: ArEffectOption[] = [
  {
    id: 'none',
    name: 'Normal (Polos)',
    tagline: 'Tanpa aksesoris kepala',
    emoji: '🚫',
    description: 'Tampilan bersih standard studio tanpa efek di kepala.',
  },
  {
    id: 'birds',
    name: 'Burung di Kepala',
    tagline: 'Apple Photo Booth 3D Birds',
    emoji: '🕊️',
    description: 'Burung kuning kartun berputar memutari kepala dengan sayap mengepak dan jejak bintang.',
  },
  {
    id: 'hearts',
    name: 'Love di Kepala',
    tagline: 'Floating Hearts Crown',
    emoji: '💖',
    description: 'Mahkota hati cinta pink melayang berputar di atas kepala dengan kilauan manis dan pipi merona.',
  },
  {
    id: 'halo',
    name: 'Angel Halo',
    tagline: 'Golden Radiance & Sparkles',
    emoji: '👼',
    description: 'Lingkaran cahaya emas bidadari bersinar melayang anggun di atas kepala.',
  },
  {
    id: 'stars',
    name: 'Bintang Kartun',
    tagline: 'Dizzy Cartoon Orbit',
    emoji: '💫',
    description: 'Bintang-bintang pusing berputar dengan jejak spiral animasi retro lucu.',
  },
  {
    id: 'butterflies',
    name: 'Kupu-kupu',
    tagline: 'Pastel Butterfly Garden',
    emoji: '🦋',
    description: 'Kupu-kupu pastel terbang mengitari rambut dengan kepakan sayap lembut.',
  },
  {
    id: 'cat-ears',
    name: 'Telinga Kucing',
    tagline: 'Anime Kitty Ears & Blush',
    emoji: '🐱',
    description: 'Bando telinga kucing lucu dengan rona pipi merah muda dan hidung hati imut.',
  },
];

export const FRAME_OPTIONS: FrameOption[] = [
  {
    id: 'adimas-noir',
    name: 'Adimas Noir',
    tagline: 'Minimalist matte black & crisp studio typography',
    bgHex: '#0a0a0a',
    textHex: '#ffffff',
    accentHex: '#ffffff',
    styleDesc: 'Pure black minimalist card with subtle photo border and corner QR barcode.'
  },
  {
    id: 'adimas-white',
    name: 'Adimas White',
    tagline: 'Minimalist pure gallery white & bold black branding',
    bgHex: '#ffffff',
    textHex: '#0a0a0a',
    accentHex: '#0a0a0a',
    styleDesc: 'Crisp white minimalist card with clean typography and corner QR scan.'
  },
  {
    id: 'classic',
    name: 'The Classic Strip',
    tagline: 'Minimalist white border & timeless studio typography',
    bgHex: '#ffffff',
    textHex: '#0b0f17',
    accentHex: '#94a3b8',
    styleDesc: 'Crisp gallery white card with minimalist serif branding.'
  },
  {
    id: 'stage',
    name: 'Stage Vibe',
    tagline: 'Concert neon glow, dark velvet & backstage energy',
    bgHex: '#0d1117',
    textHex: '#38bdf8',
    accentHex: '#f43f5e',
    styleDesc: 'Dark stage aesthetic with magenta/cyan light borders.'
  },
  {
    id: 'vintage',
    name: 'Y2K / Vintage',
    tagline: '35mm film sprockets, sepia grain & retro orange date',
    bgHex: '#f4ecd8',
    textHex: '#78350f',
    accentHex: '#d97706',
    styleDesc: 'Distressed analog negative film look with sprocket holes.'
  },
  {
    id: 'pastel',
    name: 'Pastel Dream',
    tagline: 'Purikura aura, dreamy blush & starry sparkle vibes',
    bgHex: '#fce7f3',
    textHex: '#831843',
    accentHex: '#ec4899',
    styleDesc: 'Soft lavender-rose border with cute sparkle accents.'
  },
  {
    id: 'monochrome',
    name: 'Editorial Noir',
    tagline: 'Deep onyx, barcode serial & high-fashion grid',
    bgHex: '#121214',
    textHex: '#f3f4f6',
    accentHex: '#71717a',
    styleDesc: 'Luxury magazine dark aesthetic with graphic elements.'
  }
];
