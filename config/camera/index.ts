// config/camera/index.ts
import { applyEnvironmentConfig, EnvironmentConfig } from '../environment';
import { CameraConfig, OrbitControlsConfig } from '../types';
import { DEFAULT_CAMERA_CONFIG as BASE_DEFAULT_CAMERA_CONFIG } from './default';
import { EXPANDED_CAMERA_CONFIG as BASE_EXPANDED_CAMERA_CONFIG } from './expanded';
import { ORBIT_CONTROLS_CONFIG as BASE_ORBIT_CONTROLS_CONFIG } from './controls';

// 기본 카메라 설정에 환경별 설정 적용
const defaultCameraConfig: EnvironmentConfig<CameraConfig> = {
  default: BASE_DEFAULT_CAMERA_CONFIG,
  development: {
    // 개발 환경에서 필요한 경우 설정 오버라이드
  },
  production: {
    // 프로덕션 환경에서는 최적화된 설정 사용
    near: 150,
    far: 800
  }
};

// 확장 모드 카메라 설정에 환경별 설정 적용
const expandedCameraConfig: EnvironmentConfig<CameraConfig> = {
  default: BASE_EXPANDED_CAMERA_CONFIG,
  development: {
    // 개발 환경에서 필요한 경우 설정 오버라이드
  },
  production: {
    // 프로덕션 환경에서는 최적화된 설정 사용
    near: 150,
    far: 800
  }
};

// OrbitControls 설정에 환경별 설정 적용
const orbitControlsConfig: EnvironmentConfig<OrbitControlsConfig> = {
  default: BASE_ORBIT_CONTROLS_CONFIG,
  development: {
    // 개발 환경에서는 더 넓은 범위의 컨트롤 허용
    MIN_POLAR_ANGLE: Math.PI / 4,
    MAX_POLAR_ANGLE: Math.PI * 0.9
  },
  production: {
    // 프로덕션 환경에서는 제한된 컨트롤 설정
  }
};

// 환경별 설정이 적용된 최종 설정 내보내기
export const DEFAULT_CAMERA_CONFIG = applyEnvironmentConfig(defaultCameraConfig);
export const EXPANDED_CAMERA_CONFIG = applyEnvironmentConfig(expandedCameraConfig);
export const ORBIT_CONTROLS_CONFIG = applyEnvironmentConfig(orbitControlsConfig);

/**
 * 카메라 설정을 가져오는 함수
 * @param isExpanded - 확장 모드 여부
 * @returns 적절한 카메라 설정
 */
export const getCameraConfig = (isExpanded: boolean): CameraConfig => {
  return isExpanded ? EXPANDED_CAMERA_CONFIG : DEFAULT_CAMERA_CONFIG;
}; 