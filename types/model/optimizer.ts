import * as THREE from 'three';

/**
 * 텍스처 최적화 옵션 인터페이스
 */
export interface TextureOptions {
  colorSpace?: THREE.ColorSpace;
  anisotropy?: number;
  minFilter?: THREE.TextureFilter;
  magFilter?: THREE.TextureFilter;
  logInfo?: boolean;
  isMobile?: boolean;
  supportKTX2?: boolean;  // KTX2 지원 여부
  onTextureLoad?: (texture: THREE.Texture) => void;
}

/**
 * 재질 최적화 옵션 인터페이스
 */
export interface MaterialOptions extends TextureOptions {
  defaultColor?: THREE.Color;
  checkTextureLoaded?: boolean;
}

/**
 * 씬 최적화 옵션 인터페이스
 */
export interface SceneOptions extends MaterialOptions {
  setShadows?: boolean;
  disableShadows?: boolean;
  detectKTX2?: boolean; // KTX2 텍스처 자동 감지 여부
} 