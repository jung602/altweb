import { CameraConfig } from '../types';
import { DEFAULT_CAMERA_CONFIG } from './default';

/**
 * 확장 모드 카메라 설정
 */
export const EXPANDED_CAMERA_CONFIG: CameraConfig = {
  ...DEFAULT_CAMERA_CONFIG,
  // 확장 모드에서 필요한 추가 설정이 있다면 여기에 추가
}; 