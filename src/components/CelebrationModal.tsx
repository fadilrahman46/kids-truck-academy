import { ArrowRight, Home, RotateCcw, Star } from 'lucide-react';
import { pickLang, VEHICLE_MAP, VEHICLES, type LanguageMode, type VehicleId } from '../types/game';
import { TruckIllustration } from './TruckIllustration';

interface CelebrationModalProps {
  vehicleId: VehicleId;
  languageMode: LanguageMode;
  onPlayAgain: () => void;
  onNextTruck: (nextVehicleId: VehicleId) => void;
  onBackToGarage: () => void;
}

export function getNextVehicleId(currentId: VehicleId): VehicleId {
  const idx = VEHICLES.findIndex((v) => v.id === currentId);
  if (idx < 0) return VEHICLES[0].id;
  return VEHICLES[(idx + 1) % VEHICLES.length].id;
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
  languageMode,
  onPlayAgain,
  onNextTruck,
  onBackToGarage,
}: CelebrationModalProps) {
  const vehicle = VEHICLE_MAP[vehicleId];
  const nextVehicleId = getNextVehicleId(vehicleId);
  const nextVehicle = VEHICLE_MAP[nextVehicleId];
  const nextTruckName = languageMode === 'en' ? nextVehicle.nameEn : nextVehicle.nameId;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center overflow-hidden bg-[#2D1F14]/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={pickLang(languageMode, 'Perayaan Misi Selesai', 'Mission Complete Celebration')}
    >
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

      <div className="animate-pop-in storybook-paper relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl p-5 text-center sm:p-6">
        <div className="mx-auto flex items-center justify-center gap-2">
          <Star className="h-8 w-8 fill-amber-400 text-amber-600 sm:h-9 sm:w-9" />
          <Star className="h-11 w-11 fill-amber-400 text-amber-600 -mt-2 sm:h-12 sm:w-12 sm:-mt-2.5" />
          <Star className="h-8 w-8 fill-amber-400 text-amber-600 sm:h-9 sm:w-9" />
        </div>

        {/* Reward 2D Picture-Book Portrait */}
        <TruckIllustration
          vehicleId={vehicleId}
          className="mx-auto mt-3 h-24 w-28 border-2 border-[#DEC195] shadow-xs"
        />

        <h2 className="font-display mt-2.5 text-2xl font-extrabold text-[#2D1F14] sm:text-3xl">
          {languageMode === 'en' ? 'Great Job!' : 'Hebat Sekali!'}
        </h2>
        {languageMode === 'bilingual' && (
          <p className="mt-0.5 text-sm font-bold text-[#B86A1E] sm:text-base">Great Job!</p>
        )}

        <p className="mt-2 text-sm font-medium text-[#5A422D]">
          {languageMode === 'en' ? (
            <>
              You completed the <span className="font-extrabold text-[#2D1F14]">{vehicle.nameEn}</span>{' '}
              mission and earned 1 new star!
            </>
          ) : (
            <>
              Kamu berhasil menyelesaikan misi{' '}
              <span className="font-extrabold text-[#2D1F14]">{vehicle.nameId}</span>
              {languageMode === 'bilingual' ? ` (${vehicle.nameEn})` : ''} dan mendapatkan 1 bintang baru.
            </>
          )}
        </p>

        {/* Primary "Next Truck" shortcut for continuous toddler play */}
        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onNextTruck(nextVehicleId)}
            className="btn-tactile flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-extrabold text-white whitespace-nowrap cursor-pointer"
            style={{ backgroundColor: nextVehicle.accentHex }}
          >
            <span>
              {languageMode === 'en'
                ? `Next Truck: ${nextTruckName}`
                : `Truk Berikutnya: ${nextTruckName}`}
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onPlayAgain}
              className="btn-tactile flex flex-1 min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{languageMode === 'en' ? 'Play Again' : 'Main Lagi'}</span>
            </button>

            <button
              type="button"
              onClick={onBackToGarage}
              className="btn-wood-secondary flex flex-1 min-h-[50px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold whitespace-nowrap cursor-pointer"
            >
              <Home className="h-4 w-4 text-[#5A3A1E]" />
              <span>{languageMode === 'en' ? 'Garage' : 'Garasi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
