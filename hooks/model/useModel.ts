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

  // ResourceManager 초기화
  useEffect(() => {
    if (!resourceManagerRef.current) {
      resourceManagerRef.current = new ResourceManager({
        maxInactiveTime: 5 * 60 * 1000, // 5분
        checkInterval: checkInterval,
        logLevel: isDev ? 'detailed' : 'basic'
      });

      // 리소스 이벤트 리스너 설정
      resourceManagerRef.current.on('resourceDisposed', ({ id, type }) => {
        if (isDev) devLog(`리소스 해제됨: ${id} (${type})`, 'debug');
      });

      resourceManagerRef.current.on('cleanup', ({ disposedCount }) => {
        if (isDev && disposedCount > 0) {
          devLog(`미사용 리소스 정리: ${disposedCount}개 해제됨`, 'info');
        }
      });

      // 페이지 언로드(새로고침 포함) 시 메모리 정리
      const handleBeforeUnload = () => {
        // Three.js 캐시 비우기
        if (THREE.Cache && typeof THREE.Cache.clear === 'function') {
          THREE.Cache.clear();
        }
        
        // 모든 리소스 정리
        if (resourceManagerRef.current) {
          resourceManagerRef.current.forceCleanup(); // 모든 리소스 강제 정리
        }
        
        // 텍스처 최적화 캐시 리셋
        cleanupTextureReferences();
        
        // 경고 표시 상태 초기화
        resetDisplayedWarnings();
        
        // 전역 메모리 정리 함수 호출
        forceGlobalMemoryCleanup();
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
  }, [checkInterval, isDev]);

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

    // 로더에 타임아웃 설정 (10초)
    loader.manager.onStart = (url) => {
      setTimeout(() => {
        if (!isNewModelReady) {
          setIsNewModelReady(true);
          if (onLoad) onLoad();
          if (isDev) devLog(`모델 로딩 타임아웃: ${url}`, 'warn');
        }
      }, 10000);
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

  // 씬 초기화 및 최적화 함수를 분리하여 효율성 향상
  const optimizeCurrentScene = useCallback((currentScene: THREE.Group) => {
    if (!currentScene || !resourceManagerRef.current) return;

    const resourceManager = resourceManagerRef.current;

    // 씬의 회전 초기화
    currentScene.rotation.set(0, 0, 0);
    
    // 메모리 사용량 최적화를 위한 플래그 (비활성화)
    const isLowPerformanceMode = false;
    
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
    
    // 텍스처 최적화 설정
    const textureOptions: ExtendedTextureOptions = {
      logInfo: isDev,
      anisotropy: 4,
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
  }, [component, isMobile, isDev, defaultColor]);

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
      
      isCheckingMaterials = false;
    }, checkInterval * 5); // 체크 간격을 5배로 늘림
    
    return () => clearInterval(intervalId);
  }, [scene, checkInterval, isDev]);

  // 컴포넌트 변경 시 처리
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

      // 이전 리소스 정리
      if (resourceManagerRef.current) {
        resourceManagerRef.current.cleanup(); // cleanupUnusedResources 대신 public cleanup 메서드 사용
        
        // 텍스처 최적화 캐시 리셋 - 모델이 변경될 때 캐시를 초기화하여 새로운 모델에 대한 최적화 보장
        cleanupTextureReferences();
        optimizedSceneIds.current.clear();
        
        // 경고 표시 상태 초기화 - 모델이 변경될 때마다 경고를 다시 표시할 수 있도록
        resetDisplayedWarnings();
        
        // 최적화 상태 초기화
        optimizationStateRef.current = {
          isOptimizingScene: false,
          hasOptimized: false,
          hasAnalyzed: false,
          lastOptimizedUUID: '',
        };
        
        // 메모리 정리 강화
        if (THREE.Cache && typeof THREE.Cache.clear === 'function') {
          THREE.Cache.clear(); // Three.js 캐시 비우기
        }
        
        // 가비지 컬렉션 힌트
        if ('gc' in window) {
          try {
            (window as unknown as { gc: () => void }).gc();
          } catch (e) {
            // gc 함수가 없거나 호출할 수 없는 경우 무시
          }
        }
        
        if (isDev) devLog('불필요한 리소스 정리 완료', 'info');
      }
      
      // 모델 변경 시 한 번만 모델 분석 수행
      if (isDev && !optimizationStateRef.current.hasAnalyzed) {
        // 분리된 유틸리티 함수 사용하여 모델 분석 및 로깅
        const analysis = analyzeAndLogModelInfo(
          scene, 
          component, 
          devLog, 
          startGroup, 
          endGroup
        );
        
        // 분석 결과 저장
        modelAnalysisRef.current = analysis;
        optimizationStateRef.current.hasAnalyzed = true;
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