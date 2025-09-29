/**
 * 모델 로더 유틸리티
 * GLTF 모델을 로드하는 함수를 제공합니다.
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ModelComponentType, MODEL_COMPONENTS } from '../../types/model';
import { logger, devLog } from '../logger';
import { MODEL_PRELOAD_MAP } from '../../config/model';
import { disposeSceneResources } from './ResourceDisposal';

// GLTF 로더 캐시
let gltfLoader: GLTFLoader | null = null;
let dracoLoader: DRACOLoader | null = null;

// 모델 캐시
const modelCache: Map<string, GLTF> = new Map();

// 모델 로딩 디버깅 로그 그룹 ID
const MODEL_LOADING_GROUP_ID = 'model-loading';

/**
 * GLTF 로더 인스턴스를 가져옵니다.
 */
function getGLTFLoader(): GLTFLoader {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    
    // Draco 압축된 모델 지원
    if (!dracoLoader) {
      dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/draco/');
    }
    
    gltfLoader.setDRACOLoader(dracoLoader);
  }
  
  return gltfLoader;
}

/**
 * 모델 경로를 가져옵니다.
 * @param component 모델 컴포넌트 타입
 * @returns 모델 파일 경로
 */
export function getModelPath(component: ModelComponentType, isMobile: boolean = false): string {
  const basePath = isMobile ? '/models/main/draco-mobile/' : '/models/main/draco/';
  const suffix = isMobile ? '_mobile_draco' : '_draco';

  switch (component) {
    case 'Alt1':
      return `${basePath}compressed_alt1${suffix}.glb`;
    case 'Alt2':
      return `${basePath}compressed_alt2${suffix}.glb`;
    case 'Alt3':
      return `${basePath}compressed_alt3${suffix}.glb`;
    case 'Alt4':
      return `${basePath}compressed_alt4${suffix}.glb`;
    case 'Alt5':
      return `${basePath}compressed_alt5${suffix}.glb`;
    case 'Alt6':
      return `${basePath}compressed_alt6${suffix}.glb`;
    case 'Alt7':
      return `${basePath}compressed_alt7${suffix}.glb`;
    case 'Alt8':
      return `${basePath}compressed_alt8${suffix}.glb`;
    case 'Alt9':
      return `${basePath}compressed_alt9${suffix}.glb`;
    default:
      return `${basePath}compressed_alt1${suffix}.glb`;
  }
}

/**
 * 씬 객체를 복제합니다.
 * @param source 원본 씬 객체
 * @returns 복제된 씬 객체
 */
export function cloneScene(source: THREE.Group): THREE.Group {
  const clone = source.clone();
  
  // 재질 복제 처리
  const sourceMaterials: {[key: string]: THREE.Material} = {};
  
  source.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) 
          ? mesh.material 
          : [mesh.material];
          
        materials.forEach((material, i) => {
          if (!sourceMaterials[material.uuid]) {
            sourceMaterials[material.uuid] = material.clone();
          }
        });
      }
    }
  });
  
  // 복제된 객체에 복제된 재질 적용
  clone.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      const mesh = object as THREE.Mesh;
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(mat => 
            sourceMaterials[mat.uuid] || mat.clone()
          );
        } else {
          mesh.material = sourceMaterials[mesh.material.uuid] || mesh.material.clone();
        }
      }
    }
  });
  
  return clone;
}

/**
 * GLTF 모델을 로드하는 함수
 * @param componentName 모델 컴포넌트 이름
 * @param textureOptions 텍스처 옵션
 * @returns GLTF 객체 Promise
 */
export async function loadGLTFModel(
  componentName: ModelComponentType, 
  textureOptions: Record<string, any> = {}
): Promise<GLTF> {
  // 이미 캐시된 모델이 있는지 확인
  if (modelCache.has(componentName)) {
    devLog(`캐시된 모델 사용: ${componentName}`, 'debug');
    return modelCache.get(componentName)!;
  }
  
  // 모델 로딩 시작
  devLog(`모델 로딩 시작: ${componentName}`, 'info');
  
  try {
    // 로더 인스턴스 가져오기
    const loader = getGLTFLoader();
    
    // 모델 경로 결정 (모바일/데스크톱)
    const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const modelPath = getModelPath(componentName, isMobile);
    
    // 로드 타임아웃 설정 (30초)
    const LOAD_TIMEOUT = 30000;
    
    // 타임아웃과 로딩을 Promise.race로 경쟁
    const loadPromise = loader.loadAsync(modelPath);
    const timeoutPromise = new Promise<GLTF>((_, reject) => {
      const timeoutId = setTimeout(() => {
        // 타임아웃 발생 시 훨씬 작은 모델로 폴백
        devLog(`모델 로딩 타임아웃: ${modelPath}`, 'warn');
        reject(new Error(`모델 로딩 타임아웃: ${modelPath}`));
      }, LOAD_TIMEOUT);
      
      // 타임아웃 Promise 클리어 함수 (loadPromise가 먼저 완료된 경우 사용)
      loadPromise.then(() => clearTimeout(timeoutId)).catch(() => clearTimeout(timeoutId));
    });
    
    // 로딩 또는 타임아웃 중 먼저 완료되는 것 선택
    try {
      const gltf = await Promise.race([loadPromise, timeoutPromise]);
      
      // 캐시에 저장
      modelCache.set(componentName, gltf);
      
      // 모델 로드 완료 알림
      devLog(`모델 로드 완료: ${componentName}`, 'debug');
      
      return gltf;
    } catch (error: any) {
      // 타임아웃 또는 로드 실패시 대체 모델 시도
      devLog(`대체 모델 로드 시도 중: ${componentName}`, 'warn');
      
      // 폴백 모델 로드 시도
      const fallbackModelPath = getFallbackModelPath(componentName);
      const fallbackGltf = await loader.loadAsync(fallbackModelPath);
      
      // 캐시에 저장
      modelCache.set(componentName, fallbackGltf);
      
      // 성공 알림
      devLog(`대체 모델 로드 성공: ${componentName}`, 'info');
      
      return fallbackGltf;
    }
  } catch (error: any) {
    // 에러 로깅
    devLog(`모델 로드 실패 (${componentName}): ${error.message}`, 'error');
    
    // 에러 전파
    throw error;
  }
}

