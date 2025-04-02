import * as THREE from 'three';
import { 
  estimateTextureMemory, 
  formatBytes, 
  getTextureType, 
  calculateTextureCompressionRatio, 
  analyzeCompressedTextures 
} from './sceneCleanup';

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
      
      if (mergedOptions.logInfo) {
        const type = getTextureType(texture);
        const size = estimateTextureMemory(texture);
        const width = texture.image?.width || 0;
        const height = texture.image?.height || 0;
        const compressionRatio = calculateTextureCompressionRatio(texture);
        const originalSize = width * height * 4; // 비압축 RGBA 기준
        
        console.log(`${type} 압축 텍스처 최적화 적용:`, texture.name || 'unnamed');
        console.log(`  - 크기: ${width}×${height}`);
        console.log(`  - 메모리: ${formatBytes(size)} (원본 대비 ${Math.round(compressionRatio * 100)}%, ${formatBytes(originalSize)} 절약)`);
        console.log(`  - 포맷: ${(texture as any).format?.toString(16) || '알 수 없음'}`);
      }
    }
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
    
    // KTX2 텍스처 사용 시 메탈릭/러프니스 최적화
    if (ktx2Enabled) {
      // 메탈릭 러프니스 맵을 사용하는 경우 관련 설정 최적화
      if (material.metalnessMap || material.roughnessMap) {
        // KTX2 압축 텍스처에서는 메탈릭/러프니스 값을 직접 설정하는 것이 효율적일 수 있음
        if (!material.metalnessMap) material.metalness = 0.5;
        if (!material.roughnessMap) material.roughness = 0.5;
      }
    }
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
  
  // 모든 텍스처에 대해 업데이트 적용
  textures.forEach(texture => {
    if (texture) updateTexture(texture, options);
  });
  
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
    isMobile: false,
    supportKTX2: true, // KTX2 지원 기본 활성화
    detectKTX2: true   // KTX2 자동 감지 활성화
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // KTX2 자동 감지 및 로깅
  let hasKTX2Textures = false;
  
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
      
      // KTX2 텍스처 감지 
      if (mergedOptions.detectKTX2) {
        const checkMaterial = (mat: THREE.Material) => {
          if (mat instanceof THREE.MeshStandardMaterial || 
              mat instanceof THREE.MeshPhongMaterial || 
              mat instanceof THREE.MeshBasicMaterial) {
            // 모든 텍스처 속성 중 CompressedTexture 형식 확인
            const textures = [
              mat.map, 
              (mat as any).normalMap, 
              (mat as any).roughnessMap,
              (mat as any).metalnessMap
            ];
            
            for (const tex of textures) {
              if (tex instanceof THREE.CompressedTexture) {
                hasKTX2Textures = true;
                break;
              }
            }
          }
        };
        
        if (Array.isArray(child.material)) {
          child.material.forEach(checkMaterial);
        } else if (child.material) {
          checkMaterial(child.material);
        }
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
  
  // KTX2 텍스처 감지 시 로깅
  if (hasKTX2Textures && mergedOptions.logInfo) {
    console.log('KTX2/압축 텍스처가 씬에서 감지되었습니다. 최적화 적용 완료.');
    
    // 텍스처 메모리 분석
    if (mergedOptions.logInfo) {
      const textureAnalysis = analyzeCompressedTextures(scene);
      
      console.group('텍스처 메모리 분석');
      console.log(`총 텍스처: ${textureAnalysis.totalTextures}개`);
      console.log(`압축 텍스처: ${textureAnalysis.compressedTextures}개 (KTX2: ${textureAnalysis.ktx2Textures}개)`);
      console.log(`압축률: ${Math.round((1 - textureAnalysis.compressionRatio) * 100)}% 절약`);
      console.log(`절약된 메모리: ${formatBytes(textureAnalysis.savedMemory)}`);
      
      // 상위 5개 텍스처 정보 출력
      if (textureAnalysis.textureDetails.length > 0) {
        console.log('\n가장 큰 텍스처 (상위 5개):');
        textureAnalysis.textureDetails.slice(0, 5).forEach((detail, index) => {
          console.log(`${index + 1}. ${detail.name} (${detail.type}): ${formatBytes(detail.size)}, ${detail.dimensions}, 압축률: ${Math.round((1 - detail.compressionRatio) * 100)}%`);
        });
      }
      
      console.groupEnd();
    }
  }
}

/**
 * 재질의 emission 텍스처 밝기를 설정하는 함수
 * @param material - 설정할 재질
 * @param intensity - 설정할 emission 강도 (0.0 ~ 1.0)
 * @param options - 추가 옵션
 */
export function setEmissionIntensity(
  material: THREE.Material,
  intensity: number = 0.5,
  options: { logInfo?: boolean } = {}
): void {
  if (material instanceof THREE.MeshStandardMaterial) {
    // Emission 텍스처가 있을 때만 강도 설정
    if (material.emissiveMap) {
      material.emissiveIntensity = intensity;
      
      if (options.logInfo) {
        console.log(`Emission 강도 설정: ${intensity} (${material.name || 'unnamed'})`);
      }
      
      material.needsUpdate = true;
    }
  }
}

/**
 * 씬의 모든 재질에 대해 emission 텍스처 밝기를 설정하는 함수
 * @param scene - 설정할 씬
 * @param intensity - 설정할 emission 강도 (0.0 ~ 1.0)
 * @param options - 추가 옵션
 */
export function setSceneEmissionIntensity(
  scene: THREE.Object3D,
  intensity: number = 0.5,
  options: { logInfo?: boolean } = {}
): void {
  scene.traverse((child: any) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat: THREE.Material) => {
          setEmissionIntensity(mat, intensity, options);
        });
      } else {
        setEmissionIntensity(child.material, intensity, options);
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