import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone, Volume2 } from 'lucide-react';
import {
  VEHICLE_MAP,
  type AgeMode,
  type MissionSnapshot,
  type VehicleId,
  type ViewMode,
} from './types/game';
import { soundEngine } from './audio/soundEngine';
import { GameEngine } from './three/GameEngine';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { CelebrationModal } from './components/CelebrationModal';
import { LoadingScreen } from './components/LoadingScreen';
import { LandscapeGuard } from './components/LandscapeGuard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useLandscapeLock } from './hooks/useLandscapeLock';

const STORAGE_KEY = 'kota_kendaraan_ceria_3d_v1';

const DEFAULT_STARS: Record<VehicleId, number> = {
  molen: 0,
  angkut: 0,
  tangki: 0,
  crane: 0,
  pemadam: 0,
  sampah: 0,
};

function loadSavedState(): {
  ageMode: AgeMode;
  soundEnabled: boolean;
  starsByTruck: Record<VehicleId, number>;
} {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ageMode: 'toddler', soundEnabled: true, starsByTruck: { ...DEFAULT_STARS } };
    }
    const parsed = JSON.parse(raw);
    return {
      ageMode: parsed.ageMode === 'preschool' ? 'preschool' : 'toddler',
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
      starsByTruck: { ...DEFAULT_STARS, ...(parsed.starsByTruck || {}) },
    };
  } catch {
    return { ageMode: 'toddler', soundEnabled: true, starsByTruck: { ...DEFAULT_STARS } };
  }
}

