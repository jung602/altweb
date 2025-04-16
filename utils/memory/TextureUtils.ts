import * as THREE from 'three';
import { logger } from '../logger';

/**
 * 텍스처 메모리 사용량을 추정하는 함수
 * @param texture - 메모리 사용량을 추정할 텍스처
 * @returns 추정 메모리 사용량 (바이트)
 */
export function estimateTextureMemory(texture: THREE.Texture): number {
  if (!texture || !texture.image) return 0;
  
  // KTX2/압축 텍스처 처리 (CompressedTexture 타입)
  if (texture instanceof THREE.CompressedTexture) {
    return estimateCompressedTextureMemory(texture);
  }
  
  let width = 0;
  let height = 0;
  
  // 이미지 크기 가져오기
  if (texture.image instanceof HTMLImageElement) {
    width = texture.image.naturalWidth || texture.image.width;
    height = texture.image.naturalHeight || texture.image.height;
  } else if (texture.image instanceof HTMLCanvasElement) {
    width = texture.image.width;
    height = texture.image.height;
  } else if (texture.image.width && texture.image.height) {
    width = texture.image.width;
    height = texture.image.height;
  }
  
  if (width === 0 || height === 0) return 0;
  
  // 픽셀당 4바이트 (RGBA)
  const bytesPerPixel = 4;
  
  // 밉맵 레벨에 따른 추가 메모리 (원본 크기의 약 1/3 추가)
  const mipmapFactor = texture.generateMipmaps ? 1.33 : 1;
  
  // 총 메모리 계산
  return Math.floor(width * height * bytesPerPixel * mipmapFactor);
}

/**
 * 압축 텍스처(KTX2, DDS, PVR 등)의 메모리 사용량을 추정하는 함수
 * @param texture - 압축 텍스처
 * @returns 추정 메모리 사용량 (바이트)
 */
export function estimateCompressedTextureMemory(texture: THREE.CompressedTexture): number {
  // 텍스처에 mipmaps 배열이 없으면 0 반환
  if (!texture.mipmaps || texture.mipmaps.length === 0) {
    // 이미지 데이터가 있으면 대체 계산법 사용
    if (texture.image) {
      const width = texture.image.width || 0;
      const height = texture.image.height || 0;
      
      if (width > 0 && height > 0) {
        // 압축 포맷별 추정 비트/픽셀
        const format = (texture as any).format;
        let bitsPerPixel = 4; // 기본값
        
        if (format) {
          // ASTC 포맷 (대략 8x8 블록 가정)
          if (format >= 0x93B0 && format <= 0x93BD) {
            bitsPerPixel = 2; // ~2bpp (ASTC 평균)
          } 
          // ETC2/EAC 포맷
          else if (format >= 0x9270 && format <= 0x9279) {
            bitsPerPixel = 4; // ~4bpp
          }
          // S3TC/DXT 포맷
          else if (format >= 0x83F0 && format <= 0x83F3) {
            bitsPerPixel = 4; // ~4bpp (DXT1은 4bpp, DXT5는 8bpp)
          }
          // PVRTC 포맷
          else if (format >= 0x8C00 && format <= 0x8C03) {
            bitsPerPixel = 4; // 2bpp 또는 4bpp
          }
        }
        
        // 바이트로 변환 (8비트 = 1바이트)
        const bytesPerPixel = bitsPerPixel / 8;
        
        return Math.floor(width * height * bytesPerPixel);
      }
    }
    
    return 0;
  }
  
  // mipmaps 배열에서 데이터 크기 합산
  let totalSize = 0;
  
  for (const mipmap of texture.mipmaps) {
    // data 속성이 존재하는 경우 (ImageData 또는 ArrayBuffer)
    if (mipmap.data) {
      if (mipmap.data instanceof Uint8Array || mipmap.data instanceof ArrayBuffer) {
        totalSize += mipmap.data.byteLength;
      } else if (typeof mipmap.data === 'object' && 'length' in mipmap.data) {
        totalSize += (mipmap.data as any).length;
      }
    } 
    // data가 없지만 width/height가 있는 경우
    else if (mipmap.width && mipmap.height) {
      const bytesPerPixel = 0.5; // 압축 텍스처는 일반적으로 4bpp 이하
      totalSize += mipmap.width * mipmap.height * bytesPerPixel;
    }
  }
  
  return Math.floor(totalSize);
}

