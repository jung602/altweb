/**
 * 씬 최적화 유틸리티
 * Three.js 씬 전체에 대한 최적화 기능을 제공합니다.
 */

import * as THREE from 'three';
import { 
  analyzeCompressedTextures,
  TextureOptimizationOptions
} from './TextureUtils';
import { formatBytes } from './MemoryStats';
import { logger } from '../logger';
import { getCurrentPerformanceMode } from '../performance';
import { optimizeMaterial, MaterialOptions } from './MaterialOptimizer';

// 씬 최적화 추적을 위한 간단한 캐시
const optimizedSceneIds = new Set<string>();

// 그림자 품질 설정
const SHADOW_QUALITY = {
  'high-performance': {
    enabled: true,
    mapSize: 2048,
    type: 'PCFSoftShadowMap'
  },
  'balanced': {
    enabled: true,
    mapSize: 1024,
    type: 'PCFShadowMap'
  },
  'power-saving': {
    enabled: false,
    mapSize: 512,
    type: 'BasicShadowMap'
  }
};

/**
 * 씬 최적화 옵션 인터페이스
 */
export interface SceneOptions extends MaterialOptions {
  setShadows?: boolean;
  disableShadows?: boolean;
  detectKTX2?: boolean; // KTX2 텍스처 자동 감지 여부
}

/**
 * 씬 최적화 함수
 * @param scene - 최적화할 씬
 * @param options - 최적화 옵션
 */
export function optimizeScene(
  scene: THREE.Object3D,
  options: SceneOptions = {}
): void {
  if (!scene) return;
  
  // 이미 최적화된 씬은 건너뛰기
  const sceneId = scene.uuid;
  if (optimizedSceneIds.has(sceneId)) {
    if (process.env.NODE_ENV === 'development') {
      logger.log(`씬 중복 최적화 방지 (UUID: ${sceneId.substring(0, 8)}...)`, 'debug');
    }
    return;
  }
  
  // 최적화 상태 설정
  optimizedSceneIds.add(sceneId);
  
  if (process.env.NODE_ENV === 'development') {
    logger.log(`씬 최적화 시작 - 이미 최적화된 씬: ${optimizedSceneIds.size}개`, 'debug');
  }
  
  // 씬을 순회하면서 모든 재질 최적화
  scene.traverse(object => {
    // 메시 처리
    if (object instanceof THREE.Mesh) {
      // 머티리얼 최적화
      if (object.material) {
        const materials = Array.isArray(object.material)
          ? object.material 
          : [object.material];
          
        materials.forEach(material => {
          optimizeMaterial(material, options);
        });
      }
      
      // 그림자 설정
      if (options.setShadows !== undefined) {
        object.castShadow = options.setShadows;
        object.receiveShadow = options.setShadows;
      } else if (options.disableShadows) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    }
  });
  
  // KTX2 텍스처 감지 기능 (detectKTX2 옵션이 true일 때만)
  if (options.detectKTX2 && options.logInfo) {
    const textureAnalysis = analyzeCompressedTextures(scene);
    if (textureAnalysis.compressedTextures > 0) {
      logger.log(`압축 텍스처 감지: ${textureAnalysis.compressedTextures}개 (전체 ${textureAnalysis.textureCount}개 중)`, 'info');
      logger.log(`추정 메모리 사용량: ${formatBytes(textureAnalysis.estimatedMemory)}`, 'info');
    }
  }
}

/**
 * 씬의 모든 재질에 발광 강도 설정
 * @param scene - 발광 강도를 설정할 씬
 * @param intensity - 발광 강도 (0-1)
 * @param options - 로깅 옵션
 */
export function setSceneEmissionIntensity(
  scene: THREE.Object3D,
  intensity: number = 0.5,
  options: { logInfo?: boolean } = {}
): void {
  if (!scene) return;
  
  let materialCount = 0;
  
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      const materials = Array.isArray(object.material)
        ? object.material 
        : [object.material];
        
      materials.forEach(material => {
        // MeshStandardMaterial은 emissiveIntensity를 직접 지원
        if (material instanceof THREE.MeshStandardMaterial) {
          material.emissiveIntensity = intensity;
          
          // 발광 맵이 없을 때 발광 색상 설정
          if (!material.emissiveMap && intensity > 0) {
            material.emissive.set(0xffffff);
          }
        }
        materialCount++;
      });
    }
  });
  
  if (options.logInfo) {
    logger.log(`씬의 ${materialCount}개 재질 발광 강도 설정: ${intensity}`, 'debug');
  }
}

/**
 * 최적화된 씬 캐시를 정리합니다.
 */
export function cleanupSceneOptimizations(): void {
  optimizedSceneIds.clear();
  logger.log(`씬 최적화 캐시 정리됨: ${optimizedSceneIds.size}개 씬`, 'resource');
}

/**
 * 현재 성능 모드에 기반한 그림자 품질 설정 반환
 */
export function getShadowQualitySettings() {
  const mode = getCurrentPerformanceMode();
  return SHADOW_QUALITY[mode] || SHADOW_QUALITY['balanced'];
}

/**
 * 씬 최적화 시스템을 초기화합니다.
 */
export function initSceneOptimizer() {
  optimizedSceneIds.clear();
} 