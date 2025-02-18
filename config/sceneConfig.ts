import { ModelComponentType } from '../types/scene';
import * as THREE from 'three';

// 모델 프리로드 상태 관리
export const MODEL_PRELOAD_MAP: Record<ModelComponentType, boolean> = {
  Alt1: false,
  Alt2: false,
  Alt3: false,
  Alt4: false,
  Alt5: false,
};

// 씬 렌더링 설정
export const SCENE_RENDER_CONFIG = {
  RENDER_DISTANCE: 2, // 현재 인덱스로부터 몇 개의 씬을 렌더링할지
  LOAD_DELAY_MULTIPLIER: 100, // 로딩 딜레이 계수
  Z_INDEX: {
    CENTER: 12,
    SIDE: 11
  }
};

// 캔버스 설정
export const CANVAS_CONFIG = {
  gl: {
    antialias: true,
    preserveDrawingBuffer: false,
    alpha: true,
    powerPreference: "high-performance" as const,
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1,
    outputColorSpace: THREE.LinearSRGBColorSpace,
    samples: 8,
  },
  dpr: [1, 2] as [number, number]
};

// OrbitControls 기본 설정
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

// 애니메이션 설정
export const ANIMATION_CONFIG = {
  TRANSITION_DURATION: 800,
  OPACITY_DURATION: 1000,
  SPRING: {
    mass: 1,
    tension: 280,
    friction: 120
  }
}; 