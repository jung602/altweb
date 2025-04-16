import * as THREE from 'three';
import { CanvasConfig } from '../types';
import { applyEnvironmentConfig, EnvironmentConfig } from '../environment';

/**
 * 캔버스 설정
 * 환경별로 다른 캔버스 설정을 적용합니다.
 */

// 기본 캔버스 설정
const canvasConfigBase: CanvasConfig = {
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

// 환경별 캔버스 설정
const canvasConfigEnv: EnvironmentConfig<CanvasConfig> = {
  default: canvasConfigBase,
  development: {
    // 개발 환경에서는 디버깅을 위해 preserveDrawingBuffer 활성화
    gl: {
      ...canvasConfigBase.gl,
      preserveDrawingBuffer: true,
      powerPreference: "default", // 배터리 절약 모드
      toneMappingExposure: 1.1, // 약간 더 밝게 (디버깅용)
    },
    dpr: [1, 1.5] // 개발 중에는 낮은 DPR 사용
  },
  production: {
    // 프로덕션 환경에서는 최적화된 설정 사용
    gl: {
      ...canvasConfigBase.gl,
      powerPreference: "high-performance",
    },
    dpr: [1, 2] // 고해상도 지원
  }
};

// 환경별 설정이 적용된 최종 캔버스 설정
export const CANVAS_CONFIG = applyEnvironmentConfig(canvasConfigEnv); 