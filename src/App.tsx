import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone, Volume2 } from 'lucide-react';
import {
  VEHICLE_MAP,
  type AgeMode,
  type LanguageMode,
  type MissionSnapshot,
  type MissionVariant,
  type VehicleId,
  type ViewMode,
} from './types/game';
import { soundEngine } from './audio/soundEngine';
import { GameEngine } from './three/GameEngine';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { CelebrationModal } from './components/CelebrationModal';
import { StickerBookModal } from './components/StickerBookModal';
import { SettingsModal } from './components/SettingsModal';
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
  ekskavator: 0,
  pemadam: 0,
  sampah: 0,
  bus: 0,
};

function parseLanguageMode(val: unknown): LanguageMode {
  return val === 'en' ? 'en' : 'id';
}

function loadSavedState(): {
  ageMode: AgeMode;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  languageMode: LanguageMode;
  starsByTruck: Record<VehicleId, number>;
} {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ageMode: 'toddler',
        sfxEnabled: true,
        musicEnabled: true,
        languageMode: 'id',
        starsByTruck: { ...DEFAULT_STARS },
      };
    }
    const parsed = JSON.parse(raw);
    const savedSfx =
      typeof parsed.sfxEnabled === 'boolean'
        ? parsed.sfxEnabled
        : typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : true;
    return {
      ageMode: parsed.ageMode === 'preschool' ? 'preschool' : 'toddler',
      sfxEnabled: savedSfx,
      musicEnabled: typeof parsed.musicEnabled === 'boolean' ? parsed.musicEnabled : true,
      languageMode: parseLanguageMode(parsed.languageMode),
      starsByTruck: { ...DEFAULT_STARS, ...(parsed.starsByTruck || {}) },
    };
  } catch {
    return {
      ageMode: 'toddler',
      sfxEnabled: true,
      musicEnabled: true,
      languageMode: 'id',
      starsByTruck: { ...DEFAULT_STARS },
    };
  }
}

