import * as THREE from 'three';
import { CanvasConfig } from '../types';

/**
 * 캔버스 설정
 */
export const CANVAS_CONFIG: CanvasConfig = {
  gl: {
    antialias: true,
    preserveDrawingBuffer: false,
    alpha: true,
    powerPreference: "high-performance",
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1,
    outputColorSpace: THREE.LinearSRGBColorSpace,
  },
  dpr: [1, 2]
}; 