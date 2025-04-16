import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { logger } from '../logger';
import { MemoryStats, createEmptyMemoryStats } from './MemoryStats';
import { disposeTexture, disposeTexturesFromMaterial } from './TextureUtils';
import { disposeGeometry } from './GeometryUtils';

/**
 * 메시를 처분하는 함수
 * @param mesh - 처분할 메시
 */
export function disposeMesh(mesh: THREE.Mesh) {
  if (!mesh) return;
  
  // 처분 대상 확인 로그
  logger.log(`메시 처분: ${mesh.name || '이름 없음'}`, 'resource');
  
  // 머티리얼 처분
  if (mesh.material) {
    const materials = Array.isArray(mesh.material) 
      ? mesh.material 
      : [mesh.material];
    
    materials.forEach(material => {
      // 모든 텍스처 처분
      disposeTexturesFromMaterial(material);
      
      // 머티리얼 자체 처분
      if (typeof material.dispose === 'function') {
        material.dispose();
      }
    });
    
    // 메시의 머티리얼 참조 제거
    mesh.material = null as any;
  }
  
  // 지오메트리 처분
  if (mesh.geometry) {
    disposeGeometry(mesh.geometry);
    mesh.geometry = null as any;
  }
}

/**
 * 씬 내의 모든 리소스를 처분하는 함수
 * @param object - 처분할 씬/객체
 * @param options - 처분 옵션
 * @returns 메모리 통계
 */
export function disposeSceneResources(
  object: THREE.Object3D,
  options: {
    logDisposal?: boolean,
    logLevel?: 'none' | 'basic' | 'detailed' | 'verbose',
    resourceManager?: any,
    performanceStats?: any
  } = {}
): MemoryStats {
  if (!object) return createEmptyMemoryStats();
  
  // 옵션 기본값 설정
  const {
    logDisposal = true,
    logLevel = 'basic',
    resourceManager,
    performanceStats
  } = options;
  
  // 로그 레벨 변환
  const detailLevel = logLevel === 'none' ? 0 :
                     logLevel === 'basic' ? 1 :
                     logLevel === 'detailed' ? 2 : 3;
  
  // 통계 초기화
  const stats = createEmptyMemoryStats();
  
  // 메모리 사용량 통계 수집 및 모든 리소스 처분
  const textureSet = new Set<THREE.Texture>();
  const geometrySet = new Set<THREE.BufferGeometry>();
  const materialSet = new Set<THREE.Material>();
  
  // 씬의 모든 객체 순회하면서 처분
  object.traverse((child: THREE.Object3D) => {
    // 메시인 경우
    if (child instanceof THREE.Mesh) {
      stats.meshCount++;
      
      // 지오메트리 처리
      if (child.geometry) {
        if (!geometrySet.has(child.geometry)) {
          geometrySet.add(child.geometry);
          stats.geometryCount++;
          stats.geometryMemory = (stats.geometryMemory || 0) + disposeGeometry(child.geometry);
        }
        child.geometry = null as any;
      }
      
      // 머티리얼 처리
      if (child.material) {
        const materials = Array.isArray(child.material) 
          ? child.material 
          : [child.material];
        
        materials.forEach(material => {
          if (!materialSet.has(material)) {
            materialSet.add(material);
            stats.materialCount++;
            
            // 머티리얼의 모든 텍스처 찾기
            const textureProps = [
              'map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap',
              'emissiveMap', 'envMap', 'lightMap', 'metalnessMap', 
              'normalMap', 'roughnessMap', 'specularMap', 'gradientMap',
              'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap',
              'thicknessMap', 'transmissionMap',
              'sheenRoughnessMap', 'sheenColorMap', 'specularIntensityMap',
              'specularColorMap', 'anisotropyMap', 'iridescenceMap',
              'iridescenceThicknessMap', 'attenuationMap', 'transmissionMap'
            ];
            
            // 모든 텍스처 처분
            textureProps.forEach(prop => {
              const texture = (material as any)[prop];
              if (texture && !textureSet.has(texture)) {
                textureSet.add(texture);
                stats.textureCount++;
                stats.textureMemory = (stats.textureMemory || 0) + disposeTexture(texture);
                (material as any)[prop] = null;
              }
            });
            
            // 머티리얼 처분
            material.dispose();
          }
        });
        
        child.material = null as any;
      }
    }
  });
  
  // 총 메모리 계산
  stats.totalMemory = (stats.textureMemory || 0) + (stats.geometryMemory || 0);
  
  // 로깅
  if (logDisposal && detailLevel > 0) {
    logger.log(`씬 리소스 처분 완료:`, 'resource');
    logger.log(`- 메시: ${stats.meshCount}개`, 'resource');
    logger.log(`- 머티리얼: ${stats.materialCount}개`, 'resource');
    logger.log(`- 지오메트리: ${stats.geometryCount}개`, 'resource');
    logger.log(`- 텍스처: ${stats.textureCount}개`, 'resource');
    
    if (detailLevel > 1) {
      logger.log(`- 텍스처 메모리: ${stats.textureMemory || 0} 바이트`, 'resource');
      logger.log(`- 지오메트리 메모리: ${stats.geometryMemory || 0} 바이트`, 'resource');
      logger.log(`- 총 메모리: ${stats.totalMemory || 0} 바이트`, 'resource');
    }
  }
  
  return stats;
}

