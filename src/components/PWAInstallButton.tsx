import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="btn-tactile flex h-10 items-center gap-1.5 rounded-xl bg-[#2563EB] px-3 text-xs font-extrabold text-white sm:px-3.5 sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
        aria-label="Pasang aplikasi Kota Kendaraan Ceria 3D"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span className="hidden md:inline">Pasang App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="btn-wood-secondary flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-extrabold sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
          aria-label="Cara pasang di iPhone atau iPad"
        >
          <Share className="h-4 w-4 shrink-0 text-[#2563EB]" />
          <span className="hidden md:inline">Pasang iOS</span>
        </button>

        {showIOSGuide && (
          <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-[#2D1F14]/50 p-4">
            <div className="animate-pop-in storybook-paper w-full max-w-sm rounded-3xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-extrabold text-[#2D1F14]">
                    Pasang di iPhone / iPad
                  </h3>
                  <p className="text-xs font-semibold text-[#68503B]">
                    Install on iOS Safari
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="btn-wood-secondary flex h-9 w-9 items-center justify-center rounded-xl cursor-pointer"
                  aria-label="Tutup panduan"
                >
                  <X className="h-4 w-4 text-[#4A2E14]" />
                </button>
              </div>

              <ol className="mt-4 space-y-2.5 text-sm font-medium text-[#4A321F]">
                <li>
                  1. Ketuk tombol <strong className="text-[#2D1F14]">Bagikan (Share)</strong> di bilah Safari.
                </li>
                <li>
                  2. Gulir ke bawah lalu pilih <strong className="text-[#2D1F14]">Tambah ke Layar Utama (Add to Home Screen)</strong>.
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="btn-tactile mt-5 w-full rounded-xl bg-[#2563EB] py-3 text-sm font-extrabold text-white cursor-pointer"
              >
                Mengerti · Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
