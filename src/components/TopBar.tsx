import { ArrowLeft, Settings, Star, Trophy } from 'lucide-react';
import { pickLang, type AgeMode, type LanguageMode, type ViewMode } from '../types/game';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  viewMode: ViewMode;
  ageMode: AgeMode;
  languageMode: LanguageMode;
  totalStars: number;
  onBackToGarage: () => void;
  onChangeAgeMode: (mode: AgeMode) => void;
  onOpenStickerBook: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  viewMode,
  ageMode,
  languageMode,
  totalStars,
  onBackToGarage,
  onChangeAgeMode,
  onOpenStickerBook,
  onOpenSettings,
}: TopBarProps) {
  return (
    <header className="storybook-wood-bar compact-topbar pointer-events-auto relative z-20 flex items-center justify-between gap-2 px-2.5 py-2 sm:gap-4 sm:px-6 sm:py-2.5 lg:gap-8">
      {/* Zone 1: Brand Title / Back to Garage */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
        {viewMode === 'MISSION' && (
          <button
            type="button"
            onClick={onBackToGarage}
            className="btn-wood-secondary flex h-9 sm:h-10 items-center gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm font-extrabold whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={pickLang(languageMode, 'Kembali ke Garasi', 'Back to Garage')}
          >
            <ArrowLeft className="h-4 w-4 text-[#7A4B21]" />
            <span>{languageMode === 'en' ? 'Garage' : 'Garasi'}</span>
          </button>
        )}
        <h1
          className={`font-display text-sm font-extrabold tracking-tight text-[#2D1F14] sm:text-lg lg:text-xl min-w-0 truncate ${
            viewMode === 'MISSION' ? 'hidden md:block' : 'block'
          }`}
        >
          {languageMode === 'en' ? 'Cheerful Vehicle Town 3D' : 'Kota Kendaraan Ceria 3D'}
        </h1>
      </div>

      {/* Zone 2: Carved Honey-Oak Age Difficulty Segmented Tray */}
      <div
        className="storybook-wood-tray flex items-center gap-1 rounded-xl p-0.5 sm:p-1 shrink-0"
        role="group"
        aria-label={pickLang(languageMode, 'Pilih mode usia', 'Select age mode')}
      >
        <button
          type="button"
          onClick={() => onChangeAgeMode('toddler')}
          className={`h-8 sm:h-9 rounded-lg px-2 sm:px-3.5 text-[11px] sm:text-sm font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            ageMode === 'toddler'
              ? 'btn-tactile bg-[#D97706] text-white'
              : 'text-[#5C3D21] hover:text-[#2D1F14]'
          }`}
        >
          {languageMode === 'en' ? 'Toddler 2–3' : 'Balita 2–3'}
        </button>
        <button
          type="button"
          onClick={() => onChangeAgeMode('preschool')}
          className={`h-8 sm:h-9 rounded-lg px-2 sm:px-3.5 text-[11px] sm:text-sm font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            ageMode === 'preschool'
              ? 'btn-tactile bg-[#2563EB] text-white'
              : 'text-[#5C3D21] hover:text-[#2D1F14]'
          }`}
        >
          {languageMode === 'en' ? 'Preschool 4–6' : 'Prasekolah 4–6'}
        </button>
      </div>

      {/* Zone 3: Sticker Book Album Trigger, Install & Settings Button */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenStickerBook}
          className="btn-wood-secondary flex h-9 sm:h-10 items-center gap-1 sm:gap-1.5 rounded-xl px-2.5 sm:px-3 text-xs sm:text-sm font-extrabold text-[#5E3915] tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
          title={pickLang(languageMode, 'Buka Buku Stiker & Trofi', 'Open Sticker Book & Trophies')}
          aria-label={pickLang(
            languageMode,
            `Buka Buku Stiker dan Trofi, total bintang ${totalStars}`,
            `Open Sticker Book, total stars ${totalStars}`,
          )}
        >
          <Star className="h-4 w-4 fill-[#F59E0B] text-[#B45309]" />
          <span>{totalStars}</span>
          <Trophy className="hidden h-4 w-4 text-[#B45309] sm:inline" />
          <span className="hidden text-xs font-extrabold text-[#6E441A] md:inline">
            {languageMode === 'en' ? 'Stickers' : 'Stiker'}
          </span>
        </button>

        <PWAInstallButton />

        <button
          type="button"
          onClick={onOpenSettings}
          className="btn-tactile flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-[#B86A1E] px-2.5 sm:px-3.5 text-xs sm:text-sm font-extrabold text-[#FFFDF8] whitespace-nowrap shrink-0 cursor-pointer"
          title={pickLang(languageMode, 'Pengaturan (Musik, Efek Suara, Bahasa)', 'Settings (Music, Sound FX, Language)')}
          aria-label={pickLang(languageMode, 'Buka Pengaturan', 'Open Settings')}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline">
            {languageMode === 'en' ? 'Settings' : 'Pengaturan'}
          </span>
        </button>
      </div>
    </header>
  );
}
