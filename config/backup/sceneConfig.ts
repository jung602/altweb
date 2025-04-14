import { ModelComponentType } from '../types/scene';
import * as THREE from 'three';

// 모델 프리로드 상태 관리
export const MODEL_PRELOAD_MAP: Record<ModelComponentType, boolean> = {
  Alt1: false,
  Alt2: false,
  Alt3: false,
  Alt4: false,
  Alt5: false,
  Alt6: false,
  Alt7: false,
  Alt8: false,
  Alt9: false,
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
  },
  dpr: [1, 2] as [number, number]
};

// 애니메이션 설정
export const ANIMATION_CONFIG = {
  SPRING: {
    mass: 1,
    tension: 280,
    friction: 60,
    precision: 0.001
  },
  TRANSITION: {
    duration: 500,
    ease: [0.43, 0.13, 0.23, 0.96]
  }
}; 