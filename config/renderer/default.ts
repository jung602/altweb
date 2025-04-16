import * as THREE from 'three';
import { WebGLRenderer } from 'three';
import { RENDERER_CONFIG, PIXEL_RATIO } from '../renderer';

/**
 * 기본 렌더러 설정
 */
export const DEFAULT_RENDERER_CONFIG = {
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance' as const,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1
};

/**
 * 렌더러 설정 및 초기화 함수
 * 환경별 설정이 적용된 렌더러를 생성합니다.
 * 
 * @param canvas 렌더링에 사용할 캔버스 요소
 * @returns 초기화된 WebGLRenderer 인스턴스
 */
export function setupRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    ...RENDERER_CONFIG
  });

  // 픽셀 비율 설정
  renderer.setPixelRatio(PIXEL_RATIO);

  return renderer;
} 