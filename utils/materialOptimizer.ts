import * as THREE from 'three';

/**
 * 텍스처를 업데이트하는 함수
 * @param texture - 업데이트할 텍스처
 * @param options - 업데이트 옵션
 */
export function updateTexture(
  texture: THREE.Texture | null | undefined,
  options: {
    colorSpace?: THREE.ColorSpace,
    logInfo?: boolean
  } = {}
) {
  if (!texture) return;
  
  // 기본 옵션 설정
  const defaultOptions = {
    colorSpace: THREE.LinearSRGBColorSpace,
    logInfo: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 색상 공간 설정
  texture.colorSpace = mergedOptions.colorSpace;
  
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
  options: {
    colorSpace?: THREE.ColorSpace,
    logInfo?: boolean
  } = {}
) {
  if (material instanceof THREE.MeshStandardMaterial) {
    // 모든 텍스처 업데이트
    if (material.map) updateTexture(material.map, options);
    if (material.normalMap) updateTexture(material.normalMap, options);
    if (material.roughnessMap) updateTexture(material.roughnessMap, options);
    if (material.metalnessMap) updateTexture(material.metalnessMap, options);
    if (material.aoMap) updateTexture(material.aoMap, options);
    if (material.emissiveMap) updateTexture(material.emissiveMap, options);
    if (material.displacementMap) updateTexture(material.displacementMap, options);
    if (material.alphaMap) updateTexture(material.alphaMap, options);
    if (material.bumpMap) updateTexture(material.bumpMap, options);
    if (material.envMap) updateTexture(material.envMap, options);
    if (material.lightMap) updateTexture(material.lightMap, options);
  } else if (material instanceof THREE.MeshBasicMaterial) {
    if (material.map) updateTexture(material.map, options);
    if (material.alphaMap) updateTexture(material.alphaMap, options);
    if (material.aoMap) updateTexture(material.aoMap, options);
    if (material.envMap) updateTexture(material.envMap, options);
    if (material.lightMap) updateTexture(material.lightMap, options);
  } else if (material instanceof THREE.MeshPhongMaterial) {
    if (material.map) updateTexture(material.map, options);
    if (material.alphaMap) updateTexture(material.alphaMap, options);
    if (material.bumpMap) updateTexture(material.bumpMap, options);
    if (material.displacementMap) updateTexture(material.displacementMap, options);
    if (material.emissiveMap) updateTexture(material.emissiveMap, options);
    if (material.normalMap) updateTexture(material.normalMap, options);
    if (material.specularMap) updateTexture(material.specularMap, options);
  }
  
  // 재질 업데이트 플래그 설정
  material.needsUpdate = true;
}

/**
 * 씬의 모든 텍스처를 업데이트하는 함수
 * @param scene - 텍스처를 업데이트할 씬
 * @param options - 업데이트 옵션
 */
export function updateSceneTextures(
  scene: THREE.Object3D,
  options: {
    colorSpace?: THREE.ColorSpace,
    logInfo?: boolean
  } = {}
) {
  scene.traverse((child: any) => {
    if (child.isMesh) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat: THREE.Material) => {
          updateMaterialTextures(mat, options);
        });
      } else if (child.material) {
        updateMaterialTextures(child.material, options);
      }
    }
  });
}

/**
 * 재질을 최적화하는 함수
 * @param material - 최적화할 Three.js 재질
 * @param options - 최적화 옵션
 */
