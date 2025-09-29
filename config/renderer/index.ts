/**
 * 렌더러 관련 설정 통합 내보내기
 */
// default.ts는 제거되었습니다. 내보낼 기본 렌더러 설정 없음

// 렌더러 설정 다시 내보내기
export { RENDERER_CONFIG, EFFECT_COMPOSER_CONFIG, PIXEL_RATIO } from '../renderer';

import * as THREE from 'three';
import { RENDERER_CONFIG } from '../renderer';

/**
 * 렌더러를 설정하는 함수
 * @param gl - WebGLRenderer 인스턴스
 */
export const setupRenderer = (gl: THREE.WebGLRenderer): void => {
  // WebGLRendererParameters에는 toneMapping과 toneMappingExposure가 없으므로
  // 기본값을 직접 설정합니다
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = 1;
}; 