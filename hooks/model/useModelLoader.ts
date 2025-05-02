import { useGLTF } from '@react-three/drei';
import { useCallback, useState, useEffect } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three-stdlib';
import { ModelComponentType, MODEL_COMPONENTS } from '../../types/scene';
import { MODEL_PRELOAD_MAP } from '../../config/model';
import { devLog } from '../../utils/logger';
import { useResponsiveDevice } from '../device';
import { Scene, Group } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  optimizeScene,
  TextureOptimizationOptions,
  SceneOptions
} from '../../utils/memory';
import { getModelQualitySetting } from '../../utils/performance';
import { TextureLoaderManager } from '../../utils/loaders/TextureLoaders';

/**
 * 최적의 텍스처 압축 포맷을 결정하는 함수
 */
function getOptimalTextureFormat(renderer: THREE.WebGLRenderer): string {
  const capabilities = renderer.capabilities;
  const extensions = renderer.extensions;
  
  // macOS (Apple Silicon)
  if (navigator.platform.includes('Mac') && /arm/i.test(navigator.userAgent)) {
    if (extensions.get('WEBGL_compressed_texture_astc')) {
      return 'ASTC';
    }
  }
  
  // Windows/Linux
  if (extensions.get('WEBGL_compressed_texture_s3tc')) {
    return 'S3TC';
  }
  
  // Android
  if (extensions.get('WEBGL_compressed_texture_etc')) {
    return 'ETC2';
  }
  
  // iOS
  if (extensions.get('WEBGL_compressed_texture_pvrtc')) {
    return 'PVRTC';
  }
  
  // 기본값으로 KTX2 반환 (압축되지 않은 텍스처로 폴백)
  return 'KTX2';
}

interface UseModelLoaderOptions {
  component: ModelComponentType;
  scene?: Scene;
  autoOptimize?: boolean;
  basePath?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

interface UseModelLoaderResult {
  model: Group | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 모델 로딩 훅
 * GLTF 모델을 로드하고 최적화합니다.
 */
export function useModelLoader({
  component,
  scene,
  autoOptimize = true,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH || '',
  onLoad,
  onError
}: UseModelLoaderOptions): UseModelLoaderResult {
  const [model, setModel] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { isMobile, isTablet } = useResponsiveDevice();
  
  // 모바일 또는 태블릿인 경우 모바일용 모델 사용
  const isUsingMobileModel = isMobile || isTablet;
  
  // 모델 경로 설정 (draco 또는 draco-mobile 사용)
  const modelFolder = isUsingMobileModel ? 'draco-mobile' : 'draco';
  const modelSuffix = isUsingMobileModel ? '_mobile_draco' : '_draco';
  const modelPath = `${basePath}/models/main/${modelFolder}/compressed_${component.toLowerCase()}${modelSuffix}.glb`;
  
  // 다음 모델 프리로드
  const preloadNextModel = useCallback(async () => {
    if (!MODEL_PRELOAD_MAP[component]) {
      const currentIndex = MODEL_COMPONENTS.indexOf(component);
      const nextIndex = (currentIndex + 1) % MODEL_COMPONENTS.length;
      const nextComponent = MODEL_COMPONENTS[nextIndex];
      
      // 다음 모델의 경로도 현재 디바이스 타입에 맞게 설정
      const nextModelPath = `${basePath}/models/main/${modelFolder}/compressed_${nextComponent.toLowerCase()}${modelSuffix}.glb`;
      
      try {
        await useGLTF.preload(nextModelPath);
        MODEL_PRELOAD_MAP[component] = true;
        devLog(`다음 모델 프리로드 완료: ${nextComponent}`, 'debug');
      } catch (error) {
        devLog(`다음 모델 프리로드 실패: ${error}`, 'error');
      }
    }
  }, [basePath, component, modelFolder, modelSuffix]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // 모델 품질 설정 가져오기
    const modelQuality = getModelQualitySetting();
    
    // 품질에 따른 텍스처 로딩 옵션 최적화
    const textureOptions = {
      generateMipmaps: true,
      flipY: false,
      anisotropy: modelQuality === 'low' ? 4 : 16
    };

    const loadModel = async () => {
      try {
        // 동적 임포트를 사용하여 모델 로더 가져오기
        const { loadGLTFModel } = await import('../../utils/memory');
        
        // 모델 로드
        const gltf: GLTF = await loadGLTFModel(component, textureOptions);
        
        if (!isMounted) return;

        const modelGroup = gltf.scene;
        
        // 모델 최적화 적용
        if (autoOptimize) {
          // 모델 텍스처와 물리 속성 최적화
          optimizeScene(modelGroup, { 
            isMobile: modelQuality === 'low',
            setShadows: modelQuality !== 'low'
          });
          
          // 모델 캐스팅 설정
          modelGroup.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              // 낮은 품질 설정에서는 그림자 비활성화
              if (modelQuality === 'low') {
                object.castShadow = false;
                object.receiveShadow = false;
              } else {
                object.castShadow = true;
                object.receiveShadow = true;
              }
            }
          });
        }

        // 씬에 모델 추가
        if (scene) {
          scene.add(modelGroup);
        }

        // 모델 상태 업데이트
        setModel(modelGroup);
        setIsLoading(false);
        
        // 로드 완료 콜백 호출
        if (onLoad) onLoad();
        
        // 프리로드 상태 업데이트
        MODEL_PRELOAD_MAP[component] = true;
      } catch (e) {
        if (!isMounted) return;
        console.error(`Error loading model ${component}:`, e);
        setError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
        if (onError) onError(e);
      }
    };

    // 이미 프리로드된 모델인 경우 로딩 건너뛰기
    if (MODEL_PRELOAD_MAP[component]) {
      setIsLoading(false);
      // TODO: 캐시에서 모델 가져오기 구현
    } else {
      loadModel();
    }

    return () => {
      isMounted = false;
    };
  }, [component, scene, autoOptimize, basePath, onLoad, onError]);

  return { model, isLoading, error };
} 