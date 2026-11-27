import { Award, CheckCircle2, Lock, Play, Star, Trophy, Volume2, X } from 'lucide-react';
import { pickLang, VEHICLES, type LanguageMode, type VehicleId } from '../types/game';
import { TruckIllustration } from './TruckIllustration';

interface StickerBookModalProps {
  starsByTruck: Record<VehicleId, number>;
  languageMode: LanguageMode;
  onClose: () => void;
  onPlayTruck: (id: VehicleId) => void;
  onHonkTruck: (id: VehicleId) => void;
}

const SKILL_META: Record<
  VehicleId,
  { skillId: string; skillEn: string; detailId: string; detailEn: string }
> = {
  molen: {
    skillId: 'Warna & Campuran',
    skillEn: 'Colors & Mixing',
    detailId: 'Mengenal warna primer, mencampur warna, dan membangun bentuk 3D',
    detailEn: 'Learn primary colors, mix paints, and construct 3D shapes',
  },
  angkut: {
    skillId: 'Angka & Berhitung',
    skillEn: 'Numbers & Counting',
    detailId: 'Memilih muatan dan berhitung 1–10 secara visual',
    detailEn: 'Pick cargo items and practice visual counting from 1 to 10',
  },
  tangki: {
    skillId: 'Logika Pipa Air',
    skillEn: 'Pipe & Spatial Logic',
    detailId: 'Memutar sambungan pipa untuk mengalirkan air ke tangki',
    detailEn: 'Rotate pipe joints to guide water flow into the tanker',
  },
  crane: {
    skillId: 'Hitung & Keseimbangan',
    skillEn: 'Count & Balance',
    detailId: 'Menghitung peti lalu menyeimbangkan beban pada titik tengah',
    detailEn: 'Count crates and balance the crane boom over the center target',
  },
  pemadam: {
    skillId: 'Huruf A–Z & Tanggap Api',
    skillEn: 'Alphabet & Fire Safety',
    detailId: 'Mengenali huruf A–Z dwibahasa dan mengarahkan selang air',
    detailEn: 'Recognize A–Z letters and aim the water hose at flames',
  },
  sampah: {
    skillId: 'Pilah Sampah & Hitung',
    skillEn: 'Waste Sorting & Counting',
    detailId: 'Memilah sampah organik/non-organik dan menghitung isi tong',
    detailEn: 'Sort organic vs. non-organic waste and count bin totals',
  },
  ekskavator: {
    skillId: 'Bentuk & Gali',
    skillEn: 'Shapes & Digging',
    detailId: 'Menggali batu bentuk geometri dan mencocokkannya pada cetakan',
    detailEn: 'Dig up geometric shape stones and match them to carved sockets',
  },
  bus: {
    skillId: 'Lampu Lalu Lintas & Pola',
    skillEn: 'Traffic Lights & Patterns',
    detailId: 'Mematuhi lampu lalu lintas dan melengkapi pola warna penumpang',
    detailEn: 'Follow traffic light rules and complete visual color patterns',
  },
};

function getStickerRank(stars: number): { labelId: string; labelEn: string } {
  if (stars >= 5) return { labelId: 'Super Bintang', labelEn: 'Super Star' };
  if (stars >= 3) return { labelId: 'Jagoan', labelEn: 'Champion' };
  return { labelId: 'Terbuka', labelEn: 'Unlocked' };
}