export default function App() {
  const initial = useMemo(() => loadSavedState(), []);
  const [viewMode, setViewMode] = useState<ViewMode>('GARAGE');
  const [selectedTruck, setSelectedTruck] = useState<VehicleId | null>(null);
  const [ageMode, setAgeMode] = useState<AgeMode>(initial.ageMode);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initial.soundEnabled);
  const [starsByTruck, setStarsByTruck] = useState<Record<VehicleId, number>>(initial.starsByTruck);
  const [mission, setMission] = useState<MissionSnapshot | null>(null);
  const [celebratingTruck, setCelebratingTruck] = useState<VehicleId | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [engineReady, setEngineReady] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(18);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const { isPortrait, lockLandscape } = useLandscapeLock();

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const ageModeRef = useRef<AgeMode>(ageMode);
  ageModeRef.current = ageMode;

  const selectedTruckRef = useRef<VehicleId | null>(selectedTruck);
  selectedTruckRef.current = selectedTruck;

  // Smooth staged progress animation up to 100% once Three.js engine signals ready
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLoadProgress((prev) => {
        const cap = engineReady ? 100 : 88;
        if (prev >= cap) return cap;
        const step = engineReady ? 14 : 9;
        return Math.min(cap, prev + step);
      });
    }, 90);
    return () => window.clearInterval(timer);
  }, [engineReady]);

  // Persist user preferences & stars
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ageMode, soundEnabled, starsByTruck }),
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [ageMode, soundEnabled, starsByTruck]);

  const startVehicleMission = useCallback((vehicleId: VehicleId, modeOverride?: AgeMode) => {
    soundEngine.unlock();
    const activeAge = modeOverride ?? ageModeRef.current;
    setSelectedTruck(vehicleId);
    setViewMode('MISSION');
    setCelebratingTruck(null);
    setDockCollapsed(false);
    engineRef.current?.startMission(vehicleId, activeAge);
  }, []);

  const handleBackToGarage = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playPop();
    setViewMode('GARAGE');
    setSelectedTruck(null);
    setMission(null);
    setCelebratingTruck(null);
    engineRef.current?.enterGarage();
    soundEngine.speakBilingual(
      'Selamat datang di Kota Kendaraan! Pilih truk kesukaanmu!',
      'Welcome to Vehicle Town! Pick your favorite truck!',
    );
  }, []);

  const handleStartGame = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playSuccessChime();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    void lockLandscape(isTouchDevice);
    setGameStarted(true);
    soundEngine.speakBilingual(
      'Selamat datang di Kota Kendaraan Ceria! Pilih truk kesukaanmu!',
      'Welcome to Vehicle Town! Pick your favorite truck!',
    );
  }, [lockLandscape]);

  // Initialize Three.js WebGL Engine ONCE in isolated canvas mount ref
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new GameEngine(mount, {
      onSelectTruckFrom3D: (vid) => {
        startVehicleMission(vid);
      },
      onMissionSnapshot: (snap) => {
        setMission(snap);
      },
      onCelebrate: (vid) => {
        setCelebratingTruck(vid);
        setStarsByTruck((prev) => ({
          ...prev,
          [vid]: (prev[vid] || 0) + 1,
        }));
        soundEngine.playCelebrateFanfare();
        soundEngine.speakBilingual('Hebat sekali! Kamu dapat bintang!', 'Great job! You earned a star!');
      },
      onContextLost: (lost) => {
        setContextLost(lost);
      },
      onReady: () => {
        setEngineReady(true);
      },
    });
    engineRef.current = engine;

    return () => {
      soundEngine.stopSpeech();
      engine.dispose();
      engineRef.current = null;
    };
  }, [startVehicleMission]);

  // Keyboard shortcuts (H to collapse HUD, arrows/space for Crane)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((c) => !c);
      } else if (selectedTruckRef.current === 'crane') {
        if (e.key === 'ArrowLeft') {
          engineRef.current?.dispatchMissionAction('CRANE_MOVE', -1);
        } else if (e.key === 'ArrowRight') {
          engineRef.current?.dispatchMissionAction('CRANE_MOVE', 1);
        } else if (e.key === ' ' || e.key === 'Enter') {
          engineRef.current?.dispatchMissionAction('CRANE_DROP');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameStarted]);

  const handleChangeAgeMode = (nextMode: AgeMode) => {
    soundEngine.unlock();
    soundEngine.playPop();
    setAgeMode(nextMode);
    soundEngine.speakBilingual(
      nextMode === 'toddler' ? 'Mode Balita dua sampai tiga tahun!' : 'Mode Prasekolah empat sampai enam tahun!',
      nextMode === 'toddler' ? 'Toddler mode!' : 'Preschool mode!',
    );
    if (viewMode === 'MISSION' && selectedTruck) {
      startVehicleMission(selectedTruck, nextMode);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setEnabled(next);
    if (next) {
      soundEngine.unlock();
      soundEngine.playPop();
    }
  };

  const handleHonkTruck = (id: VehicleId) => {
    soundEngine.unlock();
    engineRef.current?.honkTruck(id);
  };

  const handleRepeatVoice = () => {
    soundEngine.unlock();
    if (viewMode === 'GARAGE') {
      soundEngine.speakBilingual(
        'Ketuk truk 3D atau tombol di bawah untuk mulai bermain!',
        'Tap any 3D truck or button below to play!',
      );
    } else if (mission) {
      soundEngine.speakBilingual(mission.promptId, mission.promptEn);
    }
  };

  const totalStars = Object.values(starsByTruck).reduce((sum, n) => sum + n, 0);
  const currentVehicle = selectedTruck ? VEHICLE_MAP[selectedTruck] : null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#D9F0FF]">
      {/* Dedicated Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Dunia 3D Kota Kendaraan Ceria"
      />

      {/* Graceful WebGL Context Fallback */}
      {contextLost && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-sky-100 p-6 text-center">
          <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h2 className="font-display text-xl font-extrabold text-slate-900">
              Menyiapkan Dunia 3D...
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Layar 3D sedang dipulihkan secara otomatis. Silakan tunggu sebentar atau muat ulang halaman.
            </p>
          </div>
        </div>
      )}

      {/* Semantic DOM HUD Overlay (Zero Viewport Occlusion, No backdrop-filter over WebGL) */}
      {gameStarted && (
        <>
          <div className="pointer-events-none relative z-10 flex h-full flex-col">
            <TopBar
              viewMode={viewMode}
              ageMode={ageMode}
              soundEnabled={soundEnabled}
              totalStars={totalStars}
              onBackToGarage={handleBackToGarage}
              onChangeAgeMode={handleChangeAgeMode}
              onToggleSound={handleToggleSound}
            />

            {/* Compact Bilingual Voice & Prompt Banner (Sits neatly in sky above 3D trucks) */}
            <div className="mt-3 flex justify-center px-3">
              <div className="pointer-events-auto flex max-w-[820px] items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm">
                <button
                  type="button"
                  onClick={handleRepeatVoice}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm transition-transform active:scale-95 hover:bg-sky-600 cursor-pointer"
                  title="Dengar suara lagi"
                  aria-label="Dengar suara instruksi lagi"
                >
                  <Volume2 className="h-5 w-5" />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-extrabold text-slate-900 sm:text-base leading-snug">
                    {viewMode === 'GARAGE'
                      ? 'Pilih truk 3D kesukaanmu untuk mulai belajar dan bermain!'
                      : mission?.promptId || ''}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 leading-snug">
                    {viewMode === 'GARAGE'
                      ? 'Tap any 3D truck or pick from the dock below to play!'
                      : mission?.promptEn || ''}
                  </p>
                </div>

                {viewMode === 'MISSION' && currentVehicle && (
                  <button
                    type="button"
                    onClick={() => handleHonkTruck(currentVehicle.id)}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-extrabold text-white transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
                    style={{ backgroundColor: currentVehicle.accentHex }}
                    aria-label={`Bunyikan klakson ${currentVehicle.nameId}`}
                  >
                    <Megaphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Klakson</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unified Collapsible Bottom Control Dock */}
          <BottomDock
            viewMode={viewMode}
            ageMode={ageMode}
            collapsed={dockCollapsed}
            starsByTruck={starsByTruck}
            mission={mission}
            onToggleCollapse={() => setDockCollapsed((c) => !c)}
            onSelectTruck={(id) => startVehicleMission(id)}
            onHonkTruck={handleHonkTruck}
            onDispatchAction={(action, payload) => {
              soundEngine.unlock();
              engineRef.current?.dispatchMissionAction(action, payload);
            }}
          />

          {/* Star Celebration Modal */}
          {celebratingTruck && (
            <CelebrationModal
              vehicleId={celebratingTruck}
              onPlayAgain={() => startVehicleMission(celebratingTruck)}
              onBackToGarage={handleBackToGarage}
            />
          )}
        </>
      )}

      {/* Pre-Game Loading Screen */}
      {!gameStarted && (
        <LoadingScreen
          progress={loadProgress}
          engineReady={engineReady}
          onStartGame={handleStartGame}
        />
      )}

      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Landscape Orientation Lock Guard */}
      <LandscapeGuard
        visible={isPortrait}
        onLockLandscape={() => void lockLandscape(true)}
      />
    </div>
  );
}