export default function App() {
  const initial = useMemo(() => loadSavedState(), []);
  const [viewMode, setViewMode] = useState<ViewMode>('GARAGE');
  const [selectedTruck, setSelectedTruck] = useState<VehicleId | null>(null);
  const [ageMode, setAgeMode] = useState<AgeMode>(initial.ageMode);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(initial.sfxEnabled);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(initial.musicEnabled);
  const [languageMode, setLanguageMode] = useState<LanguageMode>(initial.languageMode);
  const [starsByTruck, setStarsByTruck] = useState<Record<VehicleId, number>>(initial.starsByTruck);
  const [mission, setMission] = useState<MissionSnapshot | null>(null);
  const [missionVariant, setMissionVariant] = useState<MissionVariant>('classic');
  const [launchingTruck, setLaunchingTruck] = useState<VehicleId | null>(null);
  const [celebratingTruck, setCelebratingTruck] = useState<VehicleId | null>(null);
  const [stickerBookOpen, setStickerBookOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
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
  const missionVariantRef = useRef<MissionVariant>(missionVariant);
  missionVariantRef.current = missionVariant;
  const launchingTruckRef = useRef<VehicleId | null>(launchingTruck);
  launchingTruckRef.current = launchingTruck;

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

  // Persist user preferences & stars and sync audio/language engine
  useEffect(() => {
    soundEngine.setSfxEnabled(sfxEnabled);
    soundEngine.setMusicEnabled(musicEnabled);
    soundEngine.setLanguageMode(languageMode);
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ageMode, sfxEnabled, musicEnabled, languageMode, starsByTruck }),
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [ageMode, sfxEnabled, musicEnabled, languageMode, starsByTruck]);

  // Begin chill-happy theme song on the very first interaction on the start screen (autoplay-policy safe)
  useEffect(() => {
    if (gameStarted || !musicEnabled) return;
    const triggerStartTheme = () => {
      soundEngine.unlock();
      soundEngine.startThemeMusic();
    };
    window.addEventListener('pointerdown', triggerStartTheme, { once: true });
    window.addEventListener('keydown', triggerStartTheme, { once: true });
    return () => {
      window.removeEventListener('pointerdown', triggerStartTheme);
      window.removeEventListener('keydown', triggerStartTheme);
    };
  }, [gameStarted, musicEnabled]);

  const startVehicleMission = useCallback(
    (vehicleId: VehicleId, modeOverride?: AgeMode, variantOverride?: MissionVariant) => {
      soundEngine.unlock();
      const activeAge = modeOverride ?? ageModeRef.current;
      const activeVariant = variantOverride ?? 'classic';
      setLaunchingTruck(null);
      setSelectedTruck(vehicleId);
      setMissionVariant(activeVariant);
      setViewMode('MISSION');
      setCelebratingTruck(null);
      setStickerBookOpen(false);
      setSettingsOpen(false);
      setDockCollapsed(false);
      engineRef.current?.startMission(vehicleId, activeAge, activeVariant);
    },
    [],
  );

  /** Drive the selected truck smoothly out of its storybook garage cottage, then open its mission */
  const launchVehicleFromGarage = useCallback(
    (vehicleId: VehicleId) => {
      if (launchingTruckRef.current) return;
      soundEngine.unlock();
      setLaunchingTruck(vehicleId);
      setCelebratingTruck(null);
      setStickerBookOpen(false);
      setSettingsOpen(false);
      engineRef.current?.launchMissionFromGarage(vehicleId, ageModeRef.current, 'classic');
    },
    [],
  );

  const handleBackToGarage = useCallback(() => {
    soundEngine.unlock();
    soundEngine.playPop();
    setLaunchingTruck(null);
    setViewMode('GARAGE');
    setSelectedTruck(null);
    setMission(null);
    setMissionVariant('classic');
    setCelebratingTruck(null);
    engineRef.current?.enterGarage();
    soundEngine.speakBilingual(
      'Selamat datang di Kota Kendaraan! Pilih rumah truk kesukaanmu!',
      'Welcome to Vehicle Town! Pick your favorite truck house!',
    );
  }, []);

  const handleStartGame = useCallback(() => {
    soundEngine.unlock();
    soundEngine.startThemeMusic();
    soundEngine.playSuccessChime();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    void lockLandscape(isTouchDevice);
    setGameStarted(true);
    soundEngine.speakBilingual(
      'Selamat datang di Kota Kendaraan Ceria! Ketuk tombol Main agar truk keluar dari rumahnya!',
      'Welcome to Vehicle Town! Tap Play to call a truck out of its house!',
    );
  }, [lockLandscape]);

  // Initialize Three.js WebGL Engine ONCE in isolated canvas mount ref
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new GameEngine(mount, {
      onSelectTruckFrom3D: (vid) => {
        launchVehicleFromGarage(vid);
      },
      onMissionStarted: (vid, variant) => {
        setLaunchingTruck(null);
        setSelectedTruck(vid);
        setMissionVariant(variant);
        setViewMode('MISSION');
        setDockCollapsed(false);
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
      soundEngine.stopThemeMusic();
      soundEngine.stopSpeech();
      engine.dispose();
      engineRef.current = null;
    };
  }, [launchVehicleFromGarage]);

  // Global keyboard shortcuts (Escape to close modals, H to collapse HUD)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }
        if (stickerBookOpen) {
          setStickerBookOpen(false);
          return;
        }
      }
      if (!gameStarted) return;
      if ((e.key === 'h' || e.key === 'H') && !stickerBookOpen && !settingsOpen && !celebratingTruck) {
        setDockCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameStarted, stickerBookOpen, settingsOpen, celebratingTruck]);

  const handleChangeAgeMode = (nextMode: AgeMode) => {
    soundEngine.unlock();
    soundEngine.playPop();
    setAgeMode(nextMode);
    soundEngine.speakBilingual(
      nextMode === 'toddler' ? 'Mode Balita dua sampai tiga tahun!' : 'Mode Prasekolah empat sampai enam tahun!',
      nextMode === 'toddler' ? 'Toddler mode!' : 'Preschool mode!',
    );
    if (viewMode === 'MISSION' && selectedTruck) {
      startVehicleMission(selectedTruck, nextMode, missionVariantRef.current);
    }
  };

  const handleChangeMissionVariant = (nextVariant: MissionVariant) => {
    if (!selectedTruck || nextVariant === missionVariant) return;
    soundEngine.unlock();
    soundEngine.playPop();
    startVehicleMission(selectedTruck, ageModeRef.current, nextVariant);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    soundEngine.setSfxEnabled(next);
    if (next) {
      soundEngine.unlock();
      soundEngine.playPop();
    }
  };

  const handleToggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    soundEngine.setMusicEnabled(next);
    if (next) {
      soundEngine.unlock();
      soundEngine.startThemeMusic();
    }
  };

  const handleChangeLanguage = (nextLang: LanguageMode) => {
    const normalized: LanguageMode = nextLang === 'en' ? 'en' : 'id';
    soundEngine.unlock();
    setLanguageMode(normalized);
    soundEngine.setLanguageMode(normalized);
    soundEngine.playPop();
    if (normalized === 'en') {
      soundEngine.speakBilingual('English language active!', 'English language active!');
    } else {
      soundEngine.speakBilingual('Bahasa Indonesia aktif!', 'Indonesian language active!');
    }
  };

  const handleOpenSettings = () => {
    soundEngine.unlock();
    soundEngine.playPop();
    setSettingsOpen(true);
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
  const launchingVehicle = launchingTruck ? VEHICLE_MAP[launchingTruck] : null;

  const garagePromptId = launchingVehicle
    ? `${launchingVehicle.nameId} sedang keluar dari rumahnya menuju misi!`
    : 'Ketuk rumah truk atau tombol Main di bawah agar truk keluar dari rumahnya!';
  const garagePromptEn = launchingVehicle
    ? `${launchingVehicle.nameEn} is driving out of its house for the mission!`
    : 'Tap any truck house or click Play below to send a truck outside!';
  const activePromptId = viewMode === 'GARAGE' ? garagePromptId : mission?.promptId || '';
  const activePromptEn = viewMode === 'GARAGE' ? garagePromptEn : mission?.promptEn || '';
  const primaryPromptText = languageMode === 'en' ? activePromptEn : activePromptId;

  return (
    <div className="relative h-[100dvh] w-screen overflow-hidden bg-[#D9F0FF]">
      {/* Dedicated Isolated WebGL Canvas Container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Dunia 3D Kota Kendaraan Ceria"
      />

      {/* Graceful WebGL Context Fallback */}
      {contextLost && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-[#F3E7D1] p-6 text-center">
          <div className="storybook-paper max-w-sm rounded-2xl p-6">
            <h2 className="font-display text-xl font-extrabold text-[#2D1F14]">
              {languageMode === 'en' ? 'Preparing 3D World...' : 'Menyiapkan Dunia 3D...'}
            </h2>
            <p className="mt-2 text-sm font-medium text-[#5A422D]">
              {languageMode === 'en'
                ? 'The 3D viewport is recovering automatically. Please wait a moment or reload the page.'
                : 'Layar 3D sedang dipulihkan secara otomatis. Silakan tunggu sebentar atau muat ulang halaman.'}
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
              languageMode={languageMode}
              totalStars={totalStars}
              onBackToGarage={handleBackToGarage}
              onChangeAgeMode={handleChangeAgeMode}
              onOpenStickerBook={() => {
                soundEngine.unlock();
                soundEngine.playPop();
                setStickerBookOpen(true);
              }}
              onOpenSettings={handleOpenSettings}
            />

            {/* Compact Storybook Prompt Banner (Sits neatly in sky above 3D trucks) */}
            <div className="compact-prompt-wrap mt-2.5 flex justify-center px-2.5 sm:mt-3 sm:px-3">
              <div className="compact-prompt-card storybook-paper pointer-events-auto flex w-full max-w-[820px] items-center gap-2.5 rounded-2xl px-3 py-2 sm:w-auto sm:gap-3 sm:px-4 sm:py-2.5">
                <button
                  type="button"
                  onClick={handleRepeatVoice}
                  className="btn-tactile flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#0284C7] text-white cursor-pointer"
                  title={languageMode === 'en' ? 'Hear voice again' : 'Dengar suara lagi'}
                  aria-label={languageMode === 'en' ? 'Repeat voice instruction' : 'Dengar suara instruksi lagi'}
                >
                  <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-extrabold text-[#2D1F14] sm:text-base leading-snug line-clamp-2 sm:line-clamp-none">
                    {primaryPromptText}
                  </p>
                </div>

                {viewMode === 'MISSION' && currentVehicle && (
                  <button
                    type="button"
                    onClick={() => handleHonkTruck(currentVehicle.id)}
                    className="btn-tactile flex h-9 sm:h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 sm:px-3.5 text-xs font-extrabold text-white whitespace-nowrap cursor-pointer"
                    style={{ backgroundColor: currentVehicle.accentHex }}
                    aria-label={
                      languageMode === 'en'
                        ? `Honk ${currentVehicle.nameEn}`
                        : `Bunyikan klakson ${currentVehicle.nameId}`
                    }
                  >
                    <Megaphone className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {languageMode === 'en' ? 'Honk' : 'Klakson'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unified Collapsible Bottom Control Dock */}
          <BottomDock
            viewMode={viewMode}
            ageMode={ageMode}
            languageMode={languageMode}
            missionVariant={missionVariant}
            launchingTruck={launchingTruck}
            collapsed={dockCollapsed}
            modalOpen={Boolean(celebratingTruck) || stickerBookOpen || settingsOpen}
            starsByTruck={starsByTruck}
            mission={mission}
            onToggleCollapse={() => setDockCollapsed((c) => !c)}
            onSelectTruck={(id) => launchVehicleFromGarage(id)}
            onChangeMissionVariant={handleChangeMissionVariant}
            onHonkTruck={handleHonkTruck}
            onDispatchAction={(action, payload) => {
              soundEngine.unlock();
              engineRef.current?.dispatchMissionAction(action, payload);
            }}
          />

          {/* Star Celebration Modal (with Next Truck & Bonus Mission shortcuts) */}
          {celebratingTruck && (
            <CelebrationModal
              vehicleId={celebratingTruck}
              missionVariant={missionVariant}
              languageMode={languageMode}
              onPlayAgain={() => startVehicleMission(celebratingTruck, undefined, missionVariant)}
              onTryBonusMission={() => startVehicleMission(celebratingTruck, undefined, 'bonus')}
              onNextTruck={(nextId) => startVehicleMission(nextId)}
              onBackToGarage={handleBackToGarage}
            />
          )}

          {/* Trophy & Sticker Book Modal */}
          {stickerBookOpen && (
            <StickerBookModal
              starsByTruck={starsByTruck}
              languageMode={languageMode}
              onClose={() => {
                soundEngine.playPop();
                setStickerBookOpen(false);
              }}
              onPlayTruck={(id) =>
                viewMode === 'GARAGE' ? launchVehicleFromGarage(id) : startVehicleMission(id)
              }
              onHonkTruck={handleHonkTruck}
            />
          )}
        </>
      )}

      {/* Pre-Game Loading Screen */}
      {!gameStarted && (
        <LoadingScreen
          progress={loadProgress}
          engineReady={engineReady}
          languageMode={languageMode}
          onStartGame={handleStartGame}
        />
      )}

      {/* Settings Modal (Music, Sound FX, Language — accessible from Start Screen & TopBar) */}
      {settingsOpen && (
        <SettingsModal
          musicEnabled={musicEnabled}
          sfxEnabled={sfxEnabled}
          languageMode={languageMode}
          onToggleMusic={handleToggleMusic}
          onToggleSfx={handleToggleSfx}
          onChangeLanguage={handleChangeLanguage}
          onClose={() => {
            soundEngine.playPop();
            setSettingsOpen(false);
          }}
        />
      )}

      {/* Offline Status Banner */}
      <OfflineIndicator languageMode={languageMode} />

      {/* Landscape Orientation Lock Guard */}
      <LandscapeGuard
        visible={isPortrait}
        languageMode={languageMode}
        onLockLandscape={() => void lockLandscape(true)}
      />
    </div>
  );
}
