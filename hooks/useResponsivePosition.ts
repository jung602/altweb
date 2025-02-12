import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';

const getPositionYOffset = (width: number): number => {
  if (width > 1440) return -0.3;     // 데스크탑 큰 화면
  if (width > 1024) return -0.2;     // 데스크탑
  if (width > 768) return -0.1;      // 태블릿
  if (width > 480) return 0;         // 큰 모바일
  return 0;                          // 작은 모바일
};

export const useResponsivePosition = (basePosition: [number, number, number]) => {
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

  const position = useMemo(() => {
    const yOffset = getPositionYOffset(windowWidth);
    return [
      basePosition[0], 
      basePosition[1] + yOffset,  // 기존 Y값에 offset을 더함
      basePosition[2]
    ] as [number, number, number];
  }, [basePosition, windowWidth]);

  return position;
}; 