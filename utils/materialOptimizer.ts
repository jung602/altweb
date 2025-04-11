import * as THREE from 'three';
import { 
  estimateTextureMemory, 
  formatBytes, 
  getTextureType, 
  calculateTextureCompressionRatio, 
  analyzeCompressedTextures 
} from './sceneCleanup';
import { logger } from './logger';

// 텍스처 및 씬 최적화 상태 관리를 위한 클래스
class OptimizationTracker {
  private optimizedTextures: Set<string> = new Set<string>();
  private loggedTextures: Set<string> = new Set<string>();
  private optimizedScenes: Set<string> = new Set<string>();
  private debugMode: boolean = process.env.NODE_ENV === 'development';

  // 텍스처 최적화 여부 확인
  public isTextureOptimized(textureId: string): boolean {
    return this.optimizedTextures.has(textureId);
  }

  // 텍스처 최적화 상태 설정
  public setTextureOptimized(textureId: string): void {
    this.optimizedTextures.add(textureId);
  }

  // 텍스처 로깅 여부 확인
  public isTextureLogged(textureId: string): boolean {
    return this.loggedTextures.has(textureId);
  }

  // 텍스처 로깅 상태 설정
  public setTextureLogged(textureId: string): void {
    this.loggedTextures.add(textureId);
  }

  // 씬 최적화 여부 확인
  public isSceneOptimized(sceneId: string): boolean {
    return this.optimizedScenes.has(sceneId);
  }

  // 씬 최적화 상태 설정
  public setSceneOptimized(sceneId: string): void {
    this.optimizedScenes.add(sceneId);
  }

  // 모든 캐시 초기화
  public resetCache(): void {
    this.optimizedTextures.clear();
    this.loggedTextures.clear();
    this.optimizedScenes.clear();
    if (this.debugMode) {
      logger.log('텍스처 최적화 캐시 리셋됨', 'debug');
    }
  }

  // 텍스처 참조 정리
  public clearTextureReferences(count: number = 0): number {
    const previousSize = this.optimizedTextures.size;
    if (count > 0 && count < previousSize) {
      // 부분 정리
      let clearedCount = 0;
      const texturesToKeep = new Set<string>();
      
      // 최근 count개 텍스처만 유지
      const textureIds = Array.from(this.optimizedTextures);
      const keepStartIndex = Math.max(0, textureIds.length - count);
      
      for (let i = keepStartIndex; i < textureIds.length; i++) {
        texturesToKeep.add(textureIds[i]);
      }
      
      clearedCount = previousSize - texturesToKeep.size;
      this.optimizedTextures = texturesToKeep;
      
      if (this.debugMode) {
        logger.log(`텍스처 참조 정리: ${clearedCount}개 제거됨, 남은 최적화된 텍스처: ${this.optimizedTextures.size}개`, 'debug');
      }
      
      return clearedCount;
    } else if (count === 0) {
      // 전체 정리
      this.optimizedTextures.clear();
      this.loggedTextures.clear();
      
      if (this.debugMode) {
        logger.log(`텍스처 참조 정리: ${previousSize}개 제거됨, 남은 최적화된 텍스처: 0개`, 'debug');
      }
      
      return previousSize;
    }
    
    return 0;
  }

  // 최적화 텍스처 개수 반환
  public getOptimizedTextureCount(): number {
    return this.optimizedTextures.size;
  }
}

// 전역 최적화 트래커 인스턴스
const optimizationTracker = new OptimizationTracker();

/**
 * 텍스처 최적화 옵션 인터페이스
 */
export interface TextureOptions {
  colorSpace?: THREE.ColorSpace;
  anisotropy?: number;
  minFilter?: THREE.TextureFilter;
  magFilter?: THREE.TextureFilter;
  logInfo?: boolean;
  isMobile?: boolean;
  supportKTX2?: boolean;  // KTX2 지원 여부
  onTextureLoad?: (texture: THREE.Texture) => void;
}

/**
 * 재질 최적화 옵션 인터페이스
 */
export interface MaterialOptions extends TextureOptions {
  defaultColor?: THREE.Color;
  checkTextureLoaded?: boolean;
}

/**
 * 씬 최적화 옵션 인터페이스
 */
