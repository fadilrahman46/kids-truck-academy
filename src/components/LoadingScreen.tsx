import { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { pickLang, VEHICLES, type LanguageMode } from '../types/game';
import { START_TOWN_PANORAMA_URL } from '../assets/storybookArt';
import { PWAInstallButton } from './PWAInstallButton';
import { TruckIllustration } from './TruckIllustration';

interface LoadingScreenProps {
  progress: number;
  engineReady: boolean;
  languageMode: LanguageMode;
  onStartGame: () => void;
}

export function LoadingScreen({
  progress,
  engineReady,
  languageMode,
  onStartGame,
}: LoadingScreenProps) {
  const [bgFailed, setBgFailed] = useState(false);
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

  const primaryStatus = languageMode === 'en' ? statusEn : statusId;

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#BFE2FA] via-[#F4EBD7] to-[#8BC66B] p-4 sm:p-6">
      {/* Full-bleed 2D Realistic Children's Picture-Book Town Panorama */}
      {!bgFailed && (
        <img
          src={START_TOWN_PANORAMA_URL}
          alt="Ilustrasi Kota Kendaraan Ceria"
          referrerPolicy="no-referrer"
          onError={() => setBgFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Measured Warm Sunlight Contrast Scrim */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#2D1F14]/20 via-[#2D1F14]/15 to-[#2D1F14]/45"
        aria-hidden="true"
      />

      {/* Warm Cotton-Paper & Honey-Oak Storybook Title Card */}
      <div className="storybook-paper animate-pop-in relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col items-center overflow-y-auto rounded-3xl p-5 text-center sm:p-7">
        {/* Mini Realistic Picture-Book Fleet Showcase Strip */}
        <div className="mt-1 flex items-center justify-center gap-1.5 sm:gap-2">
          {VEHICLES.slice(0, 3).map((v) => (
            <div
              key={v.id}
              className="storybook-card flex h-14 w-14 items-center justify-center rounded-2xl p-1 sm:h-16 sm:w-16"
            >
              <TruckIllustration vehicleId={v.id} className="h-full w-full" />
            </div>
          ))}
          {VEHICLES.slice(3, 6).map((v) => (
            <div
              key={v.id}
              className="storybook-card hidden h-14 w-14 items-center justify-center rounded-2xl p-1 sm:flex sm:h-16 sm:w-16"
            >
              <TruckIllustration vehicleId={v.id} className="h-full w-full" />
            </div>
          ))}
        </div>

        <h1 className="font-display mt-3.5 text-2xl font-extrabold tracking-tight text-[#2D1F14] sm:text-4xl [text-wrap:balance]">
          {languageMode === 'en' ? 'Cheerful Vehicle Town 3D' : 'Kota Kendaraan Ceria 3D'}
        </h1>
        <p className="mt-1 text-xs font-bold text-[#7A4B21] sm:text-sm">
          {languageMode === 'en'
            ? 'Picture Book & 6 Educational 3D Trucks · Ages 2–6'
            : 'Buku Cerita & Simulasi 6 Truk Edukatif · Usia 2–6 Tahun'}
        </p>

        {/* Painted Storybook Progress Ribbon */}
        <div className="mt-4 w-full sm:mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-[#4A3523] sm:text-sm">
            <span>{primaryStatus}</span>
            <span className="font-display text-[#8B5A2B] tabular-nums">{pct}%</span>
          </div>

          <div className="storybook-wood-tray h-5 w-full overflow-hidden rounded-full p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D97706] via-[#EAB308] to-[#16A34A] transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>

          {languageMode === 'bilingual' && (
            <p className="mt-1.5 text-xs font-semibold text-[#6E5640]">{statusEn}</p>
          )}
        </div>

        {/* Tactile Wooden Action Area */}
        <div className="mt-5 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {isReady ? (
            <button
              type="button"
              onClick={onStartGame}
              className="btn-tactile flex min-h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1F8A4C] px-8 text-lg font-extrabold text-white sm:w-auto cursor-pointer whitespace-nowrap"
            >
              <Play className="h-6 w-6 fill-white" />
              <span>{pickLang(languageMode, 'Mulai Bermain!', 'Start')}</span>
            </button>
          ) : (
            <div className="flex min-h-[58px] items-center gap-2 text-sm font-bold text-[#6E5640]">
              <Sparkles className="h-5 w-5 text-[#D97706]" />
              <span>{pickLang(languageMode, 'Mohon tunggu sebentar...', 'Please wait a moment...')}</span>
            </div>
          )}

          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
}
