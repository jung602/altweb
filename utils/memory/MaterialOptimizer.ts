/**
 * 재질 최적화 유틸리티
 * Three.js 재질에 대한 최적화 기능을 제공합니다.
 */

import * as THREE from 'three';
import { 
  optimizeMaterialTextures,
  cleanupTextureReferences,
  TextureOptimizationOptions
} from './TextureUtils';
import { logger } from '../logger';
import { getCurrentPerformanceMode } from '../performance';

// 텍스처 크기 제한 설정
const TEXTURE_SIZE_LIMITS = {
  'high-performance': 4096,
  'balanced': 2048,
  'power-saving': 1024
};

/**
 * 재질 최적화 옵션 인터페이스
 */
export interface MaterialOptions extends TextureOptimizationOptions {
  defaultColor?: THREE.Color;
  checkTextureLoaded?: boolean;
  logInfo?: boolean;
  formatBytes?: (bytes: number) => string;
}

/**
 * 재질 최적화 함수
 * @param material - 최적화할 재질
 * @param options - 최적화 옵션
 */
export function optimizeMaterial(
  material: THREE.Material, 
  options: MaterialOptions = {}
): void {
  // 재질의 모든 텍스처 업데이트 - TextureUtils의 함수 사용
  optimizeMaterialTextures(material, options);
  
  // 기본 재질 속성 최적화
  material.side = THREE.FrontSide; // 전면만 렌더링 (성능 최적화)
  
  // 모바일에서는 불필요한 효과 비활성화
  if (options.isMobile) {
    material.precision = 'lowp'; // 낮은 정밀도 설정
    
    // 추가적인 모바일 최적화 - 쉐이더 복잡도 감소
    if (material instanceof THREE.MeshStandardMaterial) {
      material.metalness = material.metalnessMap ? material.metalness : 0;
      material.roughness = material.roughnessMap ? material.roughness : 1;
      material.aoMapIntensity = material.aoMap ? material.aoMapIntensity : 0;
    } else if (material instanceof THREE.MeshPhongMaterial) {
      material.shininess = 0; // 광택 비활성화
      material.reflectivity = 0; // 반사 비활성화
    }
  }
  
  // 기본 색상 설정 (텍스처가 없을 때)
  if (options.defaultColor) {
    if (material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhongMaterial ||
        material instanceof THREE.MeshBasicMaterial) {
      if (!material.map) {
        material.color = options.defaultColor;
      }
    }
  }
}

/**
 * 재질의 발광 강도 설정
 * @param material - 발광 강도를 설정할 재질
 * @param intensity - 발광 강도 (0-1)
 * @param options - 로깅 옵션
 */
export function setEmissionIntensity(
  material: THREE.Material,
  intensity: number = 0.5,
  options: { logInfo?: boolean } = {}
): void {
  if (!material) return;
  
  // MeshStandardMaterial은 emissiveIntensity를 직접 지원
  if (material instanceof THREE.MeshStandardMaterial) {
    material.emissiveIntensity = intensity;
    
    // 발광 맵이 없을 때 발광 색상 설정
    if (!material.emissiveMap && intensity > 0) {
      material.emissive.set(0xffffff);
    }
    
    if (options.logInfo) {
      logger.log(`재질 발광 강도 설정: ${intensity}`, 'debug');
    }
  }
}

/**
 * 최적화된 텍스처 캐시를 정리합니다.
 */
export function cleanupMaterialOptimizations(): void {
  // TextureUtils에서 제공하는 함수 사용
  const textureCount = cleanupTextureReferences();
  logger.log(`재질 최적화 캐시 정리됨: ${textureCount}개 텍스처`, 'resource');
}

/**
 * 현재 성능 모드에 기반한 텍스처 크기 제한 반환
 */
export function getTextureSizeLimit(): number {
  const mode = getCurrentPerformanceMode();
  return TEXTURE_SIZE_LIMITS[mode] || TEXTURE_SIZE_LIMITS['balanced'];
}

/**
 * 원본 텍스처 크기를 최적화된 크기로 변환
 */
export function getOptimizedTextureSize(originalSize: number): number {
  const limit = getTextureSizeLimit();
  return Math.min(originalSize, limit);
} 