/**
 * GLTF 모델을 정리하는 함수
 * @param object - 정리할 모델/씬
 * @param modelPath - 모델 경로
 * @param options - 정리 옵션
 * @returns 메모리 통계
 */
export function cleanupGLTFModel(
  object: THREE.Object3D, 
  modelPath: string,
  options: {
    logDisposal?: boolean,
    logLevel?: 'none' | 'basic' | 'detailed' | 'verbose',
    resourceManager?: any,
    performanceStats?: any
  } = {}
): MemoryStats {
  if (!object) return createEmptyMemoryStats();
  
  // 모델 처분
  const stats = disposeSceneResources(object, options);
  
  try {
    // drei의 useGLTF 캐시에서 제거 (캐시 히트 방지)
    useGLTF.clear(modelPath);
    logger.log(`GLTF 캐시 정리: ${modelPath}`, 'resource');
  } catch (error) {
    console.warn('GLTF 캐시 정리 실패:', error);
  }
  
  return stats;
}

/**
 * 전역 메모리 정리 함수
 * Three.js 및 WebGL 관련 전역 캐시 정리
 */
export function forceGlobalMemoryCleanup(): void {
  try {
    // Three.js의 내부 캐시 정리
    
    // 1. ObjectLoader 캐시 정리
    if (THREE.Cache && typeof THREE.Cache.clear === 'function') {
      THREE.Cache.clear();
      logger.log('Three.js 캐시 정리 완료', 'resource');
    }
    
    // 2. LoadingManager 캐시 정리
    // 이 부분은 일반적으로 외부에서 직접 접근하기 어려움
    // 애플리케이션에서 사용 중인 LoadingManager 인스턴스가 있다면
    // 해당 인스턴스를 통해 정리해야 함
    
    // 3. 애니메이션 루프 중지 (필요한 경우)
    // 이 부분은 일반적으로 애플리케이션 레벨에서 제어해야 함
    
    // 4. WebGLRenderer가 사용하는 리소스 정리
    // 이 부분도 애플리케이션에서 사용 중인 renderer 인스턴스를 통해 정리해야 함
    // renderer.dispose();
    
    // 5. 가비지 컬렉션 유도 (JavaScript 엔진에 의존적)
    // 명시적으로 가비지 컬렉션을 호출할 수는 없지만,
    // 참조를 제거하고 일부 트릭으로 유도할 수 있음
    if (window.gc) {
      try {
        window.gc();
        logger.log('가비지 컬렉션 요청', 'resource');
      } catch (e) {
        // gc 메서드가 없거나 호출할 수 없는 경우 무시
      }
    }
    
    logger.log('전역 메모리 정리 완료', 'resource');
  } catch (error) {
    console.error('전역 메모리 정리 중 오류 발생:', error);
  }
} 