/**
 * 텍스처 유형을 문자열로 반환하는 함수
 * @param texture - 텍스처 객체
 * @returns 텍스처 유형 문자열
 */
export function getTextureType(texture: THREE.Texture): string {
  if (!texture) return 'Unknown';
  
  if (texture instanceof THREE.CompressedTexture) {
    const format = (texture as any).format;
    
    // ASTC 포맷
    if (format >= 0x93B0 && format <= 0x93BD) {
      return 'ASTC';
    } 
    // ETC2/EAC 포맷
    else if (format >= 0x9270 && format <= 0x9279) {
      return 'ETC2/EAC';
    }
    // S3TC/DXT 포맷
    else if (format >= 0x83F0 && format <= 0x83F3) {
      return 'S3TC/DXT';
    }
    // PVRTC 포맷
    else if (format >= 0x8C00 && format <= 0x8C03) {
      return 'PVRTC';
    }
    
    return 'CompressedTexture';
  }
  
  if (texture instanceof THREE.CanvasTexture) {
    return 'CanvasTexture';
  }
  
  if (texture instanceof THREE.DataTexture) {
    return 'DataTexture';
  }
  
  if (texture instanceof THREE.DepthTexture) {
    return 'DepthTexture';
  }
  
  if (texture instanceof THREE.VideoTexture) {
    return 'VideoTexture';
  }
  
  if (texture instanceof THREE.CubeTexture) {
    return 'CubeTexture';
  }
  
  return 'Texture';
}

/**
 * 텍스처를 처분하는 함수
 * @param texture - 처분할 텍스처
 * @returns 처분된 메모리 추정치 (바이트)
 */
export function disposeTexture(texture: THREE.Texture | null | undefined): number {
  if (!texture) return 0;
  
  // 메모리 사용량 추정
  const memoryEstimate = estimateTextureMemory(texture);
  
  try {
    // 텍스처 해제
    texture.dispose();
    logger.log(`텍스처 처분: ${texture.name || '이름 없음'} (${memoryEstimate} bytes)`, 'resource');
  } catch (error) {
    console.error('텍스처 처분 중 오류 발생:', error);
  }
  
  return memoryEstimate;
}

/**
 * 머티리얼에서 모든 텍스처를 처분하는 함수
 * @param material - 처분할 텍스처가 있는 머티리얼
 */
export function disposeTexturesFromMaterial(material: THREE.Material): number {
  if (!material) return 0;
  
  let disposedMemory = 0;
  
  // 일반적인 텍스처 속성들 확인
  const textureProps = [
    'map', 'alphaMap', 'aoMap', 'bumpMap', 'emissiveMap',
    'envMap', 'lightMap', 'metalnessMap', 'normalMap', 
    'roughnessMap', 'specularMap', 'gradientMap'
  ];
  
  textureProps.forEach(prop => {
    if (prop in material && (material as any)[prop]) {
      disposedMemory += disposeTexture((material as any)[prop]);
      (material as any)[prop] = null;
    }
  });
  
  // 추가적인 텍스처 속성들 (확장된 머티리얼 타입에 따라 다를 수 있음)
  const additionalTextureProps = [
    'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap',
    'displacementMap', 'thicknessMap', 'transmissionMap',
    'sheenRoughnessMap', 'sheenColorMap', 'specularIntensityMap',
    'specularColorMap', 'anisotropyMap', 'iridescenceMap',
    'iridescenceThicknessMap', 'attenuationMap', 'transmissionMap'
  ];
  
  additionalTextureProps.forEach(prop => {
    if (prop in material && (material as any)[prop]) {
      disposedMemory += disposeTexture((material as any)[prop]);
      (material as any)[prop] = null;
    }
  });
  
  return disposedMemory;
}

/**
 * 씬에서 압축 텍스처 관련 통계를 분석하는 함수
 * @param scene - 분석할 씬
 * @returns 압축 텍스처 관련 통계
 */
