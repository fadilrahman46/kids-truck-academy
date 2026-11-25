import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed top-16 left-4 z-40 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-500 px-3.5 py-2 text-xs font-extrabold text-white shadow-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Mode Offline · Offline Mode</span>
    </div>
  );
}
