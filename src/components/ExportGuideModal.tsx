import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FolderTree, Code, Rocket } from 'lucide-react';

interface ExportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportGuideModal: React.FC<ExportGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'structure' | 'nextjs' | 'deploy'>('setup');

  if (!isOpen) return null;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const setupCommands = `# 1. Create a modern Next.js App Router project
npx create-next-app@latest adimasbooth --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# 2. Navigate to your project directory
cd adimasbooth

# 3. Install dependencies
npm install lucide-react canvas-confetti
npm install -D @types/canvas-confetti

# 4. Run the development server
npm run dev`;

  const fileStructure = `adimasbooth/
├── app/
│   ├── favicon.ico
│   ├── globals.css         # Shutter flash keyframes & film grain
│   ├── layout.tsx          # Root layout with metadata & dark palette
│   └── page.tsx            # Main AdimasBooth photobooth studio interface
├── components/
│   ├── CameraBooth.tsx     # Viewfinder HUD, telemetry & flash sequence
│   ├── Controls.tsx        # Minimal studio controls & tactile shutter
│   ├── FrameOverlay.tsx    # Digital frames & viewfinder alignment
│   ├── Navbar.tsx          # Minimal header, mirror toggle, ratio & sound
│   ├── PreviewRoom.tsx     # Results studio with live restyling & PNG export
│   └── SidebarOptions.tsx  # Frame, emulsion & caption customizer
├── lib/
│   ├── audio.ts            # Web Audio API synthesizer (shutter click & beep)
│   ├── canvasRenderer.ts   # 300 DPI high-res canvas strip generator
│   ├── presets.ts          # Digital frames & CSS/canvas filter definitions
│   └── types.ts            # TypeScript interfaces & types
├── public/
├── tailwind.config.js      # Tailwind configuration with custom animations
└── package.json`;

  const deployGuide = `# Step 1: Initialize Git and Commit
git init
git add .
git commit -m "feat: initial AdimasBooth photobooth web application"

# Step 2: Push to GitHub repository
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/adimasbooth.git
git push -u origin main

# Step 3: Deploy to Vercel
Option A (CLI):
npx vercel

Option B (Vercel Dashboard):
1. Navigate to https://vercel.com/new
2. Connect your GitHub account and import 'adimasbooth'
3. Preset will auto-detect Next.js (or Vite for this container)
4. Click "Deploy"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#F5F5F5]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1A1A1A] flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-white uppercase tracking-widest">Next.js & Vercel Deployment Blueprint</h3>
              <p className="text-[11px] text-[#888] font-mono">Full project structure, dependencies & deployment workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#222] hover:border-white text-[#888] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#1A1A1A] bg-[#0A0A0A] px-4 overflow-x-auto">
          {[
            { id: 'setup', label: '1. Setup Commands', icon: Terminal },
            { id: 'structure', label: '2. Project Tree', icon: FolderTree },
            { id: 'nextjs', label: '3. Architecture Map', icon: Code },
            { id: 'deploy', label: '4. GitHub & Vercel', icon: Rocket }
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 px-4 text-[11px] font-medium uppercase tracking-widest whitespace-nowrap flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === t.id
                    ? 'border-white text-white bg-white/5'
                    : 'border-transparent text-[#666] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: Setup Commands */}
          {activeTab === 'setup' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Terminal Commands</span>
                <button
                  onClick={() => copyText('setup', setupCommands)}
                  className="px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333] hover:border-white text-white text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === 'setup' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'setup' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] text-white text-xs font-mono overflow-x-auto leading-relaxed">
                {setupCommands}
              </pre>
            </div>
          )}

          {/* TAB 2: File Structure */}
          {activeTab === 'structure' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#888]">Project Hierarchy</span>
                <button
                  onClick={() => copyText('tree', fileStructure)}
                  className="px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333] hover:border-white text-white text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === 'tree' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'tree' ? 'Copied' : 'Copy Tree'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] text-[#BBB] text-xs font-mono overflow-x-auto leading-relaxed">
                {fileStructure}
              </pre>
            </div>
          )}

          {/* TAB 3: Next.js Code Map */}
          {activeTab === 'nextjs' && (
            <div className="space-y-4 text-xs text-[#AAA] leading-relaxed font-mono">
              <p>
                The code in AdimasBooth is structured with clean, modular TypeScript components. All files in <code className="text-white">src/components/</code> and <code className="text-white">src/utils/</code> can be ported into Next.js App Router.
              </p>

              <div className="p-4 rounded-xl bg-[#111] border border-[#1A1A1A] space-y-1.5">
                <span className="font-medium text-white uppercase tracking-wider block">Next.js App Router (`app/page.tsx`)</span>
                <p className="text-[#888]">
                  Because camera feeds and canvas manipulation rely on browser DOM APIs (<code className="text-white">navigator.mediaDevices</code> and <code className="text-white">HTMLCanvasElement</code>), declare <code className="text-white">'use client';</code> at the top of <code className="text-white">app/page.tsx</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111] border border-[#1A1A1A] space-y-1.5">
                <span className="font-medium text-white uppercase tracking-wider block">Zero External MP3 Assets & Pure Canvas 2D</span>
                <p className="text-[#888]">
                  AdimasBooth features a native Web Audio API synthesizer for tactile shutter clicks and count ticks, and an optimized 2D Canvas pipeline for 300 DPI export with zero frame degradation.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Deploy Guide */}
          {activeTab === 'deploy' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#888]">GitHub & Vercel Steps</span>
                <button
                  onClick={() => copyText('deploy', deployGuide)}
                  className="px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333] hover:border-white text-white text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey === 'deploy' ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'deploy' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#050505] border border-[#1A1A1A] text-white text-xs font-mono overflow-x-auto leading-relaxed">
                {deployGuide}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1A1A1A] bg-[#0A0A0A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-black hover:bg-[#DDD] font-medium uppercase tracking-widest text-xs transition-colors cursor-pointer"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};
