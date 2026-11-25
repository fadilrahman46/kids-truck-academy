import { Home, RotateCcw, Star } from 'lucide-react';
import { VEHICLE_MAP, type VehicleId } from '../types/game';

interface CelebrationModalProps {
  vehicleId: VehicleId;
  onPlayAgain: () => void;
  onBackToGarage: () => void;
}

const CONFETTI_PARTICLES = [
  'left-[3%] bg-amber-400 w-3 h-4 rounded-sm confetti-sway [animation-duration:2.6s] [animation-delay:0ms]',
  'left-[7%] bg-red-500 w-2.5 h-2.5 rounded-full confetti-right [animation-duration:2.3s] [animation-delay:180ms]',
  'left-[11%] bg-sky-400 w-2 h-5 rounded-full confetti-left [animation-duration:2.9s] [animation-delay:90ms]',
  'left-[15%] bg-emerald-500 w-3 h-3 rounded-sm confetti-sway [animation-duration:2.4s] [animation-delay:320ms]',
  'left-[19%] bg-purple-500 w-2.5 h-4 rounded-sm confetti-right [animation-duration:2.8s] [animation-delay:50ms]',
  'left-[23%] bg-orange-400 w-3 h-3 rounded-full confetti-left [animation-duration:2.5s] [animation-delay:420ms]',
  'left-[27%] bg-yellow-300 w-2 h-5 rounded-sm confetti-sway [animation-duration:2.2s] [animation-delay:140ms]',
  'left-[31%] bg-pink-500 w-3 h-3.5 rounded-sm confetti-right [animation-duration:2.7s] [animation-delay:260ms]',
  'left-[35%] bg-blue-500 w-2.5 h-2.5 rounded-full confetti-left [animation-duration:2.3s] [animation-delay:380ms]',
  'left-[39%] bg-emerald-400 w-2 h-5 rounded-full confetti-sway [animation-duration:3.0s] [animation-delay:120ms]',
  'left-[43%] bg-amber-500 w-3 h-4 rounded-sm confetti-right [animation-duration:2.4s] [animation-delay:20ms]',
  'left-[47%] bg-red-400 w-3 h-3 rounded-full confetti-left [animation-duration:2.6s] [animation-delay:300ms]',
  'left-[51%] bg-sky-500 w-2.5 h-4 rounded-sm confetti-sway [animation-duration:2.5s] [animation-delay:160ms]',
  'left-[55%] bg-purple-400 w-2 h-5 rounded-full confetti-right [animation-duration:2.9s] [animation-delay:460ms]',
  'left-[59%] bg-yellow-400 w-3.5 h-3.5 rounded-sm confetti-left [animation-duration:2.2s] [animation-delay:70ms]',
  'left-[63%] bg-emerald-500 w-2.5 h-2.5 rounded-full confetti-sway [animation-duration:2.7s] [animation-delay:240ms]',
  'left-[67%] bg-orange-500 w-2.5 h-4 rounded-sm confetti-right [animation-duration:2.4s] [animation-delay:350ms]',
  'left-[71%] bg-blue-400 w-2 h-5 rounded-full confetti-left [animation-duration:2.8s] [animation-delay:110ms]',
  'left-[75%] bg-pink-400 w-3 h-3 rounded-sm confetti-sway [animation-duration:2.3s] [animation-delay:290ms]',
  'left-[79%] bg-amber-400 w-3 h-3 rounded-full confetti-right [animation-duration:2.6s] [animation-delay:40ms]',
  'left-[83%] bg-red-500 w-2.5 h-4 rounded-sm confetti-left [animation-duration:2.5s] [animation-delay:410ms]',
  'left-[87%] bg-sky-400 w-3 h-3.5 rounded-sm confetti-sway [animation-duration:2.9s] [animation-delay:200ms]',
  'left-[91%] bg-emerald-400 w-2.5 h-2.5 rounded-full confetti-right [animation-duration:2.3s] [animation-delay:130ms]',
  'left-[95%] bg-purple-500 w-2 h-5 rounded-full confetti-left [animation-duration:2.7s] [animation-delay:340ms]',
  'left-[13%] bg-yellow-400 w-2.5 h-3.5 rounded-sm confetti-right [animation-duration:3.1s] [animation-delay:620ms]',
  'left-[33%] bg-orange-400 w-2.5 h-2.5 rounded-full confetti-sway [animation-duration:2.8s] [animation-delay:540ms]',
  'left-[53%] bg-pink-500 w-2 h-4 rounded-sm confetti-left [animation-duration:3.0s] [animation-delay:680ms]',
  'left-[73%] bg-sky-500 w-3 h-3 rounded-full confetti-right [animation-duration:2.6s] [animation-delay:590ms]',
];

export function CelebrationModal({
  vehicleId,
  onPlayAgain,
  onBackToGarage,
}: CelebrationModalProps) {
  const vehicle = VEHICLE_MAP[vehicleId];

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center overflow-hidden bg-slate-900/35 p-4">
      {/* Festive CSS-based Particle Confetti Layer */}
      <div
        className="confetti-layer pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {CONFETTI_PARTICLES.map((classes, idx) => (
          <span
            key={idx}
            className={`absolute -top-6 block opacity-0 shadow-xs ${classes}`}
          />
        ))}
      </div>

      <div className="animate-pop-in relative z-10 w-full max-w-md rounded-3xl border-2 border-amber-300 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex items-center justify-center gap-2">
          <Star className="h-10 w-10 fill-amber-400 text-amber-500" />
          <Star className="h-14 w-14 fill-amber-400 text-amber-500 -mt-3" />
          <Star className="h-10 w-10 fill-amber-400 text-amber-500" />
        </div>

        <h2 className="font-display mt-3 text-3xl font-extrabold text-slate-900">
          Hebat Sekali!
        </h2>
        <p className="mt-1 text-base font-bold text-amber-600">Great Job!</p>

        <p className="mt-3 text-sm font-medium text-slate-600">
          Kamu berhasil menyelesaikan misi{' '}
          <span className="font-extrabold text-slate-900">{vehicle.nameId}</span> ({vehicle.nameEn})
          dan mendapatkan 1 bintang baru.
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex flex-1 min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-extrabold text-white shadow-sm transition-transform active:scale-95 hover:bg-emerald-700 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Main Lagi</span>
          </button>

          <button
            type="button"
            onClick={onBackToGarage}
            className="flex flex-1 min-h-[54px] items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 text-base font-extrabold text-slate-800 transition-transform active:scale-95 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
          >
            <Home className="h-5 w-5" />
            <span>Pilih Truk Lain</span>
          </button>
        </div>
      </div>
    </div>
  );
}
