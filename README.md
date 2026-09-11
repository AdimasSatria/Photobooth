# AdimasBooth 📸

> An immersive, minimalist online photobooth studio with live webcam capture, automated 4-shot burst sequencing, vintage emulsion filters, architectural frames, and instant 300 DPI photo strip export.

---

## Overview

**AdimasBooth** brings the tactile charm of analog 35mm film strips and modern arcade photo booths to the web. Designed with an **Immersive UI** aesthetic—featuring deep obsidian surfaces, clean telemetry typography, and studio-grade HUD overlays—AdimasBooth allows users to capture single frames or 4-photo burst strips, apply live color emulsions, customize card tones, and export print-ready PNG strips directly from their browser.

---

## Features

- **Live Studio Viewfinder**:
  - Direct hardware webcam streaming with full resolution capture.
  - Horizontal mirror flip toggle for natural framing.
  - Switchable aspect ratios (`4:3` Studio Standard or `16:9` Cinematic Wide).
  - Telemetry HUD with live timecode, REC indicator, simulated ISO/shutter metrics, and focus reticles.
  - Built-in **Studio Simulation Mode** and manual photo upload fallback if webcam permissions are unavailable.

- **Automated Burst Sequencing & Tactile Sound**:
  - Automated 4-shot sequence with visual countdowns (3s or 5s delay).
  - Synchronized screen flash animation on shutter exposure.
  - Native **Web Audio API** synthesizer delivering mechanical shutter clicks and timer beeps without external MP3 dependencies.

- **Architectural Frames & Studio Presets**:
  - **Adimas Noir**: Minimalist matte black card with crisp white geometric branding and corner QR barcode.
  - **Adimas White**: Pure minimalist gallery white card with bold black typography and corner QR scan stamp.
  - **Frame Layouts**: Adimas Noir, Adimas White, Classic Studio, Retro 35mm Film, Stage Neon, Obsidian Minimal, and Pastel Dream.
  - **Emulsion Shaders**: Natural Raw, B&W High Contrast, Warm Tungsten, Vintage Sepia, Cool Fuji Chrome, and Cyber Noir.
  - **Card Color Tones**: Obsidian, Pure White, Bone White, Charcoal, and Sepia Noir.

- **3 Output Formats (Strip, 1/1 Mentahan Polosan, Animated GIF)**:
  - **1. Photo Strip (300 DPI)**: Direct HTML5 Canvas 2D rendering pipeline that bakes frames, emulsions, timestamps, custom captions, and corner QR scan barcode into a razor-sharp print-ready strip.
  - **2. Foto Mentahan 1/1 (Polosan / Raw Cuts)**: Individual raw full-bleed photo cuts without frames, cards, borders, or extra footers. Pure original camera resolution, downloadable 1-by-1 or as an all-inclusive ZIP archive.
  - **3. Animated Photobooth GIF**: Looping `.gif` mentahan polosan (tanpa frame, border, atau watermark) yang di-encode langsung di browser via `gifenc` dengan mode Boomerang dan kontrol kecepatan.
  - **✨ Paket Lengkap 3 Format (.ZIP)**: 1-click master download that bundles the final Photo Strip, all 4 Mentahan 1/1 raw photos, and the Animated GIF in a single download.

- **Direct Barcode / QR Code Mobile Sync (Tanpa Database Cloud Eksternal)**:
  - Scannable QR code embedded directly onto the bottom corner of the photo strip and available in the "Scan Barcode / Buka di HP" modal.
  - Generates a direct session link (`/?session=adimas-xxxxxx`). Ketika di-scan dengan kamera HP, smartphone langsung membuka halaman hasil foto khusus mobile untuk mengunduh Photo Strip, 4 Mentahan Polosan, dan Animated GIF langsung ke galeri HP.
  - Didukung oleh lightweight in-memory sync endpoint tanpa memerlukan konfigurasi database cloud atau akun berbayar.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio Engine**: Native Browser [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **Effects**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

---

## Project Structure

```
adimasbooth/
├── src/
│   ├── components/
│   │   ├── CameraBooth.tsx       # Webcam feed, REC HUD, countdown, burst logic & flash
│   │   ├── Controls.tsx          # Tactile shutter dock, timer toggles, and mode buttons
│   │   ├── ExportGuideModal.tsx  # Next.js & Vercel deployment blueprint modal
│   │   ├── FrameOverlay.tsx      # Viewfinder digital frame overlay
│   │   ├── Navbar.tsx            # Header status bar, aspect ratio, mirror & sound toggles
│   │   ├── PreviewRoom.tsx       # Studio developing room, 300 DPI preview & instant export
│   │   └── SidebarOptions.tsx    # Slide-out drawer for frames, filters, and captions
│   ├── utils/
│   │   ├── audio.ts              # Web Audio API synthesizer for shutter click & countdown
│   │   ├── canvasRenderer.ts     # 300 DPI photo strip canvas compositing engine
│   │   └── presets.ts            # Digital frames, filters, stickers & color definitions
│   ├── App.tsx                   # Master studio state coordinator
│   ├── index.css                 # Global Tailwind CSS entry & base styling
│   ├── main.tsx                  # React application root
│   └── types.ts                  # Shared TypeScript interfaces & types
├── index.html                    # HTML entry point with fonts & metadata
├── metadata.json                 # AI Studio applet configuration & frame permissions
├── package.json                  # Dependencies and scripts
└── vite.config.ts                # Vite configuration
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- npm, pnpm, or yarn

### Installation

1. Clone or download the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/adimasbooth.git
   cd adimasbooth
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Build for production:
   ```bash
   npm run build
   ```

5. Type check / linting:
   ```bash
   npm run lint
   ```

---

## Next.js & Vercel Migration

To deploy AdimasBooth in a **Next.js App Router** project:

1. Place the component files into your Next.js `components/` directory.
2. Since camera capture and canvas manipulation require browser DOM APIs (`navigator.mediaDevices` and `HTMLCanvasElement`), include `'use client';` at the top of your page component (`app/page.tsx`).
3. Deploy directly via Vercel CLI (`npx vercel`) or by importing your GitHub repository into the Vercel dashboard.

---

## License

MIT License. Designed and built for AdimasBooth.
