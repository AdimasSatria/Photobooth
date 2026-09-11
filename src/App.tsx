import React, { useState, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CameraBooth } from './components/CameraBooth';
import { Controls } from './components/Controls';
import { SidebarOptions } from './components/SidebarOptions';
import { PreviewRoom } from './components/PreviewRoom';
import { MobileScanResult } from './components/MobileScanResult';
import { BoothSettings, CapturedShot } from './types';
import { soundEffects } from './utils/audio';

export default function App() {
  const [mobileSessionId, setMobileSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('session');
  });

  const [activeView, setActiveView] = useState<'booth' | 'preview'>('booth');
  const [shots, setShots] = useState<CapturedShot[]>([]);

  // Studio Settings
  const [settings, setSettings] = useState<BoothSettings>({
    aspectRatio: '4:3',
    mirror: true,
    timerSeconds: 3,
    shotMode: 'strip',
    soundEnabled: true,
    filter: 'normal',
    frameId: 'adimas-noir',
    customCaption: 'ADIMAS BOOTH',
    showDate: true,
    showTimestamp: true,
    showQrCode: true,
    frameBgColor: '#0a0a0a',
    sticker: 'none'
  });

  // Capture loop state
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [burstIndex, setBurstIndex] = useState<number | null>(null);

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState<'frames' | 'filters' | 'settings' | null>(null);

  // Registered capture function from CameraBooth
  const captureHandlerRef = useRef<(() => Promise<string>) | null>(null);

  const registerCaptureHandler = useCallback((fn: () => Promise<string>) => {
    captureHandlerRef.current = fn;
  }, []);

  const handleUpdateSettings = (partial: Partial<BoothSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Helper delay
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Trigger Burst / Single Capture Sequence
  const handleTriggerCapture = async () => {
    if (isCapturing || !captureHandlerRef.current) return;

    setIsCapturing(true);
    const total = settings.shotMode === 'strip' ? 4 : 1;
    const capturedList: CapturedShot[] = [];

    try {
      for (let i = 0; i < total; i++) {
        setBurstIndex(i);

        // Countdown sequence (e.g. 3, 2, 1)
        if (settings.timerSeconds > 0) {
          for (let s = settings.timerSeconds; s > 0; s--) {
            setCountdown(s);
            if (settings.soundEnabled) {
              soundEffects.playCountdownTick(s === 1);
            }
            await sleep(1000);
          }
        }

        // Shutter snap moment
        setCountdown(null);
        setFlashActive(true);
        if (settings.soundEnabled) {
          soundEffects.playShutter();
        }

        // Grab high-res frame from video
        const frameDataUrl = await captureHandlerRef.current();

        await sleep(350);
        setFlashActive(false);

        capturedList.push({
          id: `shot-${Date.now()}-${i}`,
          dataUrl: frameDataUrl,
          timestamp: Date.now(),
          filter: settings.filter
        });

        // Small inter-shot buffer for multi-burst strip so user can switch pose
        if (i < total - 1) {
          await sleep(1200);
        }
      }

      // Finish capture sequence
      setShots(capturedList);
      await sleep(400);
      setActiveView('preview');
    } catch (err) {
      console.error('Error during photo capture:', err);
    } finally {
      setIsCapturing(false);
      setCountdown(null);
      setBurstIndex(null);
      setFlashActive(false);
    }
  };

  const handleRetake = () => {
    setShots([]);
    setActiveView('booth');
  };

  // If user scanned QR code from their mobile phone, display mobile scan viewer
  if (mobileSessionId) {
    return (
      <MobileScanResult
        sessionId={mobileSessionId}
        onBackToBooth={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setMobileSessionId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex flex-col selection:bg-white selection:text-black relative">
      {/* Navigation & Status Bar */}
      <Navbar
        aspectRatio={settings.aspectRatio}
        onToggleAspectRatio={() =>
          handleUpdateSettings({
            aspectRatio: settings.aspectRatio === '4:3' ? '16:9' : '4:3'
          })
        }
        mirror={settings.mirror}
        onToggleMirror={() => handleUpdateSettings({ mirror: !settings.mirror })}
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => handleUpdateSettings({ soundEnabled: !settings.soundEnabled })}
        activeView={activeView}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col items-center justify-between w-full relative">
        {activeView === 'booth' ? (
          <div className="w-full flex-1 flex flex-col justify-between">
            {/* Viewfinder Area */}
            <CameraBooth
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              isCapturing={isCapturing}
              countdown={countdown}
              flashActive={flashActive}
              burstIndex={burstIndex}
              totalShots={settings.shotMode === 'strip' ? 4 : 1}
              registerCaptureHandler={registerCaptureHandler}
            />

            {/* Bottom Floating Control Panel */}
            <Controls
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onTriggerCapture={handleTriggerCapture}
              isCapturing={isCapturing}
              countdown={countdown}
              burstIndex={burstIndex}
              totalShots={settings.shotMode === 'strip' ? 4 : 1}
              onOpenSidebar={(tab) => setSidebarTab(tab)}
            />
          </div>
        ) : (
          <PreviewRoom
            shots={shots}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onRetake={handleRetake}
          />
        )}
      </main>

      {/* Customizer Sidebar (Frames, Filters, Captions) */}
      <SidebarOptions
        isOpen={sidebarTab !== null}
        onClose={() => setSidebarTab(null)}
        activeTab={sidebarTab || 'frames'}
        onChangeTab={(t) => setSidebarTab(t)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
