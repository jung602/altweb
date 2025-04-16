import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ModelComponentType } from '../../types/scene';
import { devLog } from '../../utils/logger';
import { 
  optimizeScene,
  TextureOptimizationOptions,
  SceneOptions
} from '../../utils/memory';
import { cleanupTextureReferences } from '../../utils/memory';
import { ResourceManager } from '../../utils/ResourceManager';

export interface TextureLoaderOptions extends TextureOptimizationOptions {
  onTextureLoad?: (texture: THREE.Texture) => void;
  logInfo?: boolean;
}

export interface UseModelOptimizerOptions {
  scene: THREE.Group | null;
  component: ModelComponentType;
  isMobile: boolean;
  defaultColor?: THREE.Color;
  checkInterval?: number;
  isDev?: boolean;
  resourceManager: ResourceManager | null;
}

export interface UseModelOptimizerResult {
  isOptimized: boolean;
  lastOptimizedUUID: string | null;
  checkMaterials: () => boolean;
}

/**
 * 3D 모델 최적화 관련 로직을 처리하는 훅
 */
export function useModelOptimizer({
  scene,
  component,
  isMobile,
  defaultColor = new THREE.Color(0xCCCCCC),
  checkInterval = 1000,
  isDev = process.env.NODE_ENV === 'development',
  resourceManager
}: UseModelOptimizerOptions): UseModelOptimizerResult {
  // 최적화 상태 추적을 위한 플래그
  const optimizationStateRef = useRef({
    isOptimizingScene: false,
    hasOptimized: false,
    lastOptimizedUUID: '',
  });

  // 최적화된 씬 ID 추적
  const optimizedSceneIds = useRef(new Set<string>());

  // 씬 초기화 및 최적화 함수
  const optimizeCurrentScene = useCallback((currentScene: THREE.Group) => {
    if (!currentScene || !resourceManager) return;

    // 씬의 회전 초기화
    currentScene.rotation.set(0, 0, 0);
    
    // 각 메시 초기화 및 최적화
    currentScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // 각 메시의 회전 초기화
        mesh.rotation.set(0, 0, 0);
        
        // 지오메트리 계산 및 등록
        if (mesh.geometry) {
          mesh.geometry.computeBoundingSphere();
          mesh.geometry.computeBoundingBox();
          resourceManager.registerResource(
            `${component}_${mesh.name}_geometry`,
            mesh.geometry,
            'geometry'
          );
        }

        // 재질 등록
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material: THREE.Material, index: number) => {
              resourceManager.registerResource(
                `${component}_${mesh.name}_material_${index}`,
                material,
                'material'
              );
            });
          } else {
            resourceManager.registerResource(
              `${component}_${mesh.name}_material`,
              mesh.material,
              'material'
            );
          }
        }
      }
    });

    // 씬 자체를 리소스로 등록
    resourceManager.registerResource(
      `${component}_scene`,
      currentScene,
      'scene'
    );
    
    // 텍스처 업데이트 관련 옵션
    const textureOptions: TextureLoaderOptions = {
      logInfo: isDev,
      onTextureLoad: (texture: THREE.Texture) => {
        resourceManager.registerResource(
          `${component}_texture_${texture.uuid}`,
          texture,
          'texture'
        );
      }
    };
    
    // 모바일 기기인 경우 모바일 옵션 추가
    const sceneOptions: SceneOptions = {
      ...textureOptions,
      defaultColor,
      checkTextureLoaded: true,
      setShadows: true,
      isMobile
    };
    
    // 하나의 통합된 최적화 호출로 대체
    optimizeScene(currentScene, sceneOptions);
  }, [component, isMobile, isDev, defaultColor, resourceManager]);

  // 수동으로 메테리얼 체크하는 함수
  const checkMaterials = useCallback(() => {
    if (!scene) return false;
    
    // 메테리얼 확인 - 간단한 로드 상태 체크로 대체
    let hasMissingTextures = false;
    
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial) {
            // 텍스처 로드 상태 확인
            if (material.map && !material.map.image) {
              hasMissingTextures = true;
            }
          }
        });
      }
    });
    
    if (hasMissingTextures && isDev) {
      devLog('일부 텍스처가 아직 로드되지 않았습니다.', 'info');
    }
    
    return hasMissingTextures;
  }, [scene, isDev]);

  // 씬 초기화 및 최적화
  useEffect(() => {
    if (!scene) return;
    
    const optimizationState = optimizationStateRef.current;
    
    // 동일한 씬에 대한 중복 최적화 방지
    if (optimizationState.hasOptimized && optimizationState.lastOptimizedUUID === scene.uuid) {
      if (isDev) devLog(`이미 최적화된 씬 (UUID: ${scene.uuid.substring(0, 8)}...)`, 'debug');
      return;
    }
    
    // 최적화 중 플래그 설정
    optimizationState.isOptimizingScene = true;
    
    // 최적화 전 이전 씬 ID 캐시 체크
    if (optimizedSceneIds.current.has(scene.uuid)) {
      if (isDev) devLog(`이미 최적화된 씬 ID (UUID: ${scene.uuid.substring(0, 8)}...)`, 'debug');
    } else {
      // 최적화 진행
      optimizeCurrentScene(scene);
      optimizedSceneIds.current.add(scene.uuid);
    }
    
    // 최적화 완료 상태 업데이트
    optimizationState.isOptimizingScene = false;
    optimizationState.hasOptimized = true;
    optimizationState.lastOptimizedUUID = scene.uuid;
  }, [scene, optimizeCurrentScene, isDev]);

  // 메테리얼 정기 점검
  useEffect(() => {
    if (!scene) return;
    
    // 중복 실행 방지를 위한 플래그
    let isCheckingMaterials = false;

    // 메테리얼 상태 확인 및 업데이트를 더 적은 빈도로 수행
    const intervalId = setInterval(() => {
      // 이미 체크 중이면 건너뛰기
      if (isCheckingMaterials) return;
      
      isCheckingMaterials = true;
      checkMaterials();
      isCheckingMaterials = false;
    }, checkInterval * 5); // 체크 간격을 5배로 늘림
    
    return () => clearInterval(intervalId);
  }, [scene, checkInterval, checkMaterials]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 텍스처 캐시 정리
      cleanupTextureReferences();
      optimizedSceneIds.current.clear();
    };
  }, []);

  return {
    isOptimized: optimizationStateRef.current.hasOptimized,
    lastOptimizedUUID: optimizationStateRef.current.lastOptimizedUUID || null,
    checkMaterials
  };
} 