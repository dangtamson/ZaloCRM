import { useEffect, useState } from 'react';

export function useMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpointPx;
  });

  useEffect(() => {
    function update(): void {
      setIsMobile(window.innerWidth < breakpointPx);
    }

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [breakpointPx]);

  return isMobile;
}