export interface SceneOptions extends MaterialOptions {
  setShadows?: boolean;
  disableShadows?: boolean;
  detectKTX2?: boolean; // KTX2 텍스처 자동 감지 여부
}

/**
 * 텍스처를 업데이트하는 함수
 * @param texture - 업데이트할 텍스처
 * @param options - 업데이트 옵션
 */
export function updateTexture(
  texture: THREE.Texture | null | undefined,
  options: TextureOptions = {}
): void {
  if (!texture) return;
  
  // 이미 최적화된 텍스처는 건너뛰기 (UUID 기반 확인)
  const textureId = texture.uuid;
  if (optimizationTracker.isTextureOptimized(textureId)) {
    if (process.env.NODE_ENV === 'development') {
      logger.log(`텍스처 중복 최적화 방지 (UUID: ${textureId.substring(0, 8)}...)`, 'debug');
    }
    return;
  }
  
  // 최적화 전에 Set에 추가하여 중복 방지
  optimizationTracker.setTextureOptimized(textureId);
  
  // 기본 옵션 설정
  const defaultOptions: TextureOptions = {
    colorSpace: THREE.LinearSRGBColorSpace,
    anisotropy: options.isMobile ? 4 : 16,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    logInfo: false,
    supportKTX2: true  // 기본적으로 KTX2 지원
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 텍스처 속성 설정
  texture.colorSpace = mergedOptions.colorSpace as THREE.ColorSpace;
  
  // 모바일 최적화 설정
  if (mergedOptions.anisotropy !== undefined) {
    texture.anisotropy = mergedOptions.anisotropy;
  }
  
  if (mergedOptions.minFilter !== undefined) {
    texture.minFilter = mergedOptions.minFilter;
  }
  
  if (mergedOptions.magFilter !== undefined) {
    texture.magFilter = mergedOptions.magFilter as THREE.MagnificationTextureFilter;
  }
  
  // KTX2 텍스처 처리 (CompressedTexture 타입인 경우)
  if (mergedOptions.supportKTX2 && texture.source?.data) {
    // KTX2/압축 텍스처 형식인 경우 추가 최적화
    if (texture instanceof THREE.CompressedTexture) {
      // 압축 텍스처에 최적화된 필터 설정
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false; // 압축 텍스처는 자체 밉맵 포함
      
      // KTX2 텍스처는 이미 압축되어 있으므로 메모리 최적화를 위한 추가 설정
      texture.flipY = false; // 텍스처 뒤집기 비활성화
      
      // 압축 텍스처 처리 실패를 로그 기록 (웹 콘솔에서 오류를 확인할 수 있습니다)
      if (process.env.NODE_ENV === 'development') {
        // 압축 텍스처 사용 시 발생하는 오류는 콘솔에 자동으로 기록됩니다
        // 여기서는 압축 텍스처 정보만 로깅합니다
        logger.log(`압축 텍스처 사용 중: ${texture.name || 'unnamed'} (포맷: ${(texture as any).format?.toString(16) || '알 수 없음'})`, 'resource');
      }
      
      if (mergedOptions.logInfo && !optimizationTracker.isTextureLogged(textureId)) {
        const type = getTextureType(texture);
        const size = estimateTextureMemory(texture);
        const width = texture.image?.width || 0;
        const height = texture.image?.height || 0;
        const compressionRatio = calculateTextureCompressionRatio(texture);
        const originalSize = width * height * 4; // 비압축 RGBA 기준
        
        logger.log(`${type} 압축 텍스처 최적화 적용: ${texture.name || 'unnamed'} (UUID: ${texture.uuid.substring(0, 8)}...)`, 'resource');
        if (logger.getLogLevel() === 'detailed' || logger.getLogLevel() === 'verbose') {
          logger.log(`  - 크기: ${width}×${height}`, 'resource');
          logger.log(`  - 메모리: ${formatBytes(size)} (원본 대비 ${Math.round(compressionRatio * 100)}%, ${formatBytes(originalSize)} 절약)`, 'resource');
          logger.log(`  - 포맷: ${(texture as any).format?.toString(16) || '알 수 없음'}`, 'resource');
        }
        
        // 로깅된 텍스처 추적
        optimizationTracker.setTextureLogged(textureId);
      }
    }
  }
  
  // 텍스처 정보 로깅
  if (mergedOptions.logInfo && texture.source?.data?.src && !optimizationTracker.isTextureLogged(textureId)) {
    console.log('텍스처 URL:', texture.source.data.src);
    optimizationTracker.setTextureLogged(textureId);
  }
  
  // 텍스처 업데이트 플래그 설정
  texture.needsUpdate = true;
  
  // 외부 텍스처 로드 콜백 호출
  if (mergedOptions.onTextureLoad) {
    mergedOptions.onTextureLoad(texture);
  }
}

/**
 * 재질의 모든 텍스처를 업데이트하는 함수
 * @param material - 텍스처를 업데이트할 재질
 * @param options - 업데이트 옵션
 */
export function updateMaterialTextures(
  material: THREE.Material,
  options: TextureOptions = {}
): void {
  // 확장 옵션으로 KTX2 지원 확인
  const ktx2Enabled = options.supportKTX2 !== false;
  const textures: (THREE.Texture | null | undefined)[] = [];
  
  // 재질 종류에 따라 해당하는 모든 텍스처 수집
  if (material instanceof THREE.MeshStandardMaterial) {
    textures.push(
      material.map,
      material.normalMap,
      material.roughnessMap,
      material.metalnessMap,
      material.aoMap,
      material.emissiveMap,
      material.displacementMap,
      material.alphaMap,
      material.bumpMap,
      material.envMap,
      material.lightMap
    );
    
    // 텍스처 최적화 설정
    textures.forEach(texture => {
      if (texture && texture instanceof THREE.CompressedTexture) {
        // 플랫폼별 최적화 설정
        if (navigator.platform.includes('Mac') && /arm/i.test(navigator.userAgent)) {
          // Apple Silicon Mac: ASTC 최적화
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
        } else if (navigator.platform.includes('Win')) {
          // Windows: S3TC 최적화
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
        } else if (/Android/i.test(navigator.userAgent)) {
          // Android: ETC2 최적화
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
        } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          // iOS: PVRTC 최적화
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
        }
      }
    });
    
    // KTX2 텍스처 사용 시 메탈릭/러프니스 최적화
    if (ktx2Enabled) {
      // 메탈릭 러프니스 맵을 사용하는 경우 관련 설정 최적화
      if (material.metalnessMap || material.roughnessMap) {
        // KTX2 압축 텍스처에서는 메탈릭/러프니스 값을 직접 설정하는 것이 효율적일 수 있음
        if (!material.metalnessMap) material.metalness = 0.5;
        if (!material.roughnessMap) material.roughness = 0.5;
      }
    }
  } else if (material instanceof THREE.MeshPhysicalMaterial) {
    textures.push(
      material.map,
      material.normalMap,
      material.roughnessMap,
      material.metalnessMap,
      material.aoMap,
      material.emissiveMap,
      material.displacementMap,
      material.alphaMap,
      material.bumpMap,
      material.clearcoatMap,
      material.clearcoatNormalMap,
      material.clearcoatRoughnessMap,
      material.envMap,
      material.lightMap,
      material.sheenColorMap,
      material.sheenRoughnessMap,
      material.specularIntensityMap,
      material.specularColorMap,
      material.thicknessMap,
      material.transmissionMap
    );
  } else if (material instanceof THREE.MeshBasicMaterial ||
             material instanceof THREE.MeshPhongMaterial) {
    textures.push(
      material.map,
      material.alphaMap,
      material.aoMap,
      material.envMap,
      material.lightMap,
      // 추가 속성 (MeshPhongMaterial에만 존재)
      (material as any).bumpMap,
      (material as any).displacementMap,
      (material as any).emissiveMap,
      (material as any).normalMap,
      (material as any).specularMap
    );
  }
  
  // 수집된 모든 텍스처 업데이트
  textures.forEach(texture => {
    if (texture) {
      updateTexture(texture, options);
    }
  });
}

