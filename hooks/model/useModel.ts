import { useGLTF } from '@react-three/drei';
import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { DRACOLoader, KTX2Loader } from 'three-stdlib';
import { ModelComponentType, MODEL_COMPONENTS } from '../../types/scene';
import { MODEL_PRELOAD_MAP } from '../../config/model';
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

// KTX2Loader 싱글톤 관리를 위한 변수 추가
const globalKTX2Loader = {
  instance: null as KTX2Loader | null,
  initialized: false, // 초기화 여부 추적
  loggedThisSession: false, // 세션 중 로깅 여부 추적
  initialize: (renderer: THREE.WebGLRenderer) => {
    if (!globalKTX2Loader.instance) {
      devLog('KTX2Loader 싱글톤 인스턴스 생성', 'info');
      const ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath('/basis/');
      ktx2Loader.detectSupport(renderer);
      globalKTX2Loader.instance = ktx2Loader;
      globalKTX2Loader.initialized = true;
      globalKTX2Loader.loggedThisSession = true;
      return ktx2Loader;
    } else {
      // 이미 초기화된 경우, 중복 로그 방지
      if (!globalKTX2Loader.loggedThisSession) {
        devLog('KTX2Loader 싱글톤 인스턴스 재사용', 'debug');
        globalKTX2Loader.loggedThisSession = true;
      }
      return globalKTX2Loader.instance;
    }
  }
};

// 최적의 텍스처 압축 포맷을 결정하는 함수
function getOptimalTextureFormat(renderer: THREE.WebGLRenderer): string {
  const capabilities = renderer.capabilities;
  const extensions = renderer.extensions;
  
  // 성능 우선 모드 추가 (비활성화)
  const isLowPerformanceMode = false;
  
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
  const hasPreloaded = useRef(false);
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
        
        // KTX2Loader 인스턴스 초기화
        if (globalKTX2Loader.instance) {
          // @ts-ignore - dispose 메서드가 없을 수 있음
          if (globalKTX2Loader.instance.dispose) {
            globalKTX2Loader.instance.dispose();
          }
          globalKTX2Loader.instance = null;
          globalKTX2Loader.initialized = false;
          globalKTX2Loader.loggedThisSession = false;
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

  // 다음 모델 프리로드
  const preloadNextModel = useCallback(async () => {
    if (!hasPreloaded.current && !MODEL_PRELOAD_MAP[component]) {
      const currentIndex = MODEL_COMPONENTS.indexOf(component);
      const nextIndex = (currentIndex + 1) % MODEL_COMPONENTS.length;
      const nextComponent = MODEL_COMPONENTS[nextIndex];
      
      // 다음 모델의 경로도 현재 디바이스 타입에 맞게 설정
      const nextModelPath = `${basePath}/models/main/${modelFolder}/compressed_${nextComponent.toLowerCase()}${modelSuffix}.glb`;
      
      try {
        await useGLTF.preload(nextModelPath);
        MODEL_PRELOAD_MAP[component] = true;
        hasPreloaded.current = true;
        devLog(`다음 모델 프리로드 완료: ${nextComponent}`, 'debug');
      } catch (error) {
        devLog(`다음 모델 프리로드 실패: ${error}`, 'error');
      }
    }
  }, [basePath, component, modelFolder, modelSuffix]);

  // GLTF 모델 로드
  const { scene } = useGLTF(modelPath, true, undefined, (loader) => {
    // Draco 로더 설정
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' }); // 웹어셈블리 대신 JS 디코더 사용 (초기 로딩 시간 단축)
    loader.setDRACOLoader(dracoLoader);

    // KTX2 로더 설정 - 싱글톤 패턴 적용
    if (renderer) {
      // 최적의 텍스처 포맷 결정
      const optimalFormat = getOptimalTextureFormat(renderer);
      
      // 기존 KTX2Loader 인스턴스 재사용
      const ktx2Loader = globalKTX2Loader.initialize(renderer);
      loader.setKTX2Loader(ktx2Loader);
      
      // 압축 텍스처 지원 여부 확인
      const capabilities = renderer.capabilities;
      const extensions = renderer.extensions;
      const isCompressedTexturesSupported = 
        capabilities.isWebGL2 && 
        (extensions.get('WEBGL_compressed_texture_astc') || 
         extensions.get('WEBGL_compressed_texture_etc') || 
         extensions.get('WEBGL_compressed_texture_etc1') ||
         extensions.get('WEBGL_compressed_texture_s3tc') ||
         extensions.get('WEBGL_compressed_texture_pvrtc'));
      
      if (!isCompressedTexturesSupported && isDev) {
        devLog(`현재 브라우저는 ${optimalFormat} 압축 텍스처를 지원하지 않습니다. 압축되지 않은 텍스처가 대신 사용될 수 있습니다.`, 'warn');
      } else if (isDev) {
        devLog(`최적의 텍스처 압축 포맷: ${optimalFormat}`, 'info');
      }
      
      // 세션별 한 번만 로그 출력 (첫 초기화 또는 재사용 시)
      if (globalKTX2Loader.loggedThisSession) {
        if (isDev) devLog('KTX2 텍스처 로더가 활성화되었습니다.', 'info');
        globalKTX2Loader.loggedThisSession = false; // 다음 로그를 방지하기 위해 리셋
      }
    } else if (isDev) {
      devLog('렌더러가 제공되지 않아 KTX2 텍스처 로더를 설정할 수 없습니다.', 'warn');
    }

    // 로더에 타임아웃 설정 (10초)
    loader.manager.onStart = (url) => {
      setTimeout(() => {
        // 10초 이상 로딩이 안 되면 로딩 완료로 간주
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

  // 모델 변경 시 프리로드
  useEffect(() => {
    if (previousScene !== scene && scene) {
      preloadNextModel();
    }
  }, [previousScene, scene, preloadNextModel]);

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