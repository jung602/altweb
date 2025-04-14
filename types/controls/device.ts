/**
 * 윈도우 크기 정보 인터페이스
 */
export interface WindowSize {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * 디바이스 정보 인터페이스
 */
export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
}

/**
 * 반응형 정보 인터페이스
 */
export interface ResponsiveInfo extends WindowSize, DeviceInfo {
  pixelRatio: number;
  isTouch: boolean;
}

/**
 * 디바이스 네비게이션 훅 옵션 인터페이스
 */
export interface UseDeviceNavigationOptions {
  disableOverscroll?: boolean;
  disableZoom?: boolean;
  disableRightClick?: boolean;
  disableContextMenu?: boolean;
}

/**
 * 디바이스 네비게이션 훅 결과 인터페이스
 */
export interface UseDeviceNavigationResult {
  hasAppliedOverscroll: boolean;
  hasAppliedZoom: boolean;
  hasAppliedRightClick: boolean;
  hasAppliedContextMenu: boolean;
} 