/**
 * 폴백용 간소화 모델 경로를 가져옵니다.
 * @param componentName 모델 컴포넌트 이름
 * @returns 폴백 모델 경로
 */
function getFallbackModelPath(componentName: ModelComponentType): string {
  // 폴백 모델 경로 결정 (항상 모바일 최적화 버전 사용)
  const basePath = '/models/main/draco-mobile/';

  switch (componentName) {
    case 'Alt1':
      return `${basePath}compressed_alt1_mobile_draco.glb`;
    case 'Alt2':
      return `${basePath}compressed_alt2_mobile_draco.glb`;
    case 'Alt3':
      return `${basePath}compressed_alt3_mobile_draco.glb`;
    case 'Alt4':
      return `${basePath}compressed_alt4_mobile_draco.glb`;
    case 'Alt5':
      return `${basePath}compressed_alt5_mobile_draco.glb`;
    case 'Alt6':
      return `${basePath}compressed_alt6_mobile_draco.glb`;
    case 'Alt7':
      return `${basePath}compressed_alt7_mobile_draco.glb`;
    case 'Alt8':
      return `${basePath}compressed_alt8_mobile_draco.glb`;
    case 'Alt9':
      return `${basePath}compressed_alt9_mobile_draco.glb`;
    default:
      // 기본 폴백 모델
      return `${basePath}compressed_alt2_mobile_draco.glb`;
  }
}

/**
 * 모델 캐시를 지웁니다.
 * @param component 특정 컴포넌트만 지울 경우 지정 (생략 시 전체 캐시 삭제)
 */
export function clearModelCache(component?: ModelComponentType): void {
  if (component) {
    // 특정 컴포넌트 캐시만 삭제
    const modelPath = getModelPath(component);
    modelCache.delete(modelPath);
    
    // 프리로드 맵 업데이트 - 실제 맵에 존재하는 키만 처리
    if (Object.prototype.hasOwnProperty.call(MODEL_PRELOAD_MAP, component)) {
      MODEL_PRELOAD_MAP[component] = false;
    }
    
    logger.log(`모델 캐시 지움: ${component}`, 'resource');
  } else {
    // 전체 캐시 삭제
    modelCache.clear();
    
    // 프리로드 맵 초기화 - 모든 모델을 false로 설정
    Object.keys(MODEL_PRELOAD_MAP).forEach(key => {
      MODEL_PRELOAD_MAP[key as ModelComponentType] = false;
    });
    
    logger.log('모든 모델 캐시 지움', 'resource');
  }
}

/**
 * 모델 사전 로드
 * @param components 사전 로드할 모델 컴포넌트 목록
 */
export async function preloadModels(components: ModelComponentType[]): Promise<void> {
  // 중복 제거와 유효한 컴포넌트만 필터링
  const uniqueValidComponents = [...new Set(components)].filter(comp => 
    MODEL_COMPONENTS.includes(comp) && !MODEL_PRELOAD_MAP[comp]
  );
  
  if (uniqueValidComponents.length === 0) return;
  
  logger.log(`${uniqueValidComponents.length}개 모델 프리로드 시작`, 'resource');
  
  // 각 모델 순차적으로 로드
  for (const component of uniqueValidComponents) {
    try {
      await loadGLTFModel(component);
      MODEL_PRELOAD_MAP[component] = true;
      logger.log(`모델 프리로드 완료: ${component}`, 'resource');
    } catch (error) {
      logger.log(`모델 프리로드 실패: ${component} - ${error}`, 'error');
    }
  }
  
  logger.log(`모델 프리로드 완료`, 'resource');
}

/**
 * 특정 모델이 로드되었는지 확인합니다.
 * @param component 확인할 모델 컴포넌트
 * @returns 로드 여부
 */
export function isModelLoaded(component: ModelComponentType): boolean {
  // 모델 컴포넌트가 유효한지 확인
  if (!MODEL_COMPONENTS.includes(component)) {
    return false;
  }
  
  return MODEL_PRELOAD_MAP[component] === true;
}

/**
 * GLTF 객체를 복제합니다. 이는 동일한 모델의 여러 인스턴스를 사용할 때 필요합니다.
 * @param gltf - 복제할 GLTF 객체
 * @returns GLTF - 복제된 GLTF 객체
 */
function cloneGltf(gltf: GLTF): GLTF {
  // 씬 복제
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true),
    scenes: gltf.scenes.map(s => s.clone(true)),
    cameras: gltf.cameras.map(c => c.clone()),
    asset: gltf.asset,
    parser: gltf.parser,
    userData: { ...gltf.userData }
  };
  
  return clone;
} 