/**
 * 재질 최적화 함수
 * @param material - 최적화할 재질
 * @param options - 최적화 옵션
 */
export function optimizeMaterial(
  material: THREE.Material, 
  options: MaterialOptions = {}
): void {
  // 재질의 모든 텍스처 업데이트
  updateMaterialTextures(material, options);
  
  // 기본 재질 속성 최적화
  material.side = THREE.FrontSide; // 전면만 렌더링 (성능 최적화)
  
  // 모바일에서는 불필요한 효과 비활성화
  if (options.isMobile) {
    material.precision = 'lowp'; // 낮은 정밀도 설정
    
    // 추가적인 모바일 최적화 - 쉐이더 복잡도 감소
    if (material instanceof THREE.MeshStandardMaterial) {
      material.metalness = material.metalnessMap ? material.metalness : 0;
      material.roughness = material.roughnessMap ? material.roughness : 1;
      material.aoMapIntensity = material.aoMap ? material.aoMapIntensity : 0;
    } else if (material instanceof THREE.MeshPhongMaterial) {
      material.shininess = 0; // 광택 비활성화
      material.reflectivity = 0; // 반사 비활성화
    }
  }
  
  // 기본 색상 설정 (텍스처가 없을 때)
  if (options.defaultColor) {
    if (material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshPhongMaterial ||
        material instanceof THREE.MeshBasicMaterial) {
      if (!material.map) {
        material.color = options.defaultColor;
      }
    }
  }
}

