import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';

const getScaleFactor = (width: number): number => {
  if (width > 1440) return 1.6;      // 데스크탑 큰 화면
  if (width > 1024) return 1.3;      // 데스크탑
  if (width > 768) return 1.2;       // 태블릿
  if (width > 480) return 1;         // 큰 모바일
  return 1;                        // 작은 모바일
};

export const useResponsiveScale = (baseScale: number) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const debouncedResize = useMemo(
    () => debounce((width: number) => {
      setWindowWidth(width);
    }, 100),
    []
  );

  useEffect(() => {
    const handleResize = () => {
      debouncedResize(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      debouncedResize.cancel();
    };
  }, [debouncedResize]);

  const scale = useMemo(() => {
    const scaleFactor = getScaleFactor(windowWidth);
    return baseScale * scaleFactor;
  }, [baseScale, windowWidth]);

  return scale;
}; 