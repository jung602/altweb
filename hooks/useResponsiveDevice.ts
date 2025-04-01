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
 * 통합된 반응형 기기 및 창 크기 감지 훅
 * @param debounceTime - 디바운스 시간(ms)
 * @returns 통합된 반응형 정보
 */
export function useResponsiveDevice(debounceTime = 100): ResponsiveInfo {
  // 창 크기 상태
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // 기기 정보 상태
  const deviceInfo = useRef<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: ''
  });

  // 디바운스된 리사이즈 핸들러
  const debouncedResize = useMemo(
    () => debounce((width: number, height: number) => {
      setWindowSize({ width, height });
    }, debounceTime),
    [debounceTime]
  );

  // 창 크기 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      debouncedResize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    
    // 초기 크기 설정
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      debouncedResize.cancel();
    };
  }, [debouncedResize]);

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
    const { width } = windowSize;
    if (width > 1440) return -0.3;     // 데스크탑 큰 화면
    if (width > 1024) return -0.2;     // 데스크탑
    if (width > 768) return -0.1;      // 태블릿
    if (width > 480) return 0;         // 큰 모바일
    return 0;                          // 작은 모바일
  }, [windowSize.width]);

  // 화면 너비에 따른 스케일 팩터 계산
  const getScaleFactor = useCallback((): number => {
    const { width } = windowSize;
    if (width > 1440) return 1.6;      // 데스크탑 큰 화면
    if (width > 1024) return 1.3;      // 데스크탑
    if (width > 768) return 1.2;       // 태블릿
    if (width > 480) return 1;         // 큰 모바일
    return 1;                          // 작은 모바일
  }, [windowSize.width]);

  // 화면 크기에 따른 기본 크기 계산
  const getBaseSize = useCallback((): number => {
    const { width, height } = windowSize;
    return Math.min(width, height) * 0.8;
  }, [windowSize.width, windowSize.height]);

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
      basePosition[1] + yOffset,  // 기존 Y값에 offset을 더함
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