import * as THREE from 'three';

/**
 * 기본 카메라 설정
 */
export const DEFAULT_CAMERA_CONFIG = {
  position: [5 * 29, 6.5 * 29, -10 * 29] as [number, number, number],
  fov: 1,
  near: 100,
  far: 1000,
  zoom: 1
};

/**
 * 확장 모드 카메라 설정
 */
export const EXPANDED_CAMERA_CONFIG = {
  ...DEFAULT_CAMERA_CONFIG,
  // 확장 모드에서 필요한 추가 설정이 있다면 여기에 추가
};

/**
 * 카메라 설정을 가져오는 함수
 * @param isExpanded - 확장 모드 여부
 * @returns 적절한 카메라 설정
 */
export const getCameraConfig = (isExpanded: boolean) => {
  return isExpanded ? EXPANDED_CAMERA_CONFIG : DEFAULT_CAMERA_CONFIG;
};

/**
 * OrbitControls 기본 설정
 */
export const ORBIT_CONTROLS_CONFIG = {
  MIN_POLAR_ANGLE: Math.PI / 3,
  MAX_POLAR_ANGLE: Math.PI,
  MIN_AZIMUTH_ANGLE: -Infinity,
  MAX_AZIMUTH_ANGLE: Infinity,
  MIN_DISTANCE: 380 * 0.8,
  MAX_DISTANCE: 380 * 1.3,
  ZOOM_SCALE: {
    MIN: 0.8,
    MAX: 1.3
  }
};

/**
 * 렌더러 설정
 */
export const RENDERER_CONFIG = {
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1
};

/**
 * 렌더러를 설정하는 함수
 * @param gl - WebGLRenderer 인스턴스
 */
export const setupRenderer = (gl: THREE.WebGLRenderer) => {
  gl.toneMapping = RENDERER_CONFIG.toneMapping;
  gl.toneMappingExposure = RENDERER_CONFIG.toneMappingExposure;
}; 