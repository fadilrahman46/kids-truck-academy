import { Maximize2, RotateCw } from 'lucide-react';
import { pickLang, type LanguageMode } from '../types/game';

interface LandscapeGuardProps {
  visible: boolean;
  languageMode?: LanguageMode;
  onLockLandscape: () => void;
}

export function LandscapeGuard({
  visible,
  languageMode = 'bilingual',
  onLockLandscape,
}: LandscapeGuardProps) {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F3E7D1] p-6 text-center"
      role="alert"
      aria-live="polite"
    >
      <div className="storybook-paper w-full max-w-sm rounded-3xl p-7">
        {/* Friendly Rotate Phone Graphic */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-[#DEC195] bg-[#FAF0DC]">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-9 rounded-lg border-4 border-[#6B421E] bg-[#FFFDF8] shadow-xs rotate-90 transition-transform" />
            <RotateCw className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-[#EAB308] p-1 text-[#2D1F14] shadow-xs" />
          </div>
        </div>

        <h2 className="font-display mt-5 text-2xl font-extrabold text-[#2D1F14]">
          {languageMode === 'en' ? 'Rotate to Landscape' : 'Putar Layar ke Mendatar'}
        </h2>
        {languageMode === 'bilingual' && (
          <p className="mt-1 text-sm font-bold text-[#9A5814]">
            Please Rotate Device to Landscape
          </p>
        )}

        <p className="mt-3 text-sm font-medium text-[#5A422D] leading-relaxed">
          {languageMode === 'en' ? (
            <>
              <strong className="text-[#2D1F14]">Cheerful Vehicle Town 3D</strong> is played in
              landscape mode so all 3D trucks and kid-friendly buttons stay large and clear.
            </>
          ) : (
            <>
              Permainan <strong className="text-[#2D1F14]">Kota Kendaraan Ceria 3D</strong> dimainkan dalam mode layar mendatar
              (landscape) agar semua truk 3D dan tombol kontrol terlihat besar dan nyaman untuk anak.
            </>
          )}
        </p>

        <button
          type="button"
          onClick={onLockLandscape}
          className="btn-tactile mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-sm font-extrabold text-white cursor-pointer"
        >
          <Maximize2 className="h-4 w-4 shrink-0" />
          <span>{pickLang(languageMode, 'Kunci Layar Mendatar', 'Lock Landscape')}</span>
        </button>
      </div>
    </div>
  );
}
