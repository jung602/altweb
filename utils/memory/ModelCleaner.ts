import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { logger } from '../logger';
import { MemoryStats, createEmptyMemoryStats } from './MemoryStats';
import { disposeSceneResources } from './ResourceDisposal';

/**
 * 3D 모델 최적화 옵션 타입
 */
export interface ModelOptimizationOptions {
  // 텍스처 최적화 옵션
  textureOptions?: {
    minFilter?: THREE.TextureFilter;
    magFilter?: THREE.TextureFilter;
    anisotropy?: number;
    maxSize?: number;
    compressTextures?: boolean;
  };
  
  // 지오메트리 최적화 옵션
  geometryOptions?: {
    mergeVertices?: boolean;
    removeUnusedVertices?: boolean;
    simplifyMeshes?: boolean;
    simplificationThreshold?: number;
  };
  
  // 머티리얼 최적화 옵션
  materialOptions?: {
    disableShadows?: boolean;
    flatShading?: boolean;
    materialCombining?: boolean;
  };
  
  // 로깅 및 통계 옵션
  loggingOptions?: {
    logLevel?: 'none' | 'basic' | 'detailed' | 'verbose';
    recordStats?: boolean;
  };
}

/**
 * 모델을 메모리에서 완전히 제거하는 함수
 * @param model - 제거할 모델
 * @param modelPath - 모델 경로 (캐시 제거용)
 * @param options - 제거 옵션
 * @returns 메모리 통계
 */
export function cleanupAndDisposeModel(
  model: THREE.Object3D | null,
  modelPath?: string,
  options: {
    logLevel?: 'none' | 'basic' | 'detailed' | 'verbose';
    removeFromScene?: boolean;
    removeFromCache?: boolean;
  } = {}
): MemoryStats {
  if (!model) return createEmptyMemoryStats();
  
  const {
    logLevel = 'basic',
    removeFromScene = true,
    removeFromCache = true
  } = options;
  
  // 부모 씬에서 제거
  if (removeFromScene && model.parent) {
    model.parent.remove(model);
  }
  
  // 리소스 처분
  const stats = disposeSceneResources(model, { logLevel });
  
  // 캐시에서 제거 (useGLTF 사용 시)
  if (removeFromCache && modelPath) {
    try {
      useGLTF.clear(modelPath);
      logger.log(`모델 캐시 제거: ${modelPath}`, 'resource');
    } catch (error) {
      console.warn(`모델 캐시 제거 실패: ${modelPath}`, error);
    }
  }
  
  // 추가 참조 제거
  for (const key in model) {
    if (Object.prototype.hasOwnProperty.call(model, key)) {
      (model as any)[key] = null;
    }
  }
  
  return stats;
} 