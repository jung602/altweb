import * as THREE from 'three';

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
  
  // 기본 옵션 설정
  const defaultOptions: TextureOptions = {
    colorSpace: THREE.LinearSRGBColorSpace,
    anisotropy: options.isMobile ? 4 : 16,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    logInfo: false
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
  
  // 텍스처 정보 로깅
  if (mergedOptions.logInfo && texture.source?.data?.src) {
    console.log('텍스처 URL:', texture.source.data.src);
  }
  
  // 텍스처 업데이트 플래그 설정
  texture.needsUpdate = true;
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
  // 재질 종류에 따라 해당하는 모든 텍스처 업데이트
  if (material instanceof THREE.MeshStandardMaterial) {
    const textures = [
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
    ];
    
    textures.forEach(texture => {
      if (texture) updateTexture(texture, options);
    });
  } else if (material instanceof THREE.MeshBasicMaterial ||
             material instanceof THREE.MeshPhongMaterial) {
    const textures = [
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
    ];
    
    textures.forEach(texture => {
      if (texture) updateTexture(texture, options);
    });
  }
  
  // 재질 업데이트 플래그 설정
  material.needsUpdate = true;
}

/**
 * 재질을 최적화하는 통합 함수
 * @param material - 최적화할 Three.js 재질
 * @param options - 최적화 옵션
 */
export function optimizeMaterial(
  material: THREE.Material, 
  options: MaterialOptions = {}
): void {
  // 기본 옵션 설정
  const defaultOptions: MaterialOptions = {
    defaultColor: new THREE.Color(0xCCCCCC),
    checkTextureLoaded: false,
    isMobile: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 모든 재질에 대해 톤매핑 적용
  material.toneMapped = true;
  
  // 모든 텍스처 업데이트
  updateMaterialTextures(material, mergedOptions);
  
  // 표준 재질에 대한 추가 최적화
  if (material instanceof THREE.MeshStandardMaterial) {
    // 텍스처 로드 확인 옵션이 활성화된 경우
    if (mergedOptions.checkTextureLoaded && material.map && !material.map.image) {
      console.warn('텍스처 이미지가 로드되지 않음:', material.name);
      if (mergedOptions.defaultColor) {
        material.color = mergedOptions.defaultColor;
      }
    }
    
    // 재질이 검은색인 경우 수정
    if (material.color.r === 0 && material.color.g === 0 && material.color.b === 0) {
      console.log('검은색 메테리얼 발견, 복구:', material.name);
      if (mergedOptions.defaultColor) {
        material.color.set(mergedOptions.defaultColor);
      }
    }
    
    // 환경 맵이 있는 경우에만 강도 설정
    if (material.envMap) {
      material.envMapIntensity = 1.0;
    }
  }
  
  // 모든 재질에 대해 needsUpdate 설정
  material.needsUpdate = true;
}

/**
 * 씬의 모든 메시와 재질을 최적화하는 통합 함수
 * @param scene - 최적화할 씬
 * @param options - 최적화 옵션
 */
export function optimizeScene(
  scene: THREE.Object3D,
  options: SceneOptions = {}
): void {
  const defaultOptions: SceneOptions = {
    defaultColor: new THREE.Color(0xCCCCCC),
    checkTextureLoaded: false,
    setShadows: !options.isMobile,
    disableShadows: options.isMobile,
    isMobile: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  scene.traverse((child: any) => {
    if (child.isMesh) {
      // 그림자 설정
      if (mergedOptions.setShadows && !mergedOptions.disableShadows) {
        child.castShadow = true;
        child.receiveShadow = true;
      } else if (mergedOptions.disableShadows) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
      
      // 재질 최적화
      if (Array.isArray(child.material)) {
        child.material.forEach((mat: THREE.Material) => {
          optimizeMaterial(mat, mergedOptions);
        });
      } else if (child.material) {
        optimizeMaterial(child.material, mergedOptions);
      }
    }
  });
}

// 기존 함수명을 유지하지만 새 최적화 함수를 호출하는 래퍼 함수들
export const optimizeSceneMaterials = optimizeScene;
export const updateSceneTextures = (scene: THREE.Object3D, options: TextureOptions = {}) => {
  optimizeScene(scene, options);
};
export const optimizeSceneForMobile = (scene: THREE.Object3D, options: SceneOptions = {}) => {
  optimizeScene(scene, { ...options, isMobile: true });
};
export const checkAndFixSceneMaterials = (scene: THREE.Object3D): boolean => {
  let hasFixedMaterial = false;
  scene.traverse((child: any) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial && 
              mat.color.r === 0 && mat.color.g === 0 && mat.color.b === 0) {
            mat.color.set(0xCCCCCC);
            mat.needsUpdate = true;
            hasFixedMaterial = true;
          }
        });
      } else if (child.material instanceof THREE.MeshStandardMaterial &&
                 child.material.color.r === 0 && child.material.color.g === 0 && child.material.color.b === 0) {
        child.material.color.set(0xCCCCCC);
        child.material.needsUpdate = true;
        hasFixedMaterial = true;
      }
    }
  });
  return hasFixedMaterial;
}; 