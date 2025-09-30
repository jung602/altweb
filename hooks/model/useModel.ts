import { useGLTF } from '@react-three/drei';
import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three-stdlib';
import { ModelComponentType, MODEL_COMPONENTS } from '../../types/scene';
import { devLog, startGroup, endGroup, conditionalLog } from '../../utils/logger';
import { 
  optimizeScene,
  optimizeMaterial,
  TextureOptimizationOptions,
  MaterialOptions,
  SceneOptions,
  cleanupTextureReferences
} from '../../utils/memory';
import { 
  cleanupGLTFModel, 
  disposeSceneResources, 
  forceGlobalMemoryCleanup
} from '../../utils/memory/ResourceDisposal';
import type { MemoryStats } from '../../utils/memory/MemoryStats';
import { 
  analyzeModelMemoryUsage,
  generateOptimizationSuggestions,
  analyzeAndLogModelInfo,
  checkMemoryUsageAndSuggestOptimizations,
  resetDisplayedWarnings
} from '../../utils/memory';
import { useResponsiveDevice } from '../device';
import { ResourceManager } from '../../utils/ResourceManager';
import { TextureLoaderManager } from '../../utils/loaders/TextureLoaders';

interface UseModelOptions {
  component: ModelComponentType;
  basePath?: string;
  onLoad?: () => void;
  onError?: (url: string) => void;
  defaultColor?: THREE.Color;
  checkInterval?: number;
  isDev?: boolean;
  renderer?: THREE.WebGLRenderer | null;
}

interface UseModelResult {
  scene: THREE.Group;
  isNewModelReady: boolean;
  previousScene: THREE.Group | null;
  memoryStats: MemoryStats | null;
}

// 확장된 TextureOptions 인터페이스
interface ExtendedTextureOptions extends TextureOptimizationOptions {
  onTextureLoad?: (texture: THREE.Texture) => void;
  logInfo?: boolean;
}

/**
 * 3D 모델의 로드, 최적화, 정리를 통합적으로 관리하는 훅
 * @param options - 모델 관리 옵션
 * @returns 모델 관련 상태 및 정보
 */
