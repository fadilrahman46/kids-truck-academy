import { Play, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface LoadingScreenProps {
  progress: number;
  engineReady: boolean;
  onStartGame: () => void;
}

export function LoadingScreen({ progress, engineReady, onStartGame }: LoadingScreenProps) {
  const pct = Math.min(100, Math.round(progress));
  const isReady = engineReady && pct >= 100;

  const statusId =
    pct < 40
      ? 'Menyiapkan kota 3D ceria...'
      : pct < 80
        ? 'Merakit 6 truk edukatif...'
        : !isReady
          ? 'Menyalakan suara & mesin truk...'
          : 'Semua truk siap melaju!';

  const statusEn =
    pct < 40
      ? 'Building sunny 3D town...'
      : pct < 80
        ? 'Assembling 6 educational trucks...'
        : !isReady
          ? 'Warming up voices & engines...'
          : 'All trucks are ready to roll!';

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-b from-[#BCE3FF] via-[#E6F5FF] to-[#84D45A] p-6">
      <div className="animate-pop-in flex w-full max-w-lg flex-col items-center rounded-3xl border-2 border-white bg-white/95 p-6 text-center shadow-2xl sm:p-8">
        <img
          src="/icon.svg"
          alt="Ikon Kota Kendaraan Ceria 3D"
          className="h-24 w-24 rounded-3xl border-2 border-sky-100 shadow-md sm:h-28 sm:w-28"
        />

        <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Kota Kendaraan Ceria 3D
        </h1>
        <p className="mt-1 text-sm font-bold text-sky-700">
          Simulasi 6 Truk Edukatif · Usia 2–6 Tahun
        </p>

        {/* Progress Bar */}
        <div className="mt-6 w-full">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700 sm:text-sm">
            <span>{statusId}</span>
            <span className="font-display text-sky-700 tabular-nums">{pct}%</span>
          </div>

          <div className="h-5 w-full overflow-hidden rounded-full border border-sky-200 bg-sky-100 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-blue-500 to-emerald-500 transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="mt-1.5 text-xs font-semibold text-slate-500">{statusEn}</p>
        </div>

        {/* Action Area */}
        <div className="mt-6 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {isReady ? (
            <button
              type="button"
              onClick={onStartGame}
              className="flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 px-8 text-lg font-extrabold text-white shadow-md transition-transform active:scale-95 hover:bg-emerald-700 sm:w-auto cursor-pointer"
            >
              <Play className="h-6 w-6 fill-white" />
              <span>Mulai Bermain! · Start</span>
            </button>
          ) : (
            <div className="flex min-h-[60px] items-center gap-2 text-sm font-bold text-slate-500">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Mohon tunggu sebentar...</span>
            </div>
          )}

          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
}
