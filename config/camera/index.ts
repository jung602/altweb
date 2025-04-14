// config/camera/index.ts

export { DEFAULT_CAMERA_CONFIG } from './default';
export { EXPANDED_CAMERA_CONFIG } from './expanded';
export { ORBIT_CONTROLS_CONFIG } from './controls';

import { CameraConfig } from '../types';

/**
 * 카메라 설정을 가져오는 함수
 * @param isExpanded - 확장 모드 여부
 * @returns 적절한 카메라 설정
 */
export const getCameraConfig = (isExpanded: boolean): CameraConfig => {
  const { DEFAULT_CAMERA_CONFIG } = require('./default');
  const { EXPANDED_CAMERA_CONFIG } = require('./expanded');
  return isExpanded ? EXPANDED_CAMERA_CONFIG : DEFAULT_CAMERA_CONFIG;
}; 