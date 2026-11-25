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
        className="flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 hover:bg-blue-700 sm:px-3.5 sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
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
          className="flex h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-800 transition-transform active:scale-95 hover:bg-blue-100 sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
          aria-label="Cara pasang di iPhone atau iPad"
        >
          <Share className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline">Pasang iOS</span>
        </button>

        {showIOSGuide && (
          <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
            <div className="animate-pop-in w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-extrabold text-slate-900">
                    Pasang di iPhone / iPad
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Install on iOS Safari
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  aria-label="Tutup panduan"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ol className="mt-4 space-y-2.5 text-sm font-medium text-slate-700">
                <li>
                  1. Ketuk tombol <strong>Bagikan (Share)</strong> di bilah Safari.
                </li>
                <li>
                  2. Gulir ke bawah lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-extrabold text-white transition-transform active:scale-95 hover:bg-blue-700 cursor-pointer"
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