export function analyzeCompressedTextures(scene: THREE.Object3D): {
  compressedTextures: number;
  textureCount: number;
  estimatedMemory: number;
} {
  const result = {
    compressedTextures: 0,
    textureCount: 0,
    estimatedMemory: 0
  };
  
  // 중복 텍스처 카운팅 방지를 위한 Set
  const textureSet = new Set<THREE.Texture>();
  
  // 씬의 모든 메시를 순회하며 텍스처 수집
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material) {
      const materials = Array.isArray(object.material) 
        ? object.material 
        : [object.material];
      
      materials.forEach(material => {
        // 머티리얼의 모든 텍스처 속성 확인
        const textureProps = [
          'map', 'alphaMap', 'aoMap', 'bumpMap', 'emissiveMap',
          'envMap', 'lightMap', 'metalnessMap', 'normalMap', 
          'roughnessMap', 'specularMap', 'gradientMap',
          'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap',
          'displacementMap', 'thicknessMap', 'transmissionMap',
          'sheenRoughnessMap', 'sheenColorMap', 'specularIntensityMap',
          'specularColorMap', 'anisotropyMap', 'iridescenceMap',
          'iridescenceThicknessMap', 'attenuationMap', 'transmissionMap'
        ];
        
        for (const prop of textureProps) {
          const texture = (material as any)[prop];
          if (texture && !textureSet.has(texture)) {
            textureSet.add(texture);
            result.textureCount++;
            
            if (texture instanceof THREE.CompressedTexture) {
              result.compressedTextures++;
            }
            
            result.estimatedMemory += estimateTextureMemory(texture);
          }
        }
      });
    }
  });
  
  return result;
}

/**
 * 텍스처 최적화 옵션 인터페이스
 */
export interface TextureOptimizationOptions {
  colorSpace?: THREE.ColorSpace;
  anisotropy?: number;
  minFilter?: THREE.TextureFilter;
  magFilter?: THREE.TextureFilter;
  generateMipmaps?: boolean;
  flipY?: boolean;
  isMobile?: boolean;
}

// 텍스처 최적화 추적을 위한 간단한 캐시
const optimizedTextureIds = new Set<string>();

/**
 * 텍스처를 최적화하는 함수
 * @param texture - 최적화할 텍스처
 * @param options - 최적화 옵션
 */
export function optimizeTexture(
  texture: THREE.Texture | null | undefined,
  options: TextureOptimizationOptions = {}
): void {
  if (!texture) return;
  
  // 이미 최적화된 텍스처는 건너뛰기
  const textureId = texture.uuid;
  if (optimizedTextureIds.has(textureId)) {
    return;
  }
  
  // 최적화 완료 표시
  optimizedTextureIds.add(textureId);
  
  // 기본 옵션 설정
  const defaultOptions: TextureOptimizationOptions = {
    colorSpace: THREE.LinearSRGBColorSpace,
    anisotropy: options.isMobile ? 4 : 16,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: true,
    flipY: false
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // 텍스처 속성 설정
  texture.colorSpace = mergedOptions.colorSpace as THREE.ColorSpace;
  
  if (mergedOptions.anisotropy !== undefined) {
    texture.anisotropy = mergedOptions.anisotropy;
  }
  
  if (mergedOptions.minFilter !== undefined) {
    texture.minFilter = mergedOptions.minFilter;
  }
  
  if (mergedOptions.magFilter !== undefined) {
    texture.magFilter = mergedOptions.magFilter as THREE.MagnificationTextureFilter;
  }
  
  if (mergedOptions.generateMipmaps !== undefined) {
    texture.generateMipmaps = mergedOptions.generateMipmaps;
  }
  
  if (mergedOptions.flipY !== undefined) {
    texture.flipY = mergedOptions.flipY;
  }
  
  // 압축 텍스처 처리
  if (texture instanceof THREE.CompressedTexture) {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;
  }
  
  // 텍스처 업데이트 플래그 설정
  texture.needsUpdate = true;
}

/**
 * 머티리얼에 속한 모든 텍스처를 최적화하는 함수
 * @param material - 텍스처를 최적화할 머티리얼
 * @param options - 최적화 옵션
 */
export function optimizeMaterialTextures(
  material: THREE.Material,
  options: TextureOptimizationOptions = {}
): void {
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
  
  // 수집된 모든 텍스처 최적화
  textures.forEach(texture => {
    if (texture) {
      optimizeTexture(texture, options);
    }
  });
}

/**
 * 텍스처 최적화 참조 정리
 * @returns 정리된 텍스처 참조 수
 */
export function cleanupTextureReferences(): number {
  const count = optimizedTextureIds.size;
  optimizedTextureIds.clear();
  logger.log(`텍스처 최적화 캐시 정리됨: ${count}개 항목`, 'resource');
  return count;
} 