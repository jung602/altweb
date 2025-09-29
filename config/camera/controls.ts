import { OrbitControlsConfig } from '../types';

/**
 * OrbitControls 기본 설정
 */
export const ORBIT_CONTROLS_CONFIG: OrbitControlsConfig = {
  MIN_POLAR_ANGLE: Math.PI / 6,
  MAX_POLAR_ANGLE: Math.PI / 2,
  MIN_AZIMUTH_ANGLE: -Infinity,
  MAX_AZIMUTH_ANGLE: Infinity,
  MIN_DISTANCE: 380 * 0.8,
  MAX_DISTANCE: 380 * 1.3,
  ZOOM_SCALE: {
    MIN: 0.8,
    MAX: 1.3
  }
}; 