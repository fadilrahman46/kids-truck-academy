import { useCallback, useEffect, useRef } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Flower2,
  Hand,
  Leaf,
  Minus,
  PaintBucket,
  Play,
  Plus,
  Recycle,
  RotateCw,
  Shovel,
  Sparkles,
  Star,
  Volume2,
} from 'lucide-react';
import {
  ALL_COLORS,
  BUS_RIDER_COLOR_MAP,
  CARGO_OPTIONS,
  MISSION_VARIANT_META,
  MOLEN_BLUEPRINTS,
  NUMBER_WORDS,
  PRIMARY_COLORS,
  SHAPE_MAP,
  SHAPE_OPTIONS,
  VEHICLES,
  hasBonusMission,
  mixTwoColors,
  pickLang,
  type AgeMode,
  type LanguageMode,
  type MissionSnapshot,
  type MissionVariant,
  type VehicleId,
  type ViewMode,
} from '../types/game';
import {
  BlueprintPictogram,
  CargoPictogram,
  LetterPictogram,
  ShapePictogram,
  TrafficLightPictogram,
  WastePictogram,
} from './Pictograms';
import { TruckIllustration } from './TruckIllustration';

interface BottomDockProps {
  viewMode: ViewMode;
  ageMode: AgeMode;
  languageMode: LanguageMode;
  missionVariant: MissionVariant;
  launchingTruck?: VehicleId | null;
  collapsed: boolean;
  modalOpen?: boolean;
  starsByTruck: Record<VehicleId, number>;
  mission: MissionSnapshot | null;
  onToggleCollapse: () => void;
  onSelectTruck: (id: VehicleId) => void;
  onChangeMissionVariant: (nextVariant: MissionVariant) => void;
  onHonkTruck: (id: VehicleId) => void;
  onDispatchAction: (action: string, payload?: unknown) => void;
}

