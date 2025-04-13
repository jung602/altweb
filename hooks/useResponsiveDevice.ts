import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { debounce } from 'lodash';

// 기기 정보 인터페이스
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
}

// 창 크기 인터페이스
export interface WindowSize {
  width: number;
  height: number;
  viewportWidth: number;  // 실제 뷰포트 너비
  viewportHeight: number; // 실제 뷰포트 높이
  pixelRatio: number;    // 디바이스 픽셀 비율
}

// 반응형 정보 인터페이스
export interface ResponsiveInfo extends WindowSize, DeviceInfo {
  // 반응형 계산 함수들
  getPositionYOffset: () => number;
  getScaleFactor: () => number;
  getBaseSize: () => number;
  getResponsiveScale: (baseScale: number) => number;
  getResponsivePosition: (basePosition: [number, number, number]) => [number, number, number];
}

/**
 * 정확한 뷰포트 크기를 측정하는 함수
 */
function measureViewportSize(): { width: number; height: number } {
  if (typeof document === 'undefined') {
    return { width: 0, height: 0 };
  }

  // 임시 div 요소 생성
  const sizeViewport = document.createElement('div');
  sizeViewport.style.width = '100vw';
  sizeViewport.style.height = '100vh';
  sizeViewport.style.position = 'absolute';
  sizeViewport.style.top = '0';
  sizeViewport.style.left = '0';
  sizeViewport.style.pointerEvents = 'none';
  sizeViewport.style.visibility = 'hidden';

  // DOM에 추가하여 측정
  document.body.appendChild(sizeViewport);
  const size = {
    width: sizeViewport.offsetWidth,
    height: sizeViewport.offsetHeight
  };
  document.body.removeChild(sizeViewport);

  return size;
}

/**
 * 통합된 반응형 기기 및 창 크기 감지 훅
 * @param debounceTime - 디바운스 시간(ms)
 * @returns 통합된 반응형 정보
 */
export function useResponsiveDevice(debounceTime = 100): ResponsiveInfo {
  // 창 크기 상태
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    const viewport = measureViewportSize();
    return {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      pixelRatio: typeof window !== 'undefined' ? 
        Math.min(window.devicePixelRatio || 1, 2) : 1
    };
  });

  // 기기 정보 상태
  const deviceInfo = useRef<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: ''
  });

  // 리사이즈 이벤트 최적화를 위한 RAF
  const rafId = useRef<number>();
  const isResizing = useRef<boolean>(false);

  // 디바운스된 리사이즈 핸들러
  const debouncedResize = useMemo(
    () => debounce(() => {
      if (typeof window === 'undefined') return;

      const viewport = measureViewportSize();
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2)
      });
      isResizing.current = false;
    }, debounceTime),
    [debounceTime]
  );

  // RAF를 사용한 리사이즈 핸들러
  const handleResize = useCallback(() => {
    if (!isResizing.current) {
      isResizing.current = true;
      rafId.current = requestAnimationFrame(() => {
        debouncedResize();
      });
    }
  }, [debouncedResize]);

  // 창 크기 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', handleResize, { passive: true });
    
    // 초기 크기 설정
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      debouncedResize.cancel();
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleResize, debouncedResize]);

  // 기기 유형 감지
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const userAgent = navigator.userAgent;
    
    // 모바일 기기 감지
    const isMobileDevice = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // 태블릿 감지 (iPad 또는 큰 화면의 Android 기기)
    const isTabletDevice = /iPad/i.test(userAgent) || 
      (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent));
    
    deviceInfo.current = {
      isMobile: isMobileDevice && !isTabletDevice,
      isTablet: isTabletDevice,
      isDesktop: !isMobileDevice && !isTabletDevice,
      userAgent
    };
  }, []);

  // 화면 너비에 따른 Y축 위치 오프셋 계산
  const getPositionYOffset = useCallback((): number => {
    const { viewportWidth } = windowSize;
    if (viewportWidth > 1440) return -0.3;     // 데스크탑 큰 화면
    if (viewportWidth > 1024) return -0.2;     // 데스크탑
    if (viewportWidth > 768) return -0.1;      // 태블릿
    if (viewportWidth > 480) return 0;         // 큰 모바일
    return 0;                                  // 작은 모바일
  }, [windowSize.viewportWidth]);

  // 화면 너비에 따른 스케일 팩터 계산
  const getScaleFactor = useCallback((): number => {
    const { viewportWidth } = windowSize;
    if (viewportWidth > 1440) return 1.2;      // 데스크탑 큰 화면
    if (viewportWidth > 1024) return 1.05;     // 데스크탑
    if (viewportWidth > 768) return 0.9;       // 태블릿
    if (viewportWidth > 480) return 0.8;       // 큰 모바일
    return 0.7;                               // 작은 모바일
  }, [windowSize.viewportWidth]);

  // 화면 크기에 따른 기본 크기 계산
  const getBaseSize = useCallback((): number => {
    const { viewportWidth, viewportHeight } = windowSize;
    return Math.min(viewportWidth, viewportHeight) * 0.8;
  }, [windowSize.viewportWidth, windowSize.viewportHeight]);

  // 화면 크기에 따라 스케일을 조정
  const getResponsiveScale = useCallback((baseScale: number): number => {
    const scaleFactor = getScaleFactor();
    return baseScale * scaleFactor;
  }, [getScaleFactor]);

  // 화면 크기에 따라 위치를 조정
  const getResponsivePosition = useCallback((basePosition: [number, number, number]): [number, number, number] => {
    const yOffset = getPositionYOffset();
    return [
      basePosition[0],
      basePosition[1] + yOffset,
      basePosition[2]
    ];
  }, [getPositionYOffset]);

  // 통합된 반응형 정보 반환
  return {
    ...windowSize,
    ...deviceInfo.current,
    getPositionYOffset,
    getScaleFactor,
    getBaseSize,
    getResponsiveScale,
    getResponsivePosition
  };
} 