/**
 * 씬 최적화 함수
 * @param scene - 최적화할 씬
 * @param options - 최적화 옵션
 */
export function optimizeScene(
  scene: THREE.Object3D,
  options: SceneOptions = {}
): void {
  if (!scene) return;
  
  // 이미 최적화된 씬은 건너뛰기
  const sceneId = scene.uuid;
  if (optimizationTracker.isSceneOptimized(sceneId)) {
    if (process.env.NODE_ENV === 'development') {
      logger.log(`씬 중복 최적화 방지 (UUID: ${sceneId.substring(0, 8)}...)`, 'debug');
    }
    return;
  }
  
  // 최적화 상태 설정
  optimizationTracker.setSceneOptimized(sceneId);
  
  if (process.env.NODE_ENV === 'development') {
    logger.log(`씬 최적화 시작 - 이미 최적화된 텍스처: ${optimizationTracker.getOptimizedTextureCount()}개`, 'debug');
  }
  
  // 씬을 순회하면서 모든 재질 최적화
  scene.traverse(object => {
    // 메시 처리
    if (object instanceof THREE.Mesh) {
      // 단일 재질
      if (object.material instanceof THREE.Material) {
        optimizeMaterial(object.material, options);
      }
      // 다중 재질 (배열)
      else if (Array.isArray(object.material)) {
        object.material.forEach(mat => {
          if (mat) optimizeMaterial(mat, options);
        });
      }
      
      // 그림자 설정
      if (options.setShadows) {
        object.castShadow = true;
        object.receiveShadow = true;
      } else if (options.disableShadows) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    }
  });
}

/**
 * 발광 텍스처 밝기를 조절하는 함수
 * @param material - 조절할 재질
 * @param intensity - 밝기 (0.0 ~ 1.0)
 * @param options - 옵션
 */
export function setEmissionIntensity(
  material: THREE.Material,
  intensity: number = 0.5,
  options: { logInfo?: boolean } = {}
): void {
  if (!material) return;
  
  // MeshStandardMaterial과 MeshPhysicalMaterial만 처리
  if (material instanceof THREE.MeshStandardMaterial) {
    // 발광 맵이 있는 경우만 처리
    if (material.emissiveMap) {
      // 발광 색상 유지하면서 강도만 조절
      const emissiveColor = material.emissive;
      material.emissive.setRGB(emissiveColor.r, emissiveColor.g, emissiveColor.b);
      material.emissiveIntensity = intensity;
      
      if (options.logInfo && process.env.NODE_ENV === 'development') {
        logger.log(`발광 강도 ${intensity.toFixed(2)}로 조절됨`, 'debug');
      }
    }
  }
}

/**
 * 씬 내의 모든 발광 텍스처 밝기를 조절하는 함수
 * @param scene - 조절할 씬
 * @param intensity - 밝기 (0.0 ~ 1.0)
 * @param options - 옵션
 */
export function setSceneEmissionIntensity(
  scene: THREE.Object3D,
  intensity: number = 0.5,
  options: { logInfo?: boolean } = {}
): void {
  if (!scene) return;
  
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      // 단일 재질
      if (object.material instanceof THREE.Material) {
        setEmissionIntensity(object.material, intensity, options);
      }
      // 다중 재질 (배열)
      else if (Array.isArray(object.material)) {
        object.material.forEach(mat => {
          if (mat) setEmissionIntensity(mat, intensity, options);
        });
      }
    }
  });
}

/**
 * 텍스처 참조 정리 함수
 * @param scene - 정리할 씬
 * @param keepLatest - 유지할 최근 텍스처 수 (기본값: 0, 전체 정리)
 * @returns 제거된 텍스처 수
 */
export function clearTextureReferences(scene: THREE.Object3D, keepLatest: number = 0): number {
  return optimizationTracker.clearTextureReferences(keepLatest);
}

/**
 * 씬 재질 최적화 함수 (래퍼)
 */
export const optimizeSceneMaterials = (scene: THREE.Object3D, options: SceneOptions = {}) => {
  optimizeScene(scene, options);
};

/**
 * 씬 텍스처 업데이트 함수 (래퍼)
 */
export const updateSceneTextures = (scene: THREE.Object3D, options: TextureOptions = {}) => {
  if (!scene) return;
  
  // 이미 최적화된 씬은 건너뛰기 (중복 최적화 방지)
  const sceneId = scene.uuid;
  const optimizationKey = `${sceneId}_updateSceneTextures`;
  
  if (!optimizationTracker.isTextureOptimized(optimizationKey)) {
    optimizationTracker.setTextureOptimized(optimizationKey);
    
    if (process.env.NODE_ENV === 'development') {
      logger.log(`씬 중복 최적화 방지 (updateSceneTextures 호출) (UUID: ${sceneId.substring(0, 8)}...)`, 'debug');
    }
    
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        if (object.material instanceof THREE.Material) {
          updateMaterialTextures(object.material, options);
        } else if (Array.isArray(object.material)) {
          object.material.forEach(mat => {
            if (mat) updateMaterialTextures(mat, options);
          });
        }
      }
    });
  }
};

/**
 * 모바일용 씬 최적화 함수 (래퍼)
 */
export const optimizeSceneForMobile = (scene: THREE.Object3D, options: SceneOptions = {}) => {
  optimizeScene(scene, { ...options, isMobile: true });
};

/**
 * 씬 재질 문제 확인 및 수정 함수
 */
export const checkAndFixSceneMaterials = (scene: THREE.Object3D): boolean => {
  if (!scene) return false;
  
  // 이미 최적화된 씬은 건너뛰기
  const sceneId = scene.uuid;
  if (optimizationTracker.isSceneOptimized(`${sceneId}_fix`)) {
    if (process.env.NODE_ENV === 'development') {
      logger.log(`씬 중복 최적화 방지 (UUID: ${sceneId.substring(0, 8)}...)`, 'debug');
    }
    return false;
  }
  
  optimizationTracker.setSceneOptimized(`${sceneId}_fix`);
  
  let hasFixedMaterials = false;
  
  // 씬을 순회하면서 재질 문제 확인 및 수정
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      // 단일 재질
      if (object.material instanceof THREE.Material) {
        if (fixMaterialIssues(object.material)) {
          hasFixedMaterials = true;
        }
      }
      // 다중 재질 (배열)
      else if (Array.isArray(object.material)) {
        object.material.forEach(mat => {
          if (mat && fixMaterialIssues(mat)) {
            hasFixedMaterials = true;
          }
        });
      }
    }
  });
  
  return hasFixedMaterials;
};

/**
 * 재질 문제 확인 및 수정 함수
 */
function fixMaterialIssues(material: THREE.Material): boolean {
  let hasFixed = false;
  
  // MeshStandardMaterial에서 에러 가능성이 있는 설정 확인 및 수정
  if (material instanceof THREE.MeshStandardMaterial) {
    // 텍스처 누락 시 관련 값 조정
    if (material.metalnessMap === null && material.metalness > 0) {
      material.metalness = 0;
      hasFixed = true;
    }
    
    if (material.roughnessMap === null && material.roughness < 1) {
      material.roughness = 1;
      hasFixed = true;
    }
    
    if (material.emissiveMap === null && material.emissive.getHex() !== 0) {
      material.emissive.set(0x000000);
      hasFixed = true;
    }
  }
  
  return hasFixed;
}

/**
 * 최적화 캐시 초기화 함수
 */
export function resetTextureOptimizationCache(): void {
  optimizationTracker.resetCache();
} 