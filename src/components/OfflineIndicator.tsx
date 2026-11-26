import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { pickLang, type LanguageMode } from '../types/game';

interface OfflineIndicatorProps {
  languageMode?: LanguageMode;
}

export function OfflineIndicator({ languageMode = 'bilingual' }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed top-16 left-4 z-40 flex items-center gap-2 rounded-xl border-2 border-[#8A5A28] bg-[#B86A1E] px-3.5 py-2 text-xs font-extrabold text-[#FFFDF8] shadow-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>{pickLang(languageMode, 'Mode Offline', 'Offline Mode')}</span>
    </div>
  );
}