export function useModel({
  component,
  basePath = process.env.NEXT_PUBLIC_BASE_PATH || '',
  onLoad,
  onError,
  defaultColor = new THREE.Color(0xCCCCCC),
  checkInterval = 1000,
  isDev = process.env.NODE_ENV === 'development',
  renderer = null
}: UseModelOptions): UseModelResult {
  // 반응형 정보 가져오기
  const { isMobile, isTablet } = useResponsiveDevice();
  
  // 모바일 또는 태블릿인 경우 모바일용 모델 사용
  const isUsingMobileModel = isMobile || isTablet;
  
  // 모델 경로 설정 (draco 또는 draco-mobile 사용)
  const modelFolder = isUsingMobileModel ? 'draco-mobile' : 'draco';
  const modelSuffix = isUsingMobileModel ? '_mobile_draco' : '_draco';
  const modelPath = `${basePath}/models/main/${modelFolder}/compressed_${component.toLowerCase()}${modelSuffix}.glb`;
  
  const [isNewModelReady, setIsNewModelReady] = useState(false);
  const [previousScene, setPreviousScene] = useState<THREE.Group | null>(null);
  const isInitialMount = useRef(true);
  
  const cleanupRef = useRef<(() => void) | null>(null);
  const memoryStatsRef = useRef<MemoryStats | null>(null);
  const modelAnalysisRef = useRef<any>(null);
  // 최적화 상태 추적을 위한 플래그
  const optimizationStateRef = useRef({
    isOptimizingScene: false,
    hasOptimized: false,
    hasAnalyzed: false,
    lastOptimizedUUID: '',
  });
  
  // 최적화된 씬 ID 추적
  const optimizedSceneIds = useRef(new Set<string>());
  
  // ResourceManager 인스턴스 생성
  const resourceManagerRef = useRef<ResourceManager | null>(null);

  // ResourceManager 초기화 - 간소화된 버전
  useEffect(() => {
    if (!resourceManagerRef.current) {
      resourceManagerRef.current = new ResourceManager({
        maxInactiveTime: 5 * 60 * 1000, // 5분
        checkInterval: 10000, // 10초로 고정
        logLevel: isDev ? 'basic' : 'basic' // 로그 레벨 간소화
      });

      // 페이지 언로드 시 간단한 정리만 수행
      const handleBeforeUnload = () => {
        if (THREE.Cache && typeof THREE.Cache.clear === 'function') {
          THREE.Cache.clear();
        }
        
        if (resourceManagerRef.current) {
          resourceManagerRef.current.forceCleanup();
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        
        if (resourceManagerRef.current) {
          resourceManagerRef.current.dispose();
          resourceManagerRef.current = null;
        }
      };
    }
  }, [isDev]);

  // (삭제됨) 커스텀 GLTF 프리로드: useGLTF.preload로 통합

  // GLTF 모델 로드
  const { scene } = useGLTF(modelPath, true, undefined, (loader) => {
    // Draco 로더 설정
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    // WASM 우선, 실패 시 JS 폴백
    try {
      dracoLoader.setDecoderConfig({ type: 'wasm' });
    } catch (_e) {
      dracoLoader.setDecoderConfig({ type: 'js' });
    }
    loader.setDRACOLoader(dracoLoader);

    // KTX2 로더 설정 - 통합된 TextureLoaderManager 사용
    if (renderer) {
      const textureLoaderManager = TextureLoaderManager.getInstance();
      
      // 최적의 텍스처 포맷 결정
      const optimalFormat = textureLoaderManager.getOptimalTextureFormat(renderer);
      
      // KTX2Loader 인스턴스 가져오기
      const ktx2Loader = textureLoaderManager.initializeKTX2Loader(renderer);
      loader.setKTX2Loader(ktx2Loader);
      
      // 압축 텍스처 지원 여부 확인
      const isCompressedTexturesSupported = textureLoaderManager.isCompressedTexturesSupported(renderer);
      
      if (!isCompressedTexturesSupported && isDev) {
        devLog(`현재 브라우저는 ${optimalFormat} 압축 텍스처를 지원하지 않습니다. 압축되지 않은 텍스처가 대신 사용될 수 있습니다.`, 'warn');
      } else if (isDev) {
        devLog(`최적의 텍스처 압축 포맷: ${optimalFormat}`, 'info');
      }
      
      // 세션별 한 번만 로그 출력
      if (textureLoaderManager.isInitialized() && isDev) {
        devLog('KTX2 텍스처 로더가 활성화되었습니다.', 'info');
        textureLoaderManager.resetLogState(); // 다음 로그를 위해 상태 리셋
      }
    }

    // 로더에 타임아웃 설정 (5초로 단축)
    loader.manager.onStart = (url) => {
      setTimeout(() => {
        if (!isNewModelReady) {
          setIsNewModelReady(true);
          if (onLoad) onLoad();
          if (isDev) devLog(`모델 로딩 타임아웃: ${url}`, 'warn');
        }
      }, 5000);
    };

    loader.manager.onError = (url) => {
      devLog(`텍스처 로드 에러: ${url}`, 'error');
      // 에러가 발생해도 모델 로딩을 차단하지 않도록 함
      if (!isNewModelReady) {
        setIsNewModelReady(true);
        if (onLoad) onLoad();
      }
      if (onError) onError(url);
    };

    loader.manager.onLoad = () => {
      setIsNewModelReady(true);
      devLog(`모델 로드 완료: ${component} (${isUsingMobileModel ? '모바일 버전' : '데스크탑 버전'})`, 'debug');
      if (onLoad) onLoad();
    };
  });

  // useGLTF 프리로드를 사용한 사전 로드 통합
  useEffect(() => {
    // 현재 모델 로드 후 다음 모델 프리로드
    const currentIndex = MODEL_COMPONENTS.indexOf(component);
    const nextIndex = (currentIndex + 1) % MODEL_COMPONENTS.length;
    const nextComponent = MODEL_COMPONENTS[nextIndex];
    const isNextMobile = isMobile || isTablet;
    const nextFolder = isNextMobile ? 'draco-mobile' : 'draco';
    const nextSuffix = isNextMobile ? '_mobile_draco' : '_draco';
    const nextPath = `${basePath}/models/main/${nextFolder}/compressed_${nextComponent.toLowerCase()}${nextSuffix}.glb`;
    try {
      useGLTF.preload(nextPath);
      if (isDev) devLog(`useGLTF 프리로드: ${nextComponent}`, 'debug');
    } catch (_e) {
      // 무시: preload는 런타임 오류 없이 건너뛸 수 있음
    }
  }, [component, basePath, isMobile, isTablet, isDev]);

  // 씬 초기화 및 최적화 함수 - 간소화된 버전
  const optimizeCurrentScene = useCallback((currentScene: THREE.Group) => {
    if (!currentScene) return;

    // 씬의 회전 초기화
    currentScene.rotation.set(0, 0, 0);
    
    // 기본적인 메시 초기화만 수행
    currentScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.rotation.set(0, 0, 0);
        
        // 기본 지오메트리 계산만 수행
        if (mesh.geometry) {
          mesh.geometry.computeBoundingSphere();
        }
      }
    });
    
    // 간소화된 최적화 옵션
    const sceneOptions: SceneOptions = {
      logInfo: false, // 로그 비활성화
      anisotropy: 2, // anisotropy 값 감소
      defaultColor,
      checkTextureLoaded: false, // 텍스처 체크 비활성화
      setShadows: false, // 그림자 비활성화
      isMobile
    };
    
    // 최적화 실행
    optimizeScene(currentScene, sceneOptions);
  }, [component, isMobile, defaultColor]);

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
      // 텍스처 최적화 캐시 정리 - 동일한 UUID의 텍스처가 있을 경우 올바르게 처리하기 위함
      cleanupTextureReferences();
      
      // 최적화 진행
      optimizeCurrentScene(scene);
      optimizedSceneIds.current.add(scene.uuid);
    }
    
    // 최적화 완료 상태 업데이트
    optimizationState.isOptimizingScene = false;
    optimizationState.hasOptimized = true;
    optimizationState.lastOptimizedUUID = scene.uuid;
    
  }, [scene, optimizeCurrentScene, isDev]);

  // 메테리얼 정기 점검 - 간소화된 버전
  useEffect(() => {
    if (!scene || !isDev) return;
    
    // 단순한 텍스처 로드 상태 확인 (한 번만 실행)
    const checkTextures = () => {
      let hasMissingTextures = false;
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          
          materials.forEach(material => {
            if (material instanceof THREE.MeshStandardMaterial) {
              if (material.map && !material.map.image) {
                hasMissingTextures = true;
              }
            }
          });
        }
      });
      
      if (hasMissingTextures) {
        devLog('일부 텍스처가 아직 로드되지 않았습니다.', 'info');
      }
    };
    
    // 5초 후 한 번만 체크
    const timeoutId = setTimeout(checkTextures, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [scene, isDev]);

  // 컴포넌트 변경 시 처리 - 간소화된 버전
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setIsNewModelReady(true);
      return;
    }

    setIsNewModelReady(false);
    
    if (scene) {
      const clonedScene = scene.clone();
      setPreviousScene(clonedScene);

      // 기본적인 정리만 수행
      if (resourceManagerRef.current) {
        resourceManagerRef.current.cleanup();
        optimizedSceneIds.current.clear();
        
        // Three.js 캐시만 정리
        if (THREE.Cache && typeof THREE.Cache.clear === 'function') {
          THREE.Cache.clear();
        }
        
        if (isDev) devLog('리소스 정리 완료', 'info');
      }
    }
  }, [component, scene, isDev]);

  // (삭제됨) 커스텀 프리로드 호출: useGLTF.preload로 대체

  // 이전 씬 정리
  useEffect(() => {
    return () => {
      if (previousScene) {
        // 이전 씬 정리에 유틸리티 함수 사용 (개발 모드에서는 로깅 활성화)
        const stats = disposeSceneResources(previousScene, { 
          logDisposal: isDev,
          logLevel: 'detailed' // 'basic', 'detailed', 'verbose' 중 선택
        });
        
        // 메모리 통계 저장
        memoryStatsRef.current = stats;
      }
    };
  }, [previousScene, isDev]);

  // 현재 씬 정리 함수 설정
  useEffect(() => {
    if (!scene) return;

    // 모델 정리 함수 설정 (개발 모드에서는 로깅 활성화)
    cleanupRef.current = () => {
      const stats = cleanupGLTFModel(scene, modelPath, { 
        logDisposal: isDev,
        logLevel: isDev ? 'verbose' : 'basic' // 개발 모드에서는 상세 로깅
      });
      
      // 메모리 통계 저장
      memoryStatsRef.current = stats;
      
      // 개발 모드에서 메모리 사용량 분석 및 최적화 제안
      if (isDev) {
        // 분리된 유틸리티 함수 사용
        checkMemoryUsageAndSuggestOptimizations(
          stats, 
          modelAnalysisRef.current, 
          component,
          devLog,
          conditionalLog
        );
      }
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [scene, modelPath, component, isDev]);

  return {
    scene,
    isNewModelReady,
    previousScene,
    memoryStats: memoryStatsRef.current
  };
} 