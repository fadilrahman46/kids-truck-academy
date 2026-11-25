import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Leaf,
  Minus,
  Plus,
  Recycle,
  RotateCw,
  Star,
  Volume2,
} from 'lucide-react';
import {
  ALL_COLORS,
  CARGO_OPTIONS,
  NUMBER_WORDS,
  PRIMARY_COLORS,
  VEHICLES,
  mixTwoColors,
  type AgeMode,
  type MissionSnapshot,
  type VehicleId,
  type ViewMode,
} from '../types/game';

interface BottomDockProps {
  viewMode: ViewMode;
  ageMode: AgeMode;
  collapsed: boolean;
  starsByTruck: Record<VehicleId, number>;
  mission: MissionSnapshot | null;
  onToggleCollapse: () => void;
  onSelectTruck: (id: VehicleId) => void;
  onHonkTruck: (id: VehicleId) => void;
  onDispatchAction: (action: string, payload?: unknown) => void;
}

export function BottomDock({
  viewMode,
  ageMode,
  collapsed,
  starsByTruck,
  mission,
  onToggleCollapse,
  onSelectTruck,
  onHonkTruck,
  onDispatchAction,
}: BottomDockProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex flex-col items-center px-3">
      {/* Collapse / Expand Handle (Zen Mode for inspecting 3D scene) */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="pointer-events-auto mb-1.5 flex items-center gap-1.5 rounded-t-xl rounded-b-lg border border-slate-200 bg-white/95 px-4 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-transform active:scale-95 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
      >
        {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span>{collapsed ? 'Tampilkan Kontrol' : 'Sembunyikan Kontrol'}</span>
      </button>

      {/* Main Dock Container */}
      <div
        className={`pointer-events-auto w-full max-w-[940px] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg transition-transform duration-200 sm:p-4 ${
          collapsed ? 'translate-y-[125%] opacity-0 pointer-events-none hidden' : 'translate-y-0 opacity-100'
        }`}
      >
        {viewMode === 'GARAGE' ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {VEHICLES.map((v) => {
              const stars = starsByTruck[v.id] || 0;
              return (
                <div
                  key={v.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/90 p-2.5 transition-transform hover:-translate-y-0.5"
                >
                  <button
                    type="button"
                    onClick={() => onSelectTruck(v.id)}
                    className="flex flex-col items-start text-left cursor-pointer"
                  >
                    <div className="flex w-full items-center justify-between gap-1">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: v.accentHex }}
                        aria-hidden="true"
                      />
                      <span className="flex items-center gap-0.5 text-xs font-bold text-slate-600 tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        {stars}
                      </span>
                    </div>
                    <span className="font-display mt-1.5 text-sm font-extrabold text-slate-900 leading-tight">
                      {v.nameId}
                    </span>
                    <span className="text-xs font-medium text-slate-500 leading-tight">
                      {v.nameEn} · {v.topicId}
                    </span>
                  </button>

                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectTruck(v.id)}
                      className="flex-1 rounded-lg px-2 py-1.5 text-xs font-extrabold text-white transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
                      style={{ backgroundColor: v.accentHex }}
                    >
                      Main
                    </button>
                    <button
                      type="button"
                      onClick={() => onHonkTruck(v.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-transform active:scale-95 hover:bg-slate-100 shrink-0 cursor-pointer"
                      title={`Bunyikan klakson ${v.nameId}`}
                      aria-label={`Klakson ${v.nameId}`}
                    >
                      <Volume2 className="h-4 w-4" />
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
              mission={mission}
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
  mission: MissionSnapshot;
  onDispatchAction: (action: string, payload?: unknown) => void;
}

function MissionControls({ ageMode, mission, onDispatchAction }: MissionControlsProps) {
  // 1. TRUK MOLEN CONTROLS
  if (mission.vehicleId === 'molen') {
    const selected = mission.selectedColors || [];
    const maxPicks = ageMode === 'toddler' ? 1 : 2;
    const ready = selected.length === maxPicks;
    const previewColor =
      selected.length === 1
        ? ALL_COLORS[selected[0]]
        : selected.length === 2
          ? mixTwoColors(selected[0], selected[1])
          : null;

    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {PRIMARY_COLORS.map((c) => {
            const countPicked = selected.filter((s) => s === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                disabled={mission.phase !== 'PICK'}
                onClick={() => onDispatchAction('PICK_COLOR', c.id)}
                className="flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 px-4 py-2 text-left font-bold transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: c.hex,
                  borderColor: countPicked > 0 ? '#0F172A' : 'transparent',
                  color: c.id === 'yellow' ? '#1E293B' : '#FFFFFF',
                }}
              >
                <span className="font-display text-base font-extrabold">{c.nameId}</span>
                <span className="text-xs opacity-90">/ {c.nameEn}</span>
                {countPicked > 0 && (
                  <span className="ml-1 rounded-md bg-black/20 px-1.5 py-0.5 text-xs tabular-nums">
                    ×{countPicked}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          {selected.length > 0 && previewColor && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800">
              <span
                className="h-6 w-6 rounded-lg border border-slate-300 shrink-0"
                style={{ backgroundColor: previewColor.hex }}
              />
              <span>
                {selected.map((id) => ALL_COLORS[id].nameId).join(' + ')}
                {selected.length === 2 ? ` = ${previewColor.nameId}` : ''}
              </span>
            </div>
          )}

          {mission.phase === 'PICK' && selected.length > 0 && (
            <button
              type="button"
              onClick={() => onDispatchAction('CLEAR_COLORS')}
              className="min-h-[56px] rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-sm font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              Ulang
            </button>
          )}

          <button
            type="button"
            disabled={!ready || mission.phase !== 'PICK'}
            onClick={() => onDispatchAction('SPIN_MIXER')}
            className="flex min-h-[56px] items-center gap-2 rounded-xl bg-amber-500 px-5 text-base font-extrabold text-white shadow-sm transition-transform active:scale-95 hover:bg-amber-600 disabled:bg-slate-300 disabled:text-slate-500 whitespace-nowrap cursor-pointer"
          >
            <RotateCw className="h-5 w-5" />
            <span>Putar Molen! · Spin</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. TRUK ANGKUT CONTROLS
  if (mission.vehicleId === 'angkut') {
    if (mission.phase === 'LOAD') {
      return (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {CARGO_OPTIONS.map((c) => {
              const active = mission.cargoType === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onDispatchAction('SELECT_CARGO', c.id)}
                  className={`min-h-[54px] rounded-xl border-2 px-3.5 py-2 text-left transition-transform active:scale-95 cursor-pointer ${
                    active
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-display text-sm font-extrabold">{c.nameId}</div>
                  <div className="text-xs text-slate-500">{c.nameEn}</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => onDispatchAction('CHANGE_AMOUNT', -1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-800 shadow-sm border border-slate-200 active:scale-95 cursor-pointer"
                aria-label="Kurangi barang"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="font-display w-10 text-center text-2xl font-extrabold text-slate-900 tabular-nums">
                {mission.loadedCount}
              </span>
              <button
                type="button"
                onClick={() => onDispatchAction('CHANGE_AMOUNT', 1)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm active:scale-95 cursor-pointer"
                aria-label="Tambah barang"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => onDispatchAction('START_COUNT')}
              className="min-h-[56px] rounded-xl bg-emerald-600 px-5 text-base font-extrabold text-white shadow-sm transition-transform active:scale-95 hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
            >
              Ayo Hitung! · Count
            </button>
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
                className="flex min-h-[64px] min-w-[120px] flex-col items-center justify-center rounded-2xl border-2 border-blue-200 bg-blue-600 px-5 py-2 text-white shadow-sm transition-transform active:scale-95 hover:bg-blue-700 cursor-pointer"
              >
                <span className="font-display text-2xl font-extrabold tabular-nums leading-none">
                  {n}
                </span>
                <span className="mt-1 text-xs font-bold opacity-95">
                  {nw.id} · {nw.en}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="py-2 text-center font-display text-lg font-extrabold text-blue-700">
        Truk Angkut sedang melaju mengantar barang! · Driving to deliver!
      </div>
    );
  }

  // 3. TRUK TANGKI CONTROLS
  if (mission.vehicleId === 'tangki') {
    const pct = Math.round((mission.tankFill || 0) * 100);
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(mission.pipes || []).map((p) => (
            <button
              key={p.index}
              type="button"
              disabled={mission.phase !== 'PUZZLE'}
              onClick={() => onDispatchAction('ROTATE_PIPE', p.index)}
              className={`flex min-h-[54px] items-center gap-2 rounded-xl border-2 px-3.5 text-sm font-extrabold transition-transform active:scale-95 disabled:opacity-50 cursor-pointer ${
                p.connected
                  ? 'border-sky-500 bg-sky-100 text-sky-900'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <RotateCw className="h-4 w-4" />
              <span>Pipa {p.index + 1}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-sky-800 tabular-nums">
            <Droplets className="h-5 w-5 text-sky-500" />
            <span>Tangki: {pct}%</span>
          </div>
          <div className="h-4 w-36 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-sky-500 transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 4. TRUK CRANE CONTROLS
  if (mission.vehicleId === 'crane') {
    if (mission.phase === 'COUNT') {
      return (
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
                className="flex min-h-[64px] min-w-[120px] flex-col items-center justify-center rounded-2xl bg-amber-500 px-5 py-2 text-white shadow-sm transition-transform active:scale-95 hover:bg-amber-600 cursor-pointer"
              >
                <span className="font-display text-2xl font-extrabold tabular-nums leading-none">
                  {n}
                </span>
                <span className="mt-1 text-xs font-bold opacity-95">
                  {nw.id} · {nw.en}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

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
            <span className={isBalanced ? 'text-emerald-700' : 'text-amber-700'}>
              {isBalanced ? 'Seimbang! · Balanced' : 'Geser ke Tengah · Center Load'}
            </span>
            <span className="text-slate-600 tabular-nums">
              Muatan {mission.craneDroppedCount || 0}/{mission.craneTotalDrops || 1}
            </span>
          </div>
          <div className="relative h-5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="absolute top-0 bottom-0 bg-emerald-400/75"
              style={{
                left: `${50 - zoneWidthPct / 2}%`,
                width: `${zoneWidthPct}%`,
              }}
            />
            <div
              className={`absolute top-0.5 bottom-0.5 w-4 -ml-2 rounded-full border-2 border-white shadow transition-all duration-100 ${
                isBalanced ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
              style={{ left: `${Math.min(96, Math.max(4, markerPct))}%` }}
            />
          </div>
        </div>

        {/* Tactile Crane Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={mission.phase !== 'BALANCE'}
            onClick={() => onDispatchAction('CRANE_MOVE', -1)}
            className="flex min-h-[58px] items-center gap-1.5 rounded-xl bg-slate-800 px-4 text-sm font-extrabold text-white active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Kiri</span>
          </button>

          <button
            type="button"
            disabled={mission.phase !== 'BALANCE'}
            onClick={() => onDispatchAction('CRANE_DROP')}
            className={`flex min-h-[58px] items-center gap-1.5 rounded-xl px-5 text-base font-extrabold text-white shadow-sm active:scale-95 disabled:opacity-40 whitespace-nowrap cursor-pointer ${
              isBalanced ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            <ArrowDown className="h-5 w-5" />
            <span>Turunkan! · Drop</span>
          </button>

          <button
            type="button"
            disabled={mission.phase !== 'BALANCE'}
            onClick={() => onDispatchAction('CRANE_MOVE', 1)}
            className="flex min-h-[58px] items-center gap-1.5 rounded-xl bg-slate-800 px-4 text-sm font-extrabold text-white active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            <span>Kanan</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // 5. TRUK PEMADAM CONTROLS
  if (mission.vehicleId === 'pemadam') {
    if (mission.phase === 'LETTER') {
      return (
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
              className="flex min-h-[66px] min-w-[124px] flex-col items-center justify-center rounded-2xl bg-red-600 px-5 py-2 text-white shadow-sm transition-transform active:scale-95 hover:bg-red-700 cursor-pointer"
            >
              <span className="font-display text-3xl font-extrabold leading-none">
                {entry.letter}
              </span>
              <span className="mt-1 text-xs font-bold opacity-90">
                {entry.wordId} · {entry.wordEn}
              </span>
            </button>
          ))}
        </div>
      );
    }

    if (mission.phase === 'SPRAY') {
      const rem = mission.flamesRemaining || [];
      return (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-700">
            Ketuk langsung api di rumah 3D atau pilih titik api:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rem.map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onDispatchAction('SPRAY_FLAME', idx)}
                className="flex min-h-[54px] items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-extrabold text-white shadow-sm active:scale-95 hover:bg-sky-700 whitespace-nowrap cursor-pointer"
              >
                <Flame className="h-4 w-4 text-amber-300" />
                <span>Semprot Api {idx + 1}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="py-2 text-center font-display text-lg font-extrabold text-red-600">
        Wiu-wiu! Truk Pemadam melaju menuju lokasi api! · Fire Truck rushing!
      </div>
    );
  }

  // 6. TRUK SAMPAH CONTROLS
  if (mission.phase === 'SORT') {
    const unsorted = (mission.wasteItems || []).filter((w) => !w.sorted);
    return (
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
                className={`min-h-[50px] rounded-xl border-2 px-3 py-1.5 text-left transition-transform active:scale-95 cursor-pointer ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-extrabold">{item.nameId}</div>
                <div className={`text-[11px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.nameEn}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onDispatchAction('DROP_BIN', 'organic')}
            className="flex min-h-[58px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-sm active:scale-95 hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
          >
            <Leaf className="h-5 w-5" />
            <span>Organik · Organic ({mission.organicCount || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => onDispatchAction('DROP_BIN', 'non-organic')}
            className="flex min-h-[58px] items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-extrabold text-slate-950 shadow-sm active:scale-95 hover:bg-amber-600 whitespace-nowrap cursor-pointer"
          >
            <Recycle className="h-5 w-5" />
            <span>Non-Organik ({mission.nonOrganicCount || 0})</span>
          </button>
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
              className="flex min-h-[64px] min-w-[120px] flex-col items-center justify-center rounded-2xl bg-emerald-600 px-5 py-2 text-white shadow-sm active:scale-95 hover:bg-emerald-700 cursor-pointer"
            >
              <span className="font-display text-2xl font-extrabold tabular-nums leading-none">
                {n}
              </span>
              <span className="mt-1 text-xs font-bold opacity-95">
                {nw.id} · {nw.en}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="py-2 text-center font-display text-lg font-extrabold text-emerald-700">
      Truk Sampah mengangkut kontainer daur ulang! · Garbage Truck rolling!
    </div>
  );
}