export function BottomDock({
  viewMode,
  ageMode,
  languageMode,
  missionVariant,
  launchingTruck = null,
  collapsed,
  modalOpen = false,
  starsByTruck,
  mission,
  onToggleCollapse,
  onSelectTruck,
  onChangeMissionVariant,
  onHonkTruck,
  onDispatchAction,
}: BottomDockProps) {
  return (
    <div className="compact-dock-wrap pointer-events-none fixed inset-x-0 bottom-2 sm:bottom-3 z-20 flex flex-col items-center pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:pl-[max(0.75rem,env(safe-area-inset-left))] sm:pr-[max(0.75rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)]">
      {/* Collapse / Expand Wooden Tab (Zen Mode for inspecting 3D scene) */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className={`storybook-wood-tab pointer-events-auto flex items-center gap-1.5 px-3.5 sm:px-4 py-1 text-xs font-extrabold transition-transform active:scale-95 whitespace-nowrap cursor-pointer ${
          collapsed
            ? 'mb-0 rounded-xl border-b-[2px] border-b-[#7A4B21]'
            : '-mb-[2px] rounded-t-xl'
        }`}
      >
        {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span>
          {collapsed
            ? languageMode === 'en'
              ? 'Show Controls'
              : 'Tampilkan Kontrol'
            : languageMode === 'en'
              ? 'Hide Controls'
              : 'Sembunyikan Kontrol'}
        </span>
      </button>

      {/* Main Storybook Paper Dock Container */}
      <div
        className={`compact-dock-card storybook-paper pointer-events-auto w-full rounded-2xl p-2 sm:p-3 transition-transform duration-200 ${
          viewMode === 'GARAGE' ? 'max-w-[1080px]' : 'max-w-[960px]'
        } ${
          collapsed ? 'translate-y-[125%] opacity-0 pointer-events-none hidden' : 'translate-y-0 opacity-100'
        }`}
      >
        {viewMode === 'GARAGE' ? (
          <div className="compact-garage-grid grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {VEHICLES.map((v) => {
              const stars = starsByTruck[v.id] || 0;
              const isThisLaunching = launchingTruck === v.id;
              const isAnyLaunching = launchingTruck !== null;
              const truckName = languageMode === 'en' ? v.nameEn : v.nameId;
              const subtitle =
                languageMode === 'bilingual'
                  ? `${v.topicId} · ${v.topicEn}`
                  : languageMode === 'en'
                    ? v.topicEn
                    : v.topicId;
              return (
                <div
                  key={v.id}
                  className={`compact-garage-card storybook-card flex flex-col justify-between rounded-xl p-1.5 transition-transform shrink-0 ${
                    isThisLaunching
                      ? 'ring-2 ring-[#D97706] -translate-y-0.5'
                      : isAnyLaunching
                        ? 'opacity-65'
                        : 'hover:-translate-y-0.5'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isAnyLaunching}
                    onClick={() => onSelectTruck(v.id)}
                    className="group flex flex-col items-start text-left cursor-pointer disabled:cursor-default min-w-0"
                  >
                    <div className="relative w-full">
                      <TruckIllustration
                        vehicleId={v.id}
                        className="compact-garage-thumb h-14 w-full border border-[#E5CFA9] sm:h-16"
                      />
                      <span className="absolute top-1 right-1 flex items-center gap-0.5 rounded-md border border-[#DFC398] bg-[#FFFDF8]/95 px-1 py-0.5 text-[10px] font-extrabold text-[#4A2E14] shadow-xs tabular-nums">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-600" />
                        {stars}
                      </span>
                    </div>
                    <span className="font-display mt-1.5 w-full truncate text-xs font-extrabold text-[#2D1F14] leading-tight">
                      {truckName}
                    </span>
                    <span className="w-full truncate text-[10px] font-semibold text-[#68503B] leading-tight">
                      {subtitle}
                    </span>
                  </button>

                  <div className="mt-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isAnyLaunching}
                      onClick={() => onSelectTruck(v.id)}
                      className="btn-tactile flex-1 rounded-lg px-1.5 py-1 text-[11px] font-extrabold text-white whitespace-nowrap cursor-pointer disabled:opacity-80"
                      style={{ backgroundColor: v.accentHex }}
                    >
                      {isThisLaunching
                        ? languageMode === 'en'
                          ? 'Go!'
                          : 'Keluar!'
                        : languageMode === 'en'
                          ? 'Play'
                          : 'Main'}
                    </button>
                    <button
                      type="button"
                      disabled={isAnyLaunching}
                      onClick={() => onHonkTruck(v.id)}
                      className="btn-wood-secondary flex h-7 w-7 items-center justify-center rounded-lg shrink-0 cursor-pointer disabled:opacity-50"
                      title={languageMode === 'en' ? `Honk ${v.nameEn}` : `Bunyikan klakson ${v.nameId}`}
                      aria-label={languageMode === 'en' ? `Honk ${v.nameEn}` : `Klakson ${v.nameId}`}
                    >
                      <Volume2 className="h-3.5 w-3.5 text-[#5A3A1E]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          mission && (
            <MissionControls
              ageMode={ageMode}
              languageMode={languageMode}
              missionVariant={missionVariant}
              mission={mission}
              modalOpen={modalOpen}
              onChangeMissionVariant={onChangeMissionVariant}
              onDispatchAction={onDispatchAction}
            />
          )
        )}
      </div>
    </div>
  );
}

interface MissionControlsProps {
  ageMode: AgeMode;
  languageMode: LanguageMode;
  missionVariant: MissionVariant;
  mission: MissionSnapshot;
  modalOpen: boolean;
  onChangeMissionVariant: (nextVariant: MissionVariant) => void;
  onDispatchAction: (action: string, payload?: unknown) => void;
}

const HINT_CLASS = 'ring-4 ring-amber-400 ring-offset-2 ring-offset-[#FDF8EE] scale-[1.04] shadow-md';

function CraneBalanceControls({
  languageMode,
  mission,
  modalOpen,
  onDispatchAction,
}: {
  languageMode: LanguageMode;
  mission: MissionSnapshot;
  modalOpen: boolean;
  onDispatchAction: (action: string, payload?: unknown) => void;
}) {
  const holdDelayRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  const stopHold = useCallback(() => {
    if (holdDelayRef.current !== null) {
      window.clearTimeout(holdDelayRef.current);
      holdDelayRef.current = null;
    }
    if (holdIntervalRef.current !== null) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (dir: -1 | 1) => {
      if (mission.phase !== 'BALANCE') return;
      stopHold();
      // Immediate responsive single step
      onDispatchAction('CRANE_MOVE', { dir, step: 0.16 });
      // Smooth continuous glide while held down
      holdDelayRef.current = window.setTimeout(() => {
        holdIntervalRef.current = window.setInterval(() => {
          onDispatchAction('CRANE_MOVE', { dir, step: 0.1 });
        }, 85);
      }, 170);
    },
    [mission.phase, onDispatchAction, stopHold],
  );

  // Stop hold automatically when leaving BALANCE phase or unmounting
  useEffect(() => {
    if (mission.phase !== 'BALANCE') {
      stopHold();
    }
    return () => stopHold();
  }, [mission.phase, stopHold]);

  // Keyboard arrow / spacebar support alongside tactile press-and-hold (single authoritative handler)
  useEffect(() => {
    if (mission.phase !== 'BALANCE' || modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onDispatchAction('CRANE_MOVE', { dir: -1, step: 0.14 });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onDispatchAction('CRANE_MOVE', { dir: 1, step: 0.14 });
      } else if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onDispatchAction('CRANE_DROP');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mission.phase, modalOpen, onDispatchAction]);

  const offset = mission.craneBoomOffset ?? 0;
  const tol = mission.craneTolerance ?? 0.3;
  const isBalanced = Math.abs(offset) <= tol;
  const markerPct = ((offset + 1) / 2) * 100;
  const zoneWidthPct = tol * 100;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Live Balance Alignment Bar */}
      <div className="flex flex-1 min-w-[210px] flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className={isBalanced ? 'text-emerald-800' : 'text-[#9A5212]'}>
            {isBalanced
              ? pickLang(languageMode, 'Seimbang!', 'Balanced!')
              : pickLang(languageMode, 'Tahan Kiri/Kanan', 'Hold Left/Right')}
          </span>
          <span className="text-[#5A422D] tabular-nums">
            {languageMode === 'en' ? 'Load' : 'Muatan'} {mission.craneDroppedCount || 0}/{mission.craneTotalDrops || 1}
          </span>
        </div>
        <div className="storybook-wood-tray relative h-5 w-full overflow-hidden rounded-full">
          <div
            className="absolute top-0 bottom-0 bg-emerald-400/80"
            style={{
              left: `${50 - zoneWidthPct / 2}%`,
              width: `${zoneWidthPct}%`,
            }}
          />
          <div
            className={`absolute top-0.5 bottom-0.5 w-4 -ml-2 rounded-full border-2 border-[#FFFDF8] shadow transition-all duration-100 ${
              isBalanced ? 'bg-emerald-700' : 'bg-[#C96B18]'
            }`}
            style={{ left: `${Math.min(96, Math.max(4, markerPct))}%` }}
          />
        </div>
      </div>

      {/* Tactile Press-and-Hold Crane Controls */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          disabled={mission.phase !== 'BALANCE'}
          onPointerDown={(e) => {
            e.preventDefault();
            startHold(-1);
          }}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className={`btn-tactile flex min-h-[58px] select-none touch-none items-center gap-1.5 rounded-xl bg-[#4E331B] px-4 text-sm font-extrabold text-[#FFFDF8] disabled:opacity-40 cursor-pointer ${
            mission.hintKey === 'craneMove:-1' ? HINT_CLASS : ''
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{languageMode === 'en' ? 'Left' : 'Kiri'}</span>
        </button>

        <button
          type="button"
          disabled={mission.phase !== 'BALANCE'}
          onClick={() => onDispatchAction('CRANE_DROP')}
          className={`btn-tactile flex min-h-[58px] items-center gap-1.5 rounded-xl px-5 text-base font-extrabold text-white disabled:opacity-40 whitespace-nowrap cursor-pointer ${
            isBalanced ? 'bg-emerald-600' : 'bg-[#D97706]'
          } ${mission.hintKey === 'craneDrop' ? HINT_CLASS : ''}`}
        >
          <ArrowDown className="h-5 w-5" />
          <span>{pickLang(languageMode, 'Turunkan!', 'Drop!')}</span>
        </button>

        <button
          type="button"
          disabled={mission.phase !== 'BALANCE'}
          onPointerDown={(e) => {
            e.preventDefault();
            startHold(1);
          }}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className={`btn-tactile flex min-h-[58px] select-none touch-none items-center gap-1.5 rounded-xl bg-[#4E331B] px-4 text-sm font-extrabold text-[#FFFDF8] disabled:opacity-40 cursor-pointer ${
            mission.hintKey === 'craneMove:1' ? HINT_CLASS : ''
          }`}
        >
          <span>{languageMode === 'en' ? 'Right' : 'Kanan'}</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function canSwitchMissionVariant(mission: MissionSnapshot): boolean {
  if (!hasBonusMission(mission.vehicleId)) return false;
  switch (mission.vehicleId) {
    case 'molen':
      return mission.phase === 'PICK' && (mission.molenBonusStage ?? 1) === 1;
    case 'angkut':
      return mission.phase === 'LOAD';
    case 'tangki':
      return mission.phase === 'PUZZLE';
    case 'crane':
      return mission.phase === 'COUNT';
    case 'pemadam':
      return mission.phase === 'LETTER';
    case 'sampah':
      return mission.phase === 'SORT';
    default:
      return false;
  }
}

function MissionVariantSwitcher({
  vehicleId,
  languageMode,
  missionVariant,
  onChangeMissionVariant,
}: {
  vehicleId: VehicleId;
  languageMode: LanguageMode;
  missionVariant: MissionVariant;
  onChangeMissionVariant: (nextVariant: MissionVariant) => void;
}) {
  const meta = MISSION_VARIANT_META[vehicleId];
  if (!meta) return null;

  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#E6D2B2] pb-2">
      <span className="text-[11px] font-extrabold tracking-wide text-[#68503B] uppercase">
        {languageMode === 'en' ? 'Choose Mission' : 'Pilih Misi'}
      </span>
      <div className="storybook-wood-tray flex items-center gap-1 rounded-xl p-1">
        <button
          type="button"
          onClick={() => onChangeMissionVariant('classic')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            missionVariant === 'classic'
              ? 'bg-[#FFFDF8] text-[#2D1F14] shadow-xs ring-1 ring-[#CFA772]'
              : 'text-[#68503B] hover:text-[#2D1F14]'
          }`}
        >
          <span>
            {languageMode === 'en' ? `1: ${meta.classicEn}` : `Misi 1: ${meta.classicId}`}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChangeMissionVariant('bonus')}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
            missionVariant === 'bonus'
              ? 'bg-[#D97706] text-white shadow-xs'
              : 'text-[#68503B] hover:text-[#2D1F14]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>
            {languageMode === 'en' ? `2: ${meta.bonusEn}` : `Misi 2: ${meta.bonusId}`}
          </span>
        </button>
      </div>
    </div>
  );
}

function BusTrafficControls({
  languageMode,
  mission,
  onDispatchAction,
}: {
  languageMode: LanguageMode;
  mission: MissionSnapshot;
  onDispatchAction: (action: string, payload?: unknown) => void;
}) {
  const holdingRef = useRef(false);
  const light = mission.trafficLight || 'red';
  const progressPct = Math.round((mission.busProgress || 0) * 100);

  const releaseGo = () => {
    if (holdingRef.current) {
      holdingRef.current = false;
      onDispatchAction('BUS_STOP');
    }
  };

  useEffect(() => {
    return () => {
      if (holdingRef.current) {
        holdingRef.current = false;
        onDispatchAction('BUS_STOP');
      }
    };
  }, [onDispatchAction]);

  const lightText =
    light === 'green'
      ? pickLang(languageMode, 'Lampu Hijau: Ayo Jalan!', 'Green Light: Go!')
      : light === 'yellow'
        ? pickLang(languageMode, 'Lampu Kuning: Hati-hati!', 'Yellow Light: Ready!')
        : pickLang(languageMode, 'Lampu Merah: Berhenti!', 'Red Light: Stop!');

  return (
    <div
      key={mission.wrongFeedbackKey}
      className={`flex flex-wrap items-center justify-between gap-3 ${
        mission.wrongFeedbackKey ? 'animate-wiggle' : ''
      }`}
    >
      {/* Live Traffic Light Pictogram + Road Progress */}
      <div className="flex flex-1 min-w-[210px] items-center gap-3">
        <TrafficLightPictogram state={light} className="h-14 w-9 shrink-0" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
            <span
              className={
                light === 'green'
                  ? 'text-emerald-800'
                  : light === 'yellow'
                    ? 'text-[#B45309]'
                    : 'text-[#B91C1C]'
              }
            >
              {lightText}
            </span>
            <span className="text-[#5A422D] tabular-nums">{progressPct}%</span>
          </div>
          <div className="storybook-wood-tray h-4 w-full overflow-hidden rounded-full">
            <div
              className="h-full bg-[#CA8A04] transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tactile Go & Stop Pedals */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            holdingRef.current = true;
            onDispatchAction('BUS_GO');
          }}
          onPointerUp={releaseGo}
          onPointerLeave={releaseGo}
          onPointerCancel={releaseGo}
          className={`btn-tactile flex min-h-[58px] select-none touch-none items-center gap-2 rounded-xl px-5 text-base font-extrabold text-white whitespace-nowrap cursor-pointer ${
            light === 'green' ? 'bg-emerald-600' : 'bg-[#6B7280]'
          } ${mission.hintKey === 'bus:go' ? HINT_CLASS : ''}`}
        >
          <Play className="h-5 w-5 fill-current" />
          <span>{pickLang(languageMode, 'Jalan!', 'Go!')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            holdingRef.current = false;
            onDispatchAction('BUS_STOP');
          }}
          className="btn-tactile flex min-h-[58px] items-center gap-2 rounded-xl bg-[#DC2626] px-4 text-sm font-extrabold text-white whitespace-nowrap cursor-pointer"
        >
          <Hand className="h-5 w-5" />
          <span>{pickLang(languageMode, 'Berhenti', 'Stop')}</span>
        </button>
      </div>
    </div>
  );
}

function MissionControls({
  ageMode,
  languageMode,
  missionVariant,
  mission,
  modalOpen,
  onChangeMissionVariant,
  onDispatchAction,
}: MissionControlsProps) {
  const hintRing = (key: string) => (mission.hintKey === key ? HINT_CLASS : '');
  const showVariantSwitcher = canSwitchMissionVariant(mission);
  const variantBar = showVariantSwitcher ? (
    <MissionVariantSwitcher
      vehicleId={mission.vehicleId}
      languageMode={languageMode}
      missionVariant={missionVariant}
      onChangeMissionVariant={onChangeMissionVariant}
    />
  ) : null;

  // 1. TRUK MOLEN CONTROLS
  if (mission.vehicleId === 'molen') {
    const selected = mission.selectedColors || [];
    const maxPicks = ageMode === 'toddler' ? 1 : 2;
    const ready = selected.length === maxPicks;
    const activeBlueprint = mission.molenBlueprint || 'house';
    const isBonusWindmill = mission.missionVariant === 'bonus';
    const bonusStage = mission.molenBonusStage ?? 1;
    const previewColor =
      selected.length === 1
        ? ALL_COLORS[selected[0]]
        : selected.length === 2
          ? mixTwoColors(selected[0], selected[1])
          : null;

    return (
      <div className="flex flex-col gap-2">
        {variantBar}

        {/* Structure Blueprint Picker (Classic: Rumah/Menara/Jembatan, Bonus: Kincir Taman 2-Step) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {isBonusWindmill ? (
            <div className="storybook-card flex items-center gap-2.5 rounded-xl px-3 py-1.5">
              <BlueprintPictogram type="windmill" className="h-8 w-8 shrink-0" />
              <div className="leading-tight">
                <div className="font-display text-xs font-extrabold text-[#2D1F14]">
                  {pickLang(languageMode, 'Kincir Taman', 'Garden Windmill')}
                </div>
                <div className="text-[11px] font-bold text-[#9A5814]">
                  {bonusStage === 1
                    ? pickLang(languageMode, 'Langkah 1/2: Menara', 'Step 1/2: Tower')
                    : pickLang(languageMode, 'Langkah 2/2: Baling-Baling', 'Step 2/2: Blades')}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {MOLEN_BLUEPRINTS.map((bp) => {
                const active = activeBlueprint === bp.id;
                return (
                  <button
                    key={bp.id}
                    type="button"
                    disabled={mission.phase !== 'PICK'}
                    onClick={() => onDispatchAction('SELECT_BLUEPRINT', bp.id)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-left transition-transform active:scale-95 disabled:opacity-50 cursor-pointer ${
                      active
                        ? 'border-[#C87D20] bg-[#FEF4DC] text-[#3B2208] shadow-xs'
                        : 'border-[#DFC398] bg-[#FFFDF8] text-[#4E3824] hover:bg-[#FAF1E0]'
                    }`}
                  >
                    <BlueprintPictogram type={bp.id} className="h-7 w-7 shrink-0" />
                    <span className="font-display text-xs font-extrabold whitespace-nowrap">
                      {languageMode === 'en' ? bp.nameEn : bp.nameId}
                      {languageMode === 'bilingual' && (
                        <span className="ml-1 font-sans font-semibold text-[#68503B]">/ {bp.nameEn}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selected.length > 0 && previewColor && (
            <div className="storybook-card flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-extrabold text-[#2D1F14]">
              <span
                className="h-5 w-5 rounded-md border border-[#A58458] shrink-0"
                style={{ backgroundColor: previewColor.hex }}
              />
              <span>
                {selected
                  .map((id) => (languageMode === 'en' ? ALL_COLORS[id].nameEn : ALL_COLORS[id].nameId))
                  .join(' + ')}
                {selected.length === 2
                  ? ` = ${languageMode === 'en' ? previewColor.nameEn : previewColor.nameId}`
                  : ''}
              </span>
            </div>
          )}
        </div>

        {/* Color Paint Pickers + Spin Action */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {PRIMARY_COLORS.map((c) => {
              const countPicked = selected.filter((s) => s === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={mission.phase !== 'PICK'}
                  onClick={() => onDispatchAction('PICK_COLOR', c.id)}
                  className={`btn-tactile flex min-h-[52px] items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-left font-bold disabled:opacity-50 cursor-pointer ${hintRing(`color:${c.id}`)}`}
                  style={{
                    backgroundColor: c.hex,
                    borderColor: countPicked > 0 ? '#2D1F14' : 'rgba(74, 46, 18, 0.2)',
                    color: c.id === 'yellow' ? '#2D1F14' : '#FFFFFF',
                  }}
                >
                  <PaintBucket className="h-5 w-5 shrink-0 opacity-90" />
                  <span className="font-display text-base font-extrabold">
                    {languageMode === 'en' ? c.nameEn : c.nameId}
                  </span>
                  {languageMode === 'bilingual' && (
                    <span className="text-xs opacity-90">/ {c.nameEn}</span>
                  )}
                  {countPicked > 0 && (
                    <span className="ml-1 rounded-md bg-black/20 px-1.5 py-0.5 text-xs tabular-nums">
                      ×{countPicked}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {mission.phase === 'PICK' && selected.length > 0 && (
              <button
                type="button"
                onClick={() => onDispatchAction('CLEAR_COLORS')}
                className="btn-wood-secondary min-h-[52px] rounded-xl px-3.5 text-sm font-extrabold cursor-pointer"
              >
                {languageMode === 'en' ? 'Reset' : 'Ulang'}
              </button>
            )}

            <button
              type="button"
              disabled={!ready || mission.phase !== 'PICK'}
              onClick={() => onDispatchAction('SPIN_MIXER')}
              className={`btn-tactile flex min-h-[52px] items-center gap-2 rounded-xl bg-[#D97706] px-5 text-base font-extrabold text-white disabled:bg-[#DFCFAF] disabled:text-[#8A735A] whitespace-nowrap cursor-pointer ${hintRing('spin')}`}
            >
              <RotateCw className="h-5 w-5" />
              <span>{pickLang(languageMode, 'Putar Molen!', 'Spin Mixer!')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. TRUK ANGKUT CONTROLS
  if (mission.vehicleId === 'angkut') {
    const isBonusMix = mission.missionVariant === 'bonus';
    if (mission.phase === 'LOAD') {
      const primaryType = mission.cargoType || 'apple';
      const secondaryType = mission.secondaryCargoType || 'wood';
      const primaryCount = isBonusMix ? (mission.primaryCargoCount ?? 2) : (mission.loadedCount ?? 2);
      const secondaryCount = mission.secondaryCargoCount ?? 1;

      return (
        <div>
          {variantBar}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {isBonusMix ? (
              <div className="flex flex-wrap items-center gap-2">
                {/* Primary Harvest Cargo Stepper */}
                <div className="storybook-wood-tray flex items-center gap-1.5 rounded-xl p-1.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6D1AE] bg-[#FDF8EE]">
                    <CargoPictogram type={primaryType} className="h-7 w-7" />
                  </span>
                  <button
                    type="button"
                    onClick={() => onDispatchAction('CHANGE_AMOUNT', -1)}
                    className="btn-wood-secondary flex h-10 w-10 items-center justify-center rounded-lg cursor-pointer"
                    aria-label={languageMode === 'en' ? 'Remove first cargo' : 'Kurangi barang pertama'}
                  >
                    <Minus className="h-4 w-4 text-[#2D1F14]" />
                  </button>
                  <span className="font-display w-8 text-center text-xl font-extrabold text-[#2D1F14] tabular-nums">
                    {primaryCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDispatchAction('CHANGE_AMOUNT', 1)}
                    className="btn-tactile flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB] text-white cursor-pointer"
                    aria-label={languageMode === 'en' ? 'Add first cargo' : 'Tambah barang pertama'}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <span className="font-display text-lg font-extrabold text-[#68503B]">+</span>

                {/* Secondary Harvest Cargo Stepper */}
                <div className="storybook-wood-tray flex items-center gap-1.5 rounded-xl p-1.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6D1AE] bg-[#FDF8EE]">
                    <CargoPictogram type={secondaryType} className="h-7 w-7" />
                  </span>
                  <button
                    type="button"
                    onClick={() => onDispatchAction('CHANGE_SECONDARY_AMOUNT', -1)}
                    className="btn-wood-secondary flex h-10 w-10 items-center justify-center rounded-lg cursor-pointer"
                    aria-label={languageMode === 'en' ? 'Remove second cargo' : 'Kurangi barang kedua'}
                  >
                    <Minus className="h-4 w-4 text-[#2D1F14]" />
                  </button>
                  <span className="font-display w-8 text-center text-xl font-extrabold text-[#2D1F14] tabular-nums">
                    {secondaryCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDispatchAction('CHANGE_SECONDARY_AMOUNT', 1)}
                    className="btn-tactile flex h-10 w-10 items-center justify-center rounded-lg bg-[#D97706] text-white cursor-pointer"
                    aria-label={languageMode === 'en' ? 'Add second cargo' : 'Tambah barang kedua'}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <span className="font-display px-1 text-lg font-extrabold text-[#2D1F14] tabular-nums">
                  = {mission.loadedCount}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {CARGO_OPTIONS.map((c) => {
                  const active = mission.cargoType === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onDispatchAction('SELECT_CARGO', c.id)}
                      className={`flex min-h-[54px] items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left transition-transform active:scale-95 cursor-pointer ${
                        active
                          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1E3A8A] shadow-xs'
                          : 'border-[#DFC398] bg-[#FFFDF8] text-[#2D1F14] hover:bg-[#FAF1E0]'
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E6D1AE] bg-[#FDF8EE]">
                        <CargoPictogram type={c.id} className="h-8 w-8" />
                      </span>
                      <div>
                        <div className="font-display text-sm font-extrabold leading-tight">
                          {languageMode === 'en' ? c.nameEn : c.nameId}
                        </div>
                        {languageMode === 'bilingual' && (
                          <div className="text-xs font-semibold text-[#68503B] leading-tight">{c.nameEn}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2.5">
              {!isBonusMix && (
                <div className="storybook-wood-tray flex items-center gap-2 rounded-xl p-1.5">
                  <button
                    type="button"
                    onClick={() => onDispatchAction('CHANGE_AMOUNT', -1)}
                    className="btn-wood-secondary flex h-11 w-11 items-center justify-center rounded-lg cursor-pointer"
                    aria-label={languageMode === 'en' ? 'Remove cargo' : 'Kurangi barang'}
                  >
                    <Minus className="h-5 w-5 text-[#2D1F14]" />
                  </button>
                  <span className="font-display w-10 text-center text-2xl font-extrabold text-[#2D1F14] tabular-nums">
                    {mission.loadedCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDispatchAction('CHANGE_AMOUNT', 1)}
                    className="btn-tactile flex h-11 w-11 items-center justify-center rounded-lg bg-[#2563EB] text-white cursor-pointer"
                    aria-label={languageMode === 'en' ? 'Add cargo' : 'Tambah barang'}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => onDispatchAction('START_COUNT')}
                className={`btn-tactile min-h-[56px] rounded-xl bg-emerald-600 px-5 text-base font-extrabold text-white whitespace-nowrap cursor-pointer ${hintRing('start_count')}`}
              >
                {pickLang(languageMode, 'Ayo Hitung!', 'Count Now!')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (mission.phase === 'COUNT') {
      return (
        <div
          key={mission.wrongFeedbackKey}
          className={`flex flex-wrap items-center justify-center gap-3 ${
            mission.wrongFeedbackKey ? 'animate-wiggle' : ''
          }`}
        >
          {(mission.numberChoices || []).map((n) => {
            const nw = NUMBER_WORDS[n];
            return (
              <button
                key={n}
                type="button"
                onClick={() => onDispatchAction('ANSWER_COUNT', n)}
                className={`btn-tactile flex min-h-[64px] min-w-[120px] flex-col items-center justify-center rounded-2xl bg-[#2563EB] px-5 py-2 text-white cursor-pointer ${hintRing(`count:${n}`)}`}
              >
                <span className="font-display text-2xl font-extrabold tabular-nums leading-none">
                  {n}
                </span>
                <span className="mt-1 text-xs font-bold opacity-95">
                  {pickLang(languageMode, nw.id, nw.en)}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="py-2 text-center font-display text-lg font-extrabold text-[#1D4ED8]">
        {pickLang(
          languageMode,
          'Truk Angkut sedang melaju mengantar barang!',
          'Cargo Truck is driving to deliver!',
        )}
      </div>
    );
  }

  // 3. TRUK TANGKI CONTROLS
  if (mission.vehicleId === 'tangki') {
    const isGarden = mission.missionVariant === 'bonus';
    const pct = Math.round((mission.tankFill || 0) * 100);
    return (
      <div>
        {variantBar}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(mission.pipes || []).map((p) => (
              <button
                key={p.index}
                type="button"
                disabled={mission.phase !== 'PUZZLE'}
                onClick={() => onDispatchAction('ROTATE_PIPE', p.index)}
                className={`flex min-h-[54px] items-center gap-2 rounded-xl border-2 px-3.5 text-sm font-extrabold disabled:opacity-50 cursor-pointer ${
                  p.connected
                    ? 'btn-tactile border-[#0284C7] bg-[#E0F2FE] text-[#0C4A6E]'
                    : 'btn-wood-secondary text-[#2D1F14]'
                } ${hintRing(`pipe:${p.index}`)}`}
              >
                <RotateCw className="h-4 w-4" />
                <span>
                  {languageMode === 'en' ? `Pipe ${p.index + 1}` : `Pipa ${p.index + 1}`}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 text-sm font-extrabold tabular-nums ${
                isGarden ? 'text-emerald-800' : 'text-[#0369A1]'
              }`}
            >
              {isGarden ? (
                <Flower2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Droplets className="h-5 w-5 text-sky-600" />
              )}
              <span>
                {isGarden
                  ? languageMode === 'en'
                    ? 'Garden'
                    : 'Taman'
                  : languageMode === 'en'
                    ? 'Tank'
                    : 'Tangki'}
                : {pct}%
              </span>
            </div>
            <div className="storybook-wood-tray h-4 w-36 overflow-hidden rounded-full">
              <div
                className={`h-full transition-all duration-150 ${
                  isGarden ? 'bg-emerald-500' : 'bg-sky-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. TRUK CRANE CONTROLS
  if (mission.vehicleId === 'crane') {
    if (mission.phase === 'COUNT') {
      return (
        <div>
          {variantBar}
          <div
            key={mission.wrongFeedbackKey}
            className={`flex flex-wrap items-center justify-center gap-3 ${
              mission.wrongFeedbackKey ? 'animate-wiggle' : ''
            }`}
          >
            {(mission.craneCountChoices || []).map((n) => {
              const nw = NUMBER_WORDS[n];
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onDispatchAction('CRANE_COUNT', n)}
                  className={`btn-tactile flex min-h-[64px] min-w-[120px] flex-col items-center justify-center rounded-2xl bg-[#D97706] px-5 py-2 text-white cursor-pointer ${hintRing(`craneCount:${n}`)}`}
                >
                  <span className="font-display text-2xl font-extrabold tabular-nums leading-none">
                    {n}
                  </span>
                  <span className="mt-1 text-xs font-bold opacity-95">
                    {pickLang(languageMode, nw.id, nw.en)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <CraneBalanceControls
        languageMode={languageMode}
        mission={mission}
        modalOpen={modalOpen}
        onDispatchAction={onDispatchAction}
      />
    );
  }

  // 5. TRUK PEMADAM CONTROLS
  if (mission.vehicleId === 'pemadam') {
    if (mission.phase === 'LETTER') {
      return (
        <div>
          {variantBar}
          <div
            key={mission.wrongFeedbackKey}
            className={`flex flex-wrap items-center justify-center gap-3 ${
              mission.wrongFeedbackKey ? 'animate-wiggle' : ''
            }`}
          >
            {(mission.letterChoices || []).map((entry) => (
              <button
                key={entry.letter}
                type="button"
                onClick={() => onDispatchAction('PICK_LETTER', entry.letter)}
                className={`btn-tactile flex min-h-[66px] min-w-[144px] items-center gap-3 rounded-2xl bg-[#DC2626] px-4 py-2 text-left text-white cursor-pointer ${hintRing(`letter:${entry.letter}`)}`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#F5D3B3] bg-[#FDF8EE]">
                  <LetterPictogram letter={entry.letter} className="h-8 w-8" />
                </span>
                <span className="flex flex-col">
                  <span className="font-display text-3xl font-extrabold leading-none">
                    {entry.letter}
                  </span>
                  <span className="mt-1 text-xs font-bold opacity-95 whitespace-nowrap">
                    {pickLang(languageMode, entry.wordId, entry.wordEn)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (mission.phase === 'SPRAY') {
      const rem = mission.flamesRemaining || [];
      return (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold text-[#4A321F]">
            {pickLang(
              languageMode,
              'Ketuk atau geser jari ke api 3D:',
              'Tap or drag on 3D flames:',
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rem.map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onDispatchAction('SPRAY_FLAME', idx)}
                className={`btn-tactile flex min-h-[54px] items-center gap-2 rounded-xl bg-[#0284C7] px-4 text-sm font-extrabold text-white whitespace-nowrap cursor-pointer ${hintRing(`flame:${idx}`)}`}
              >
                <Flame className="h-4 w-4 text-amber-300" />
                <span>
                  {languageMode === 'en' ? `Spray Flame ${idx + 1}` : `Semprot Api ${idx + 1}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="py-2 text-center font-display text-lg font-extrabold text-[#B91C1C]">
        {pickLang(
          languageMode,
          'Wiu-wiu! Truk Pemadam melaju menuju lokasi api!',
          'Wee-woo! Fire Truck rushing to the flames!',
        )}
      </div>
    );
  }

  // 6. TRUK SAMPAH CONTROLS
  if (mission.vehicleId === 'sampah') {
    if (mission.phase === 'SORT') {
      const unsorted = (mission.wasteItems || []).filter((w) => !w.sorted);
      return (
        <div>
          {variantBar}
          <div
            key={mission.wrongFeedbackKey}
            className={`flex flex-wrap items-center justify-between gap-3 ${
              mission.wrongFeedbackKey ? 'animate-wiggle' : ''
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {unsorted.map((item) => {
                const active = mission.selectedWasteUid === item.uid;
                return (
                  <button
                    key={item.uid}
                    type="button"
                    onClick={() => onDispatchAction('SELECT_WASTE', item.uid)}
                    className={`flex min-h-[52px] items-center gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left transition-transform active:scale-95 cursor-pointer ${
                      active
                        ? 'border-[#2D1F14] bg-[#4A321F] text-[#FFFDF8] shadow-xs'
                        : 'border-[#DFC398] bg-[#FFFDF8] text-[#2D1F14] hover:bg-[#FAF1E0]'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        active ? 'border-[#8D6542] bg-[#FDF8EE]' : 'border-[#E6D1AE] bg-[#FDF8EE]'
                      }`}
                    >
                      <WastePictogram kind={item.kind} className="h-7 w-7" />
                    </span>
                    <div>
                      <div className="text-xs font-extrabold leading-tight">
                        {languageMode === 'en' ? item.nameEn : item.nameId}
                      </div>
                      {languageMode === 'bilingual' && (
                        <div className={`text-[11px] leading-tight ${active ? 'text-[#EBD8BF]' : 'text-[#68503B]'}`}>
                          {item.nameEn}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onDispatchAction('DROP_BIN', 'organic')}
                className={`btn-tactile flex min-h-[58px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white whitespace-nowrap cursor-pointer ${hintRing('bin:organic')}`}
              >
                <Leaf className="h-5 w-5" />
                <span>
                  {pickLang(languageMode, 'Organik', 'Organic')} ({mission.organicCount || 0})
                </span>
              </button>

              <button
                type="button"
                onClick={() => onDispatchAction('DROP_BIN', 'non-organic')}
                className={`btn-tactile flex min-h-[58px] items-center gap-2 rounded-xl bg-[#EAB308] px-4 text-sm font-extrabold text-[#2D1F14] whitespace-nowrap cursor-pointer ${hintRing('bin:non-organic')}`}
              >
                <Recycle className="h-5 w-5" />
                <span>
                  {languageMode === 'en' ? 'Non-Organic' : 'Non-Organik'} ({mission.nonOrganicCount || 0})
                </span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (mission.phase === 'COUNT') {
      return (
        <div
          key={mission.wrongFeedbackKey}
          className={`flex flex-wrap items-center justify-center gap-3 ${
            mission.wrongFeedbackKey ? 'animate-wiggle' : ''
          }`}
        >
          {(mission.wasteCountChoices || []).map((n) => {
            const nw = NUMBER_WORDS[n];
            return (
              <button
                key={n}
                type="button"
                onClick={() => onDispatchAction('COUNT_WASTE', n)}
                className={`btn-tactile flex min-h-[64px] min-w-[120px] flex-col items-center justify-center rounded-2xl bg-emerald-600 px-5 py-2 text-white cursor-pointer ${hintRing(`wasteCount:${n}`)}`}
              >
                <span className="font-display text-2xl font-extrabold tabular-nums leading-none">
                  {n}
                </span>
                <span className="mt-1 text-xs font-bold opacity-95">
                  {pickLang(languageMode, nw.id, nw.en)}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="py-2 text-center font-display text-lg font-extrabold text-emerald-800">
        {pickLang(
          languageMode,
          'Truk Sampah mengangkut kontainer daur ulang!',
          'Garbage Truck is hauling the recycling bins!',
        )}
      </div>
    );
  }

  // 7. TRUK EKSKAVATOR CONTROLS (Shapes & Digging)
  if (mission.vehicleId === 'ekskavator') {
    if (mission.phase === 'DIG') {
      const mounds = mission.digMounds || [];
      return (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold text-[#4A321F]">
            {pickLang(
              languageMode,
              'Ketuk gundukan tanah 3D atau tombol gali:',
              'Tap 3D dirt mounds or dig buttons:',
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mounds.map((m) => {
              const shape = SHAPE_MAP[m.shapeId];
              return (
                <button
                  key={m.index}
                  type="button"
                  disabled={m.dug}
                  onClick={() => onDispatchAction('DIG_MOUND', m.index)}
                  className={`flex min-h-[54px] items-center gap-2 rounded-xl border-2 px-3.5 text-sm font-extrabold transition-transform active:scale-95 cursor-pointer ${
                    m.dug
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 opacity-85'
                      : 'btn-tactile border-transparent bg-[#EA580C] text-white'
                  } ${hintRing(`mound:${m.index}`)}`}
                >
                  {m.dug ? (
                    <>
                      <ShapePictogram shape={m.shapeId} className="h-7 w-7 shrink-0" />
                      <Check className="h-4 w-4 text-emerald-700" />
                      <span className="whitespace-nowrap">
                        {languageMode === 'en' ? shape.nameEn : shape.nameId}
                      </span>
                    </>
                  ) : (
                    <>
                      <Shovel className="h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">
                        {languageMode === 'en' ? `Dig Mound ${m.index + 1}` : `Gali ${m.index + 1}`}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (mission.phase === 'MATCH') {
      const activeShape = mission.activeShapeId ? SHAPE_MAP[mission.activeShapeId] : null;
      const placed = mission.placedShapes || [];
      const availableShapes = (mission.discoveredShapes || SHAPE_OPTIONS.map((s) => s.id));

      return (
        <div
          key={mission.wrongFeedbackKey}
          className={`flex flex-wrap items-center justify-between gap-3 ${
            mission.wrongFeedbackKey ? 'animate-wiggle' : ''
          }`}
        >
          {activeShape && (
            <div className="storybook-card flex items-center gap-2.5 rounded-xl px-3.5 py-2">
              <ShapePictogram shape={activeShape.id} className="h-10 w-10 shrink-0" />
              <div className="leading-tight">
                <div className="text-[11px] font-bold text-[#68503B]">
                  {languageMode === 'en' ? 'Match this shape:' : 'Cocokkan bentuk ini:'}
                </div>
                <div className="font-display text-base font-extrabold text-[#2D1F14]">
                  {pickLang(languageMode, activeShape.nameId, activeShape.nameEn)}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {availableShapes.map((shapeId) => {
              const opt = SHAPE_MAP[shapeId];
              const isPlaced = placed.includes(shapeId);
              return (
                <button
                  key={shapeId}
                  type="button"
                  disabled={isPlaced}
                  onClick={() => onDispatchAction('PLACE_SHAPE', shapeId)}
                  className={`flex min-h-[58px] items-center gap-2.5 rounded-2xl border-2 px-4 py-2 text-left transition-transform active:scale-95 cursor-pointer ${
                    isPlaced
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-800 opacity-65'
                      : 'btn-tactile border-transparent bg-[#FFFDF8] text-[#2D1F14] ring-2 ring-[#CFA772]'
                  } ${hintRing(`shape:${shapeId}`)}`}
                >
                  <ShapePictogram shape={shapeId} className="h-8 w-8 shrink-0" />
                  <div className="leading-tight">
                    <div className="font-display text-sm font-extrabold whitespace-nowrap">
                      {languageMode === 'en' ? opt.nameEn : opt.nameId}
                    </div>
                    {languageMode === 'bilingual' && (
                      <div className="text-[11px] font-semibold text-[#68503B]">{opt.nameEn}</div>
                    )}
                  </div>
                  {isPlaced && <Check className="h-4 w-4 text-emerald-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="py-2 text-center font-display text-lg font-extrabold text-[#C2410C]">
        {pickLang(
          languageMode,
          'Hebat! Semua batu bentuk sudah terpasang rapi!',
          'Awesome! Every carved shape stone fits!',
        )}
      </div>
    );
  }

  // 8. BUS SEKOLAH CONTROLS (Traffic Lights & Patterns)
  if (mission.phase === 'TRAFFIC') {
    return (
      <BusTrafficControls
        languageMode={languageMode}
        mission={mission}
        onDispatchAction={onDispatchAction}
      />
    );
  }

  if (mission.phase === 'PATTERN') {
    const seq = mission.patternSequence || [];
    const choices = mission.patternChoices || [];
    return (
      <div
        key={mission.wrongFeedbackKey}
        className={`flex flex-wrap items-center justify-between gap-3 ${
          mission.wrongFeedbackKey ? 'animate-wiggle' : ''
        }`}
      >
        {/* Visual Color Pattern Strip */}
        <div className="storybook-card flex items-center gap-2 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            {seq.map((cid, i) => {
              const opt = BUS_RIDER_COLOR_MAP[cid];
              return (
                <span
                  key={`${cid}-${i}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FFFDF8] shadow-xs"
                  style={{ backgroundColor: opt.hex }}
                  title={pickLang(languageMode, opt.nameId, opt.nameEn)}
                />
              );
            })}
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-[#C87D20] bg-[#FEF4DC] font-display text-lg font-extrabold text-[#9A5814]">
              ?
            </span>
          </div>
          <span className="ml-1 text-xs font-extrabold text-[#5A422D] tabular-nums whitespace-nowrap">
            {mission.ridersBoarded || 0}/{mission.totalRidersToBoard || 2}
          </span>
        </div>

        {/* Rider Color Choice Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {choices.map((cid) => {
            const opt = BUS_RIDER_COLOR_MAP[cid];
            const isLight = cid === 'yellow';
            return (
              <button
                key={cid}
                type="button"
                onClick={() => onDispatchAction('PICK_PATTERN_RIDER', cid)}
                className={`btn-tactile flex min-h-[58px] min-w-[118px] items-center justify-center gap-2 rounded-2xl px-4 py-2 font-extrabold whitespace-nowrap cursor-pointer ${hintRing(`rider:${cid}`)}`}
                style={{
                  backgroundColor: opt.hex,
                  color: isLight ? '#2D1F14' : '#FFFFFF',
                }}
              >
                <span
                  className="h-4 w-4 rounded-full border-2 border-white/80 shrink-0"
                  style={{ backgroundColor: opt.hatHex }}
                />
                <span className="font-display text-base">
                  {languageMode === 'en' ? opt.nameEn : opt.nameId}
                </span>
                {languageMode === 'bilingual' && (
                  <span className="text-xs opacity-90">/ {opt.nameEn}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 text-center font-display text-lg font-extrabold text-[#A16207]">
      {pickLang(
        languageMode,
        'Bus Sekolah melaju ceria menuju sekolah desa!',
        'School Bus is happily driving to the village school!',
      )}
    </div>
  );
}