export function optimizeMaterial(
  material: THREE.Material, 
  options: {
    defaultColor?: THREE.Color,
    checkTextureLoaded?: boolean
  } = {}
) {
  // 기본 옵션 설정
  const defaultOptions = {
    defaultColor: new THREE.Color(0xCCCCCC),
    checkTextureLoaded: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 모든 재질에 대해 톤매핑 적용
  material.toneMapped = true;
  
  if (material instanceof THREE.MeshStandardMaterial) {
    // 텍스처 업데이트 함수 사용
    updateMaterialTextures(material, {
      colorSpace: THREE.LinearSRGBColorSpace
    });
    
    // 텍스처 로드 확인 옵션이 활성화된 경우
    if (mergedOptions.checkTextureLoaded && material.map && !material.map.image) {
      console.warn('텍스처 이미지가 로드되지 않음:', material.name);
      material.color = mergedOptions.defaultColor;
    }
    
    // 원래 메테리얼 속성을 크게 변경하지 않도록 수정
    // 거칠기와 금속성 제한을 제거하고 원래 값을 유지
    
    // 원래 설정이 있는 경우에만 조정
    if (material.emissiveIntensity !== undefined && material.emissiveIntensity > 0) {
      // 원래 방사 강도 유지
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
 * 메시의 모든 재질을 최적화하는 함수
 * @param mesh - 최적화할 메시
 * @param options - 최적화 옵션
 */
export function optimizeMeshMaterials(
  mesh: THREE.Mesh,
  options: {
    defaultColor?: THREE.Color,
    checkTextureLoaded?: boolean
  } = {}
) {
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((mat: THREE.Material) => {
      optimizeMaterial(mat, options);
    });
  } else if (mesh.material) {
    optimizeMaterial(mesh.material, options);
  }
}

/**
 * 씬의 모든 메시와 재질을 최적화하는 함수
 * @param scene - 최적화할 씬
 * @param options - 최적화 옵션
 */
export function optimizeSceneMaterials(
  scene: THREE.Object3D,
  options: {
    defaultColor?: THREE.Color,
    checkTextureLoaded?: boolean,
    setShadows?: boolean
  } = {}
) {
  const defaultOptions = {
    defaultColor: new THREE.Color(0xCCCCCC),
    checkTextureLoaded: false,
    setShadows: true
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  scene.traverse((child: any) => {
    if (child.isMesh) {
      // 그림자 설정
      if (mergedOptions.setShadows) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      
      // 재질 최적화
      optimizeMeshMaterials(child, mergedOptions);
    }
  });
}

/**
 * 메시 재질의 문제를 확인하고 수정하는 함수
 * @param mesh - 확인할 메시
 * @returns 수정이 이루어졌는지 여부
 */
export function checkAndFixMaterial(mesh: THREE.Mesh): boolean {
  let hasFixedMaterial = false;
  
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((mat: THREE.Material) => {
      if (mat instanceof THREE.MeshStandardMaterial) {
        // 메테리얼이 검은색이거나 비정상적으로 보이는 경우 확인
        if (mat.color.r === 0 && mat.color.g === 0 && mat.color.b === 0) {
          console.log('검은색 메테리얼 발견, 복구 시도:', mat.name);
          mat.color.set(0xCCCCCC);
          mat.needsUpdate = true;
          hasFixedMaterial = true;
        }
        
        // 텍스처 업데이트 플래그 설정
        if (mat.map) mat.map.needsUpdate = true;
      }
    });
  } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
    // 메테리얼이 검은색이거나 비정상적으로 보이는 경우 확인
    if (mesh.material.color.r === 0 && mesh.material.color.g === 0 && mesh.material.color.b === 0) {
      console.log('검은색 메테리얼 발견, 복구 시도:', mesh.material.name);
      mesh.material.color.set(0xCCCCCC);
      mesh.material.needsUpdate = true;
      hasFixedMaterial = true;
    }
    
    // 텍스처 업데이트 플래그 설정
    if (mesh.material.map) mesh.material.map.needsUpdate = true;
  }
  
  return hasFixedMaterial;
}

/**
 * 씬의 모든 메시 재질을 확인하고 수정하는 함수
 * @param scene - 확인할 씬
 * @returns 수정이 이루어졌는지 여부
 */
export function checkAndFixSceneMaterials(scene: THREE.Object3D): boolean {
  let hasFixedMaterial = false;
  
  scene.traverse((child: any) => {
    if (child.isMesh) {
      const fixed = checkAndFixMaterial(child);
      if (fixed) hasFixedMaterial = true;
    }
  });
  
  return hasFixedMaterial;
}

/**
 * 모바일 기기를 위한 텍스처 최적화 함수
 * @param texture - 최적화할 텍스처
 * @param anisotropy - 이방성 필터링 값 (기본값: 4)
 */
export function optimizeTextureForMobile(texture: THREE.Texture, anisotropy: number = 4) {
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
}

/**
 * 모바일 기기를 위한 재질 최적화 함수
 * @param material - 최적화할 재질
 * @param anisotropy - 이방성 필터링 값 (기본값: 4)
 */
export function optimizeMaterialForMobile(material: THREE.Material, anisotropy: number = 4) {
  if (material instanceof THREE.MeshStandardMaterial) {
    if (material.map) {
      optimizeTextureForMobile(material.map, anisotropy);
    }
    
    // 다른 텍스처들도 최적화
    if (material.normalMap) {
      optimizeTextureForMobile(material.normalMap, anisotropy);
    }
    
    if (material.roughnessMap) {
      optimizeTextureForMobile(material.roughnessMap, anisotropy);
    }
    
    if (material.metalnessMap) {
      optimizeTextureForMobile(material.metalnessMap, anisotropy);
    }
    
    if (material.emissiveMap) {
      optimizeTextureForMobile(material.emissiveMap, anisotropy);
    }
  }
}

/**
 * 모바일 기기를 위한 씬 최적화 함수
 * @param scene - 최적화할 씬
 * @param options - 최적화 옵션
 */
export function optimizeSceneForMobile(
  scene: THREE.Object3D,
  options: {
    anisotropy?: number,
    disableShadows?: boolean
  } = {}
) {
  const defaultOptions = {
    anisotropy: 4,
    disableShadows: true
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  scene.traverse((child: any) => {
    if (child.isMesh) {
      // 모바일에서는 그림자 비활성화 (성능 향상)
      if (mergedOptions.disableShadows) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
      
      // 재질 최적화
      if (Array.isArray(child.material)) {
        child.material.forEach((mat: THREE.Material) => {
          optimizeMaterialForMobile(mat, mergedOptions.anisotropy);
        });
      } else if (child.material) {
        optimizeMaterialForMobile(child.material, mergedOptions.anisotropy);
      }
    }
  });
} 