export { RENDERER_CONFIG } from './default';
import { RENDERER_CONFIG } from './default';

import * as THREE from 'three';

/**
 * 렌더러를 설정하는 함수
 * @param gl - WebGLRenderer 인스턴스
 */
export const setupRenderer = (gl: THREE.WebGLRenderer): void => {
  gl.toneMapping = RENDERER_CONFIG.toneMapping;
  gl.toneMappingExposure = RENDERER_CONFIG.toneMappingExposure;
}; 