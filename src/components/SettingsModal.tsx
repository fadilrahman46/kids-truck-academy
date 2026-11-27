import { Globe, Music, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { pickLang, type LanguageMode } from '../types/game';

interface SettingsModalProps {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  languageMode: LanguageMode;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onChangeLanguage: (mode: LanguageMode) => void;
  onClose: () => void;
}

const LANGUAGE_OPTIONS: {
  id: LanguageMode;
  label: string;
  descId: string;
  descEn: string;
}[] = [
  {
    id: 'id',
    label: 'Bahasa Indonesia',
    descId: 'Suara & teks Bahasa Indonesia',
    descEn: 'Indonesian voice & text',
  },
  {
    id: 'en',
    label: 'English',
    descId: 'Suara & teks Bahasa Inggris',
    descEn: 'English voice & text',
  },
];

export function SettingsModal({
  musicEnabled,
  sfxEnabled,
  languageMode,
  onToggleMusic,
  onToggleSfx,
  onChangeLanguage,
  onClose,
}: SettingsModalProps) {
  const activeLangOption =
    LANGUAGE_OPTIONS.find((opt) => opt.id === languageMode) || LANGUAGE_OPTIONS[0];

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#2D1F14]/50 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="animate-pop-in storybook-paper flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl">
        {/* Carved Honey-Oak Header */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#CFA772] bg-gradient-to-b from-[#FFF9EC] to-[#F3E3C4] px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="btn-tactile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B86A1E] text-[#FFFDF8]">
              <Settings className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="settings-modal-title"
                className="font-display text-lg font-extrabold text-[#2D1F14] sm:text-xl truncate"
              >
                {pickLang(languageMode, 'Pengaturan', 'Settings')}
              </h2>
              <p className="text-xs font-semibold text-[#68503B]">
                {pickLang(languageMode, 'Musik, efek suara & bahasa', 'Music, sound FX & language')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-wood-secondary flex h-10 w-10 items-center justify-center rounded-xl shrink-0 cursor-pointer"
            aria-label={pickLang(languageMode, 'Tutup Pengaturan', 'Close Settings')}
          >
            <X className="h-4 w-4 text-[#4A2E14]" />
          </button>
        </div>

        {/* Settings Controls List */}
        <div className="flex-1 divide-y divide-[#E3CCA6] overflow-y-auto px-5 py-2">
          {/* 1. Background Music Toggle */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DFC398] bg-[#FAF0DC] text-[#2B7A9E]">
                <Music className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-extrabold text-[#2D1F14] leading-tight">
                  {pickLang(languageMode, 'Musik Latar', 'Music')}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-[#68503B]">
                  {pickLang(languageMode, 'Lagu tema santai & ceria', 'Chill & happy theme song')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={musicEnabled}
              onClick={onToggleMusic}
              className={`btn-tactile flex h-11 min-w-[96px] items-center justify-center rounded-xl px-4 text-sm font-extrabold whitespace-nowrap shrink-0 cursor-pointer ${
                musicEnabled
                  ? 'bg-[#2B7A9E] text-white'
                  : 'bg-[#E7D8BE] text-[#5C432C]'
              }`}
            >
              {musicEnabled
                ? pickLang(languageMode, 'Aktif', 'On')
                : pickLang(languageMode, 'Mati', 'Off')}
            </button>
          </div>

          {/* 2. Sound FX & Voice Narration Toggle */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DFC398] bg-[#FAF0DC] text-[#1F8A4C]">
                {sfxEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-[#7A614B]" />}
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-extrabold text-[#2D1F14] leading-tight">
                  {pickLang(languageMode, 'Efek Suara & Suara', 'Sound FX & Voice')}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-[#68503B]">
                  {pickLang(languageMode, 'Klakson truk, efek & narasi', 'Truck horns, SFX & voice')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={sfxEnabled}
              onClick={onToggleSfx}
              className={`btn-tactile flex h-11 min-w-[96px] items-center justify-center rounded-xl px-4 text-sm font-extrabold whitespace-nowrap shrink-0 cursor-pointer ${
                sfxEnabled
                  ? 'bg-[#1F8A4C] text-white'
                  : 'bg-[#E7D8BE] text-[#5C432C]'
              }`}
            >
              {sfxEnabled
                ? pickLang(languageMode, 'Aktif', 'On')
                : pickLang(languageMode, 'Mati', 'Off')}
            </button>
          </div>

          {/* 3. Language Mode Selector */}
          <div className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#DFC398] bg-[#FAF0DC] text-[#C87D20]">
                <Globe className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-base font-extrabold text-[#2D1F14] leading-tight">
                  {pickLang(languageMode, 'Bahasa', 'Language')}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-[#68503B]">
                  {pickLang(languageMode, activeLangOption.descId, activeLangOption.descEn)}
                </p>
              </div>
            </div>

            <div
              className="storybook-wood-tray mt-3 grid grid-cols-2 gap-1.5 rounded-xl p-1"
              role="radiogroup"
              aria-label={pickLang(languageMode, 'Pilih bahasa', 'Select language')}
            >
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = languageMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChangeLanguage(opt.id)}
                    className={`h-11 rounded-lg px-2 text-xs font-extrabold transition-colors sm:text-sm whitespace-nowrap cursor-pointer ${
                      active
                        ? 'btn-tactile bg-[#D97706] text-white'
                        : 'text-[#5C3D21] hover:text-[#2D1F14]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Confirm Button */}
        <div className="border-t border-[#E3CCA6] bg-[#FAF1E0]/85 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#1F8A4C] px-6 text-base font-extrabold text-white whitespace-nowrap cursor-pointer"
          >
            {pickLang(languageMode, 'Selesai', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
}
