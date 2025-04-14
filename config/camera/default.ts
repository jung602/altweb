import { CameraConfig } from '../types';

/**
 * 기본 카메라 설정
 */
export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  position: [5 * 29, 6.5 * 29, -10 * 29],
  fov: 1,
  near: 100,
  far: 1000,
  zoom: 1
}; 