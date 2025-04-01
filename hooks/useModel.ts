import { useGLTF } from '@react-three/drei';
import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { DRACOLoader, KTX2Loader } from 'three-stdlib';
import { ModelComponentType, MODEL_COMPONENTS } from '../types/scene';
import { MODEL_PRELOAD_MAP } from '../config/sceneConfig';
import { devLog, startGroup, endGroup, conditionalLog } from '../utils/logger';
import { 
  optimizeSceneMaterials, 
  checkAndFixSceneMaterials,
  optimizeSceneForMobile,
  updateSceneTextures
} from '../utils/materialOptimizer';
import { 
  cleanupGLTFModel, 
  disposeSceneResources, 
  MemoryStats
} from '../utils/sceneCleanup';
import { 
  analyzeAndLogModelInfo,
  checkMemoryUsageAndSuggestOptimizations
} from '../utils/modelAnalyzer';
import { useResponsiveDevice } from './useResponsiveDevice';

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
    loader.setDRACOLoader(dracoLoader);

    // KTX2 로더 설정
    if (renderer) {
      const ktx2Loader = new KTX2Loader();
      ktx2Loader.setTranscoderPath('/basis/');
      ktx2Loader.detectSupport(renderer);
      loader.setKTX2Loader(ktx2Loader);
      if (isDev) devLog('KTX2 텍스처 로더가 활성화되었습니다.', 'info');
    } else if (isDev) {
      devLog('렌더러가 제공되지 않아 KTX2 텍스처 로더를 설정할 수 없습니다.', 'warn');
    }

    loader.manager.onError = (url) => {
      devLog(`텍스처 로드 에러: ${url}`, 'error');
      if (onError) onError(url);
    };

    loader.manager.onLoad = () => {
      setIsNewModelReady(true);
      devLog(`모델 로드 완료: ${component} (${isUsingMobileModel ? '모바일 버전' : '데스크탑 버전'})`, 'debug');
      if (onLoad) onLoad();
    };
  });

  // 씬 초기화 및 최적화
  useEffect(() => {
    if (!scene) return;

    // 씬의 회전 초기화
    scene.rotation.set(0, 0, 0);
    
    // 각 메시 초기화 및 최적화
    scene.traverse((child: any) => {
      if (child.isMesh) {
        // 각 메시의 회전 초기화
        child.rotation.set(0, 0, 0);
        
        // 지오메트리 계산
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }
      }
    });
    
    // 텍스처 업데이트
    updateSceneTextures(scene, {
      logInfo: isDev // 개발 모드에서만 텍스처 정보 로깅
    });
    
    // 재질 최적화
    optimizeSceneMaterials(scene, {
      defaultColor,
      checkTextureLoaded: true,
      setShadows: true
    });
    
    // 모바일 기기를 위한 최적화
    if (isMobile) {
      optimizeSceneForMobile(scene);
    }
  }, [scene, isMobile, isDev, defaultColor]);

  // 메테리얼 정기 점검
  useEffect(() => {
    if (!scene) return;
    
    // 주기적으로 메테리얼 상태 확인 및 업데이트
    const intervalId = setInterval(() => {
      // 확장된 materialOptimizer 유틸리티를 사용하여 씬의 모든 재질 확인 및 수정
      const hasFixedMaterial = checkAndFixSceneMaterials(scene);
      
      if (hasFixedMaterial && isDev) {
        devLog('일부 메테리얼이 수정되었습니다.', 'info');
      }
    }, checkInterval);
    
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
    }
  }, [component, scene]);

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

  // 모델 분석 (개발 모드에서만)
  useEffect(() => {
    if (isDev && scene) {
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
    }
  }, [scene, component, isDev]);

  return {
    scene,
    isNewModelReady,
    previousScene,
    memoryStats: memoryStatsRef.current
  };
} 