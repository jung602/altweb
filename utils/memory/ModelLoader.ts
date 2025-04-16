/**
 * 모델 로더 유틸리티
 * GLTF 모델을 로드하는 함수를 제공합니다.
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { ModelComponentType } from '../../types/model';
import { logger } from '../logger';
import { MODEL_PRELOAD_MAP } from '../../config/model';
import { disposeSceneResources } from './ResourceDisposal';
import { Preloader } from './Preloader';

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
 * 모델 컴포넌트 타입에 따른 경로를 생성합니다.
 * @param component 모델 컴포넌트 타입
 * @returns 모델 경로
 */
export function getModelPath(component: ModelComponentType): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const modelFolder = 'models';
  
  return `${basePath}/${modelFolder}/${component}.glb`;
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
 * GLTF 모델을 로드합니다.
 * @param component 모델 컴포넌트 타입
 * @param options 추가 로딩 옵션
 * @returns Promise<GLTF>
 */
export async function loadGLTFModel(
  component: ModelComponentType, 
  options: any = {}
): Promise<GLTF> {
  const modelPath = getModelPath(component);
  
  // 캐시에서 모델 찾기
  if (modelCache.has(modelPath)) {
    const cachedModel = modelCache.get(modelPath)!;
    
    // 새 인스턴스를 반환하여 독립적으로 조작할 수 있게 함
    const clonedScene = cloneScene(cachedModel.scene);
    
    return {
      ...cachedModel,
      scene: clonedScene
    };
  }
  
  // 로더 가져오기
  const loader = getGLTFLoader();
  
  try {
    // 모델 로드
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      loader.load(
        modelPath,
        (gltf) => resolve(gltf),
        undefined, // onProgress
        (error) => reject(error)
      );
    });
    
    // 모델 캐시에 저장
    modelCache.set(modelPath, gltf);
    
    // 프리로드 맵 업데이트
    if (MODEL_PRELOAD_MAP[component] !== undefined) {
      MODEL_PRELOAD_MAP[component] = true;
    }
    
    // 원본 반환
    return gltf;
  } catch (error) {
    logger.error(`모델 로드 에러 (${component}): ${error}`);
    throw error;
  }
}

/**
 * 모델 캐시를 지웁니다.
 * @param component 특정 컴포넌트만 지울 경우 지정 (생략 시 전체 캐시 삭제)
 */
export function clearModelCache(component?: ModelComponentType): void {
  if (component) {
    const modelPath = getModelPath(component);
    modelCache.delete(modelPath);
    
    // 프리로드 맵 업데이트
    if (MODEL_PRELOAD_MAP[component] !== undefined) {
      MODEL_PRELOAD_MAP[component] = false;
    }
    
    logger.log(`모델 캐시 지움: ${component}`, 'resource');
  } else {
    modelCache.clear();
    
    // 프리로드 맵 초기화
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
  // Preloader를 사용하여 모델 프리로드
  const preloader = Preloader.getInstance();
  preloader.enqueueModels(components);

  logger.log(`${components.length}개 모델 프리로더에 등록됨`, 'resource');
}

/**
 * 특정 모델이 로드되었는지 확인합니다.
 * @param component 확인할 모델 컴포넌트
 * @returns 로드 여부
 */
export function isModelLoaded(component: ModelComponentType): boolean {
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