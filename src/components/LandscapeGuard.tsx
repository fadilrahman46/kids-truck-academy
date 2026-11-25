import { Maximize2, RotateCw } from 'lucide-react';

interface LandscapeGuardProps {
  visible: boolean;
  onLockLandscape: () => void;
}

export function LandscapeGuard({ visible, onLockLandscape }: LandscapeGuardProps) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#D9F0FF] p-6 text-center"
      role="alert"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-3xl border-2 border-sky-200 bg-white p-7 shadow-xl">
        {/* Friendly Animated Rotate Phone Graphic */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-9 rounded-lg border-4 border-sky-600 bg-white shadow-xs rotate-90 transition-transform" />
            <RotateCw className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-amber-400 p-1 text-slate-900 shadow-xs" />
          </div>
        </div>

        <h2 className="font-display mt-5 text-2xl font-extrabold text-slate-900">
          Putar Layar ke Mendatar
        </h2>
        <p className="mt-1 text-sm font-bold text-sky-700">
          Please Rotate Device to Landscape
        </p>

        <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">
          Permainan <strong>Kota Kendaraan Ceria 3D</strong> dimainkan dalam mode layar mendatar
          (landscape) agar semua truk 3D dan tombol kontrol terlihat besar dan nyaman untuk anak.
        </p>

        <button
          type="button"
          onClick={onLockLandscape}
          className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-sm transition-transform active:scale-95 hover:bg-blue-700 cursor-pointer"
        >
          <Maximize2 className="h-4 w-4 shrink-0" />
          <span>Kunci Layar Mendatar · Lock Landscape</span>
        </button>
      </div>
    </div>
  );
}