export function StickerBookModal({
  starsByTruck,
  languageMode,
  onClose,
  onPlayTruck,
  onHonkTruck,
}: StickerBookModalProps) {
  const totalStars = Object.values(starsByTruck).reduce((sum, n) => sum + n, 0);
  const unlockedCount = VEHICLES.filter((v) => (starsByTruck[v.id] || 0) > 0).length;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-[#2D1F14]/50 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sticker-book-title"
    >
      <div className="animate-pop-in storybook-paper flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl">
        {/* Carved Honey-Oak Storybook Header */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#CFA772] bg-gradient-to-b from-[#FFF9EC] to-[#F3E3C4] px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="btn-tactile flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAB308] text-[#3B2208]">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2
                id="sticker-book-title"
                className="font-display text-lg font-extrabold text-[#2D1F14] sm:text-xl truncate"
              >
                {pickLang(languageMode, 'Buku Stiker & Trofi', 'Sticker Book & Trophies')}
              </h2>
              <p className="text-xs font-semibold text-[#68503B] tabular-nums">
                {languageMode === 'en'
                  ? `${unlockedCount}/${VEHICLES.length} Vehicle Stickers Unlocked · ${totalStars} Total Stars`
                  : `${unlockedCount}/${VEHICLES.length} Stiker Kendaraan Terbuka · ${totalStars} Total Bintang`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-wood-secondary flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-extrabold shrink-0 cursor-pointer"
            aria-label={pickLang(languageMode, 'Tutup Buku Stiker', 'Close Sticker Book')}
          >
            <X className="h-4 w-4 text-[#4A2E14]" />
            <span className="hidden sm:inline">{languageMode === 'en' ? 'Close' : 'Tutup'}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {/* Section 1: Vehicle Picture-Book Sticker Album */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-display flex items-center gap-2 text-base font-extrabold text-[#2D1F14]">
                <Award className="h-5 w-5 text-[#C87D20]" />
                <span>{pickLang(languageMode, 'Koleksi Stiker Kendaraan', 'Vehicle Stickers')}</span>
              </h3>
              <span className="text-xs font-extrabold text-[#9A5814] tabular-nums">
                {unlockedCount} / {VEHICLES.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {VEHICLES.map((v) => {
                const stars = starsByTruck[v.id] || 0;
                const unlocked = stars > 0;
                const rank = getStickerRank(stars);

                return (
                  <div
                    key={v.id}
                    className={`flex flex-col justify-between rounded-2xl p-3 transition-transform ${
                      unlocked
                        ? 'storybook-card border-2'
                        : 'border-2 border-dashed border-[#D6BE99] bg-[#F6ECDA]/85'
                    }`}
                    style={unlocked ? { borderColor: v.accentHex } : undefined}
                  >
                    {/* Large 2D Picture-Book Portrait */}
                    <div className="relative">
                      <TruckIllustration
                        vehicleId={v.id}
                        locked={!unlocked}
                        className="h-24 w-full border border-[#E5D0AE] sm:h-28"
                      />
                      <span className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-lg border border-[#DFC398] bg-[#FFFDF8]/95 px-2 py-0.5 text-xs font-extrabold text-[#2D1F14] shadow-xs tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-600" />
                        {stars}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="font-display text-sm font-extrabold text-[#2D1F14] leading-tight">
                          {languageMode === 'en' ? v.nameEn : v.nameId}
                        </div>
                        {languageMode === 'bilingual' && (
                          <div className="text-xs font-semibold text-[#68503B] leading-tight">
                            {v.nameEn}
                          </div>
                        )}
                      </div>
                      {unlocked ? (
                        <span className="shrink-0 text-[11px] font-extrabold text-emerald-800">
                          {languageMode === 'en' ? rank.labelEn : rank.labelId}
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-bold text-[#7A614B]">
                          <Lock className="h-3 w-3" />
                          {languageMode === 'en' ? 'Locked' : 'Terkunci'}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPlayTruck(v.id)}
                        className="btn-tactile flex flex-1 min-h-[38px] items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-extrabold text-white whitespace-nowrap cursor-pointer"
                        style={{ backgroundColor: v.accentHex }}
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>
                          {unlocked
                            ? languageMode === 'en'
                              ? 'Play Again'
                              : 'Main Lagi'
                            : languageMode === 'en'
                              ? 'Unlock'
                              : 'Buka Stiker'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onHonkTruck(v.id)}
                        className="btn-wood-secondary flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl cursor-pointer"
                        title={
                          languageMode === 'en'
                            ? `Honk ${v.nameEn}`
                            : `Dengar suara ${v.nameId}`
                        }
                        aria-label={
                          languageMode === 'en'
                            ? `Honk ${v.nameEn}`
                            : `Dengar suara ${v.nameId}`
                        }
                      >
                        <Volume2 className="h-4 w-4 text-[#5A3A1E]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Parent Summary of Practiced Skills */}
          <section className="rounded-2xl border-2 border-[#D8BF97] bg-[#F5EAD6]/90 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-extrabold text-[#2D1F14] sm:text-base">
                  {pickLang(languageMode, 'Ringkasan Kemampuan Belajar', 'Learning Summary')}
                </h3>
                <p className="text-xs font-medium text-[#68503B]">
                  {languageMode === 'en'
                    ? 'Learning progress is saved automatically offline on this device.'
                    : 'Perkembangan latihan anak tersimpan otomatis secara offline di perangkat ini.'}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                {languageMode === 'en' ? 'Saved Offline' : 'Tersimpan Offline'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {VEHICLES.map((v) => {
                const stars = starsByTruck[v.id] || 0;
                const skill = SKILL_META[v.id];
                const pct = Math.min(100, Math.round((stars / 5) * 100));

                return (
                  <div
                    key={v.id}
                    className="storybook-card rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-xs font-extrabold text-[#2D1F14]">
                        {languageMode === 'en' ? skill.skillEn : skill.skillId}
                        {languageMode === 'bilingual' && (
                          <span className="font-sans font-semibold text-[#68503B]">
                            {' '}· {skill.skillEn}
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-extrabold text-[#4A321F] tabular-nums shrink-0">
                        {languageMode === 'en' ? `${stars}× done` : `${stars}× selesai`}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-[#68503B] leading-snug">
                      {languageMode === 'en' ? skill.detailEn : skill.detailId}
                    </p>
                    <div className="storybook-wood-tray mt-2 h-2.5 w-full overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: v.accentHex }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
