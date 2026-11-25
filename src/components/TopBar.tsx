import { ArrowLeft, Star, Volume2, VolumeX } from 'lucide-react';
import type { AgeMode, ViewMode } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  viewMode: ViewMode;
  ageMode: AgeMode;
  soundEnabled: boolean;
  totalStars: number;
  onBackToGarage: () => void;
  onChangeAgeMode: (mode: AgeMode) => void;
  onToggleSound: () => void;
}

export function TopBar({
  viewMode,
  ageMode,
  soundEnabled,
  totalStars,
  onBackToGarage,
  onChangeAgeMode,
  onToggleSound,
}: TopBarProps) {
  return (
    <header className="pointer-events-auto relative z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm sm:gap-8 sm:px-6">
      {/* Zone 1: Brand Title / Back to Garage */}
      <div className="flex items-center gap-3 min-w-0">
        {viewMode === 'MISSION' && (
          <button
            type="button"
            onClick={onBackToGarage}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 transition-transform active:scale-95 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Kembali ke Garasi"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Garasi</span>
          </button>
        )}
        <h1 className="font-display text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl whitespace-nowrap shrink-0 truncate">
          Kota Kendaraan Ceria 3D
        </h1>
      </div>

      {/* Zone 2: Age Difficulty Segmented Control */}
      <div
        className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 shrink-0"
        role="group"
        aria-label="Pilih mode usia"
      >
        <button
          type="button"
          onClick={() => onChangeAgeMode('toddler')}
          className={`h-9 rounded-lg px-3 text-xs font-bold transition-colors sm:px-4 sm:text-sm whitespace-nowrap shrink-0 cursor-pointer ${
            ageMode === 'toddler'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          Balita 2–3
        </button>
        <button
          type="button"
          onClick={() => onChangeAgeMode('preschool')}
          className={`h-9 rounded-lg px-3 text-xs font-bold transition-colors sm:px-4 sm:text-sm whitespace-nowrap shrink-0 cursor-pointer ${
            ageMode === 'preschool'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          Prasekolah 4–6
        </button>
      </div>

      {/* Zone 3: Star Total, PWA Install & Sound Control */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
        <div
          className="flex items-center gap-1.5 text-sm font-extrabold text-slate-800 tabular-nums whitespace-nowrap shrink-0"
          aria-label={`Total bintang: ${totalStars}`}
        >
          <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
          <span>{totalStars}</span>
        </div>

        <PWAInstallButton />

        <button
          type="button"
          onClick={onToggleSound}
          className={`flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-bold transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
          aria-label={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span className="hidden sm:inline">{soundEnabled ? 'Suara Aktif' : 'Suara Mati'}</span>
        </button>
      </div>
    </header>
  );
}
