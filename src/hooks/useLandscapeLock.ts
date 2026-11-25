import { useCallback, useEffect, useState } from 'react';

export function useLandscapeLock() {
  const checkPortrait = () => {
    if (typeof window === 'undefined') return false;
    // Trigger landscape prompt when viewport is taller than wide
    return window.innerHeight > window.innerWidth;
  };

  const [isPortrait, setIsPortrait] = useState<boolean>(checkPortrait);

  const lockLandscape = useCallback(async (withFullscreen = false) => {
    try {
      if (withFullscreen && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen may be declined or unsupported on iOS Safari
    }

    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: 'landscape') => Promise<void>;
      };
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('landscape');
      }
    } catch {
      // Screen Orientation API lock requires fullscreen or installed PWA on many browsers
    }
  }, []);

  useEffect(() => {
    // Best-effort silent lock attempt on mount (succeeds in installed PWA mode)
    void lockLandscape(false);

    const handleChange = () => {
      setIsPortrait(checkPortrait());
    };

    const mql = window.matchMedia('(orientation: portrait)');
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);
    mql.addEventListener('change', handleChange);

    return () => {
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
      mql.removeEventListener('change', handleChange);
    };
  }, [lockLandscape]);

  return {
    isPortrait,
    lockLandscape,
  };
}
