import * as THREE from 'three';
import { RendererConfig } from '../types';

/**
 * 렌더러 설정
 */
export const RENDERER_CONFIG: RendererConfig = {
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1
}; 