import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

/**
 * 메모리 정리 로그 스타일
 */
const LOG_STYLES = {
  title: 'color: #4CAF50; font-weight: bold; font-size: 12px;',
  normal: 'color: #2196F3;',
  warning: 'color: #FF9800; font-weight: bold;',
  error: 'color: #F44336; font-weight: bold;',
  success: 'color: #4CAF50;',
  info: 'color: #9C27B0; font-style: italic;'
};

/**
 * 메모리 사용량 통계 인터페이스
 */
export interface MemoryStats {
  meshCount: number;
  materialCount: number;
  geometryCount: number;
  textureCount: number;
  textureMemory?: number; // 추정 메모리 (바이트)
  geometryMemory?: number; // 추정 메모리 (바이트)
  totalMemory?: number; // 추정 총 메모리 (바이트)
}

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
        // ASTC, ETC, PVRTC, S3TC 등 포맷별 압축률 추정
        // 압축 포맷은 texture.format 또는 texture.internalFormat으로 접근 가능할 수 있음
        const format = (texture as any).format;
        let bitsPerPixel = 4; // 기본값 (포맷 판별 불가시)
        
        // Three.js 압축 텍스처 포맷 상수값 확인
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
        
        // 압축 텍스처는 밉맵이 이미 포함되어 있으므로 1.33 대신 1.0 사용
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
    // data가 없지만 width/height가 있는 경우 (일부 WebGL 구현에서)
    else if (mipmap.width && mipmap.height) {
      // 압축 포맷별로 bpp(bits per pixel)가 다름
      // 대략적인 추정값 사용
      const bytesPerPixel = 0.5; // 압축 텍스처는 일반적으로 4bpp 이하
      totalSize += mipmap.width * mipmap.height * bytesPerPixel;
    }
  }
  
  // GPU 메모리에 로드되었을 때의 실제 크기는 약간 더 클 수 있음
  // WebGL 구현 및 드라이버 최적화에 따라 달라짐
  return Math.floor(totalSize);
}

/**
 * 지오메트리 메모리 사용량을 추정하는 함수
 * @param geometry - 메모리 사용량을 추정할 지오메트리
 * @returns 추정 메모리 사용량 (바이트)
 */
export function estimateGeometryMemory(geometry: THREE.BufferGeometry): number {
  let totalBytes = 0;
  
  // 각 버퍼 속성의 메모리 계산
  if (geometry.attributes) {
    Object.values(geometry.attributes).forEach((attribute: any) => {
      if (attribute.array) {
        totalBytes += attribute.array.byteLength;
      }
    });
  }
  
  // 인덱스 버퍼 메모리 계산
  if (geometry.index && geometry.index.array) {
    totalBytes += geometry.index.array.byteLength;
  }
  
  return totalBytes;
}

/**
 * 바이트 단위를 사람이 읽기 쉬운 형식으로 변환하는 함수
 * @param bytes - 바이트 수
 * @returns 사람이 읽기 쉬운 형식의 크기 문자열
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 텍스처를 정리하는 함수
 * @param texture - 정리할 텍스처
 * @returns 정리된 텍스처의 추정 메모리 (바이트)
 */
export function disposeTexture(texture: THREE.Texture | null | undefined): number {
  if (!texture) return 0;
  
  // 메모리 사용량 추정
  const memoryUsage = estimateTextureMemory(texture);
  
  // 텍스처 이미지 참조 제거
  if (texture.image) {
    texture.image = null;
  }
  
  // 미니맵 정리
  if (texture.mipmaps && texture.mipmaps.length > 0) {
    texture.mipmaps.length = 0;
  }
  
  // 텍스처 정리
  texture.dispose();
  
  return memoryUsage;
}

/**
 * 재질에서 사용하는 모든 텍스처를 정리하는 함수
 * @param material - 정리할 재질
 */
export function disposeTexturesFromMaterial(material: THREE.Material) {
  if (material instanceof THREE.MeshStandardMaterial) {
    // 기본 텍스처 맵
    if (material.map) disposeTexture(material.map);
    
    // PBR 관련 텍스처 맵
    if (material.normalMap) disposeTexture(material.normalMap);
    if (material.roughnessMap) disposeTexture(material.roughnessMap);
    if (material.metalnessMap) disposeTexture(material.metalnessMap);
    if (material.aoMap) disposeTexture(material.aoMap);
    if (material.emissiveMap) disposeTexture(material.emissiveMap);
    if (material.displacementMap) disposeTexture(material.displacementMap);
    if (material.alphaMap) disposeTexture(material.alphaMap);
    if (material.bumpMap) disposeTexture(material.bumpMap);
    if (material.envMap) disposeTexture(material.envMap);
    if (material.lightMap) disposeTexture(material.lightMap);
  } 
  else if (material instanceof THREE.MeshBasicMaterial) {
    if (material.map) disposeTexture(material.map);
    if (material.alphaMap) disposeTexture(material.alphaMap);
    if (material.aoMap) disposeTexture(material.aoMap);
    if (material.envMap) disposeTexture(material.envMap);
    if (material.lightMap) disposeTexture(material.lightMap);
  }
  else if (material instanceof THREE.MeshPhongMaterial) {
    if (material.map) disposeTexture(material.map);
    if (material.alphaMap) disposeTexture(material.alphaMap);
    if (material.bumpMap) disposeTexture(material.bumpMap);
    if (material.displacementMap) disposeTexture(material.displacementMap);
    if (material.emissiveMap) disposeTexture(material.emissiveMap);
    if (material.normalMap) disposeTexture(material.normalMap);
    if (material.specularMap) disposeTexture(material.specularMap);
  }
  
  // 다른 유형의 재질에 대한 처리도 추가 가능
}

/**
 * 3D 메시의 지오메트리와 재질을 정리하는 함수
 * @param mesh - 정리할 메시
 */
export function disposeMesh(mesh: THREE.Mesh) {
  // 지오메트리 정리
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
  
  // 재질 정리
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((mat: THREE.Material) => {
      // 재질의 텍스처 정리
      disposeTexturesFromMaterial(mat);
      // 재질 자체 정리
      mat.dispose();
    });
  } else if (mesh.material) {
    // 재질의 텍스처 정리
    disposeTexturesFromMaterial(mesh.material);
    // 재질 자체 정리
    mesh.material.dispose();
  }
}

/**
 * 씬 또는 객체의 모든 메시, 재질, 지오메트리, 텍스처를 정리하는 함수
 * @param object - 정리할 객체 또는 씬
 * @param options - 정리 옵션
 * @returns 정리된 리소스 정보
 */
export function disposeSceneResources(
  object: THREE.Object3D,
  options: {
    logDisposal?: boolean,
    logLevel?: 'basic' | 'detailed' | 'verbose'
  } = {}
): MemoryStats {
  const defaultOptions = {
    logDisposal: false,
    logLevel: 'basic' as const
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  const meshes: THREE.Mesh[] = [];
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];
  
  // 씬의 모든 객체를 순회하며 리소스 수집
  object.traverse((child: any) => {
    if (child.isMesh) {
      meshes.push(child);
      
      if (child.geometry) {
        geometries.push(child.geometry);
      }
      
      if (Array.isArray(child.material)) {
        child.material.forEach((mat: THREE.Material) => {
          materials.push(mat);
          
          // 재질에서 사용하는 텍스처 수집
          if (mat instanceof THREE.MeshStandardMaterial) {
            if (mat.map) textures.push(mat.map);
            if (mat.normalMap) textures.push(mat.normalMap);
            if (mat.roughnessMap) textures.push(mat.roughnessMap);
            if (mat.metalnessMap) textures.push(mat.metalnessMap);
            if (mat.aoMap) textures.push(mat.aoMap);
            if (mat.emissiveMap) textures.push(mat.emissiveMap);
            if (mat.displacementMap) textures.push(mat.displacementMap);
            if (mat.alphaMap) textures.push(mat.alphaMap);
            if (mat.bumpMap) textures.push(mat.bumpMap);
            if (mat.envMap) textures.push(mat.envMap);
            if (mat.lightMap) textures.push(mat.lightMap);
          } else if (mat instanceof THREE.MeshBasicMaterial) {
            if (mat.map) textures.push(mat.map);
            if (mat.alphaMap) textures.push(mat.alphaMap);
            if (mat.aoMap) textures.push(mat.aoMap);
            if (mat.envMap) textures.push(mat.envMap);
            if (mat.lightMap) textures.push(mat.lightMap);
          } else if (mat instanceof THREE.MeshPhongMaterial) {
            if (mat.map) textures.push(mat.map);
            if (mat.alphaMap) textures.push(mat.alphaMap);
            if (mat.bumpMap) textures.push(mat.bumpMap);
            if (mat.displacementMap) textures.push(mat.displacementMap);
            if (mat.emissiveMap) textures.push(mat.emissiveMap);
            if (mat.normalMap) textures.push(mat.normalMap);
            if (mat.specularMap) textures.push(mat.specularMap);
          }
        });
      } else if (child.material) {
        materials.push(child.material);
        
        // 재질에서 사용하는 텍스처 수집
        if (child.material instanceof THREE.MeshStandardMaterial) {
          if (child.material.map) textures.push(child.material.map);
          if (child.material.normalMap) textures.push(child.material.normalMap);
          if (child.material.roughnessMap) textures.push(child.material.roughnessMap);
          if (child.material.metalnessMap) textures.push(child.material.metalnessMap);
          if (child.material.aoMap) textures.push(child.material.aoMap);
          if (child.material.emissiveMap) textures.push(child.material.emissiveMap);
          if (child.material.displacementMap) textures.push(child.material.displacementMap);
          if (child.material.alphaMap) textures.push(child.material.alphaMap);
          if (child.material.bumpMap) textures.push(child.material.bumpMap);
          if (child.material.envMap) textures.push(child.material.envMap);
          if (child.material.lightMap) textures.push(child.material.lightMap);
        } else if (child.material instanceof THREE.MeshBasicMaterial) {
          if (child.material.map) textures.push(child.material.map);
          if (child.material.alphaMap) textures.push(child.material.alphaMap);
          if (child.material.aoMap) textures.push(child.material.aoMap);
          if (child.material.envMap) textures.push(child.material.envMap);
          if (child.material.lightMap) textures.push(child.material.lightMap);
        } else if (child.material instanceof THREE.MeshPhongMaterial) {
          if (child.material.map) textures.push(child.material.map);
          if (child.material.alphaMap) textures.push(child.material.alphaMap);
          if (child.material.bumpMap) textures.push(child.material.bumpMap);
          if (child.material.displacementMap) textures.push(child.material.displacementMap);
          if (child.material.emissiveMap) textures.push(child.material.emissiveMap);
          if (child.material.normalMap) textures.push(child.material.normalMap);
          if (child.material.specularMap) textures.push(child.material.specularMap);
        }
      }
    }
  });
  
  // 중복 제거
  const uniqueTextures = Array.from(new Set(textures));
  
  // 메모리 사용량 추정
  let textureMemory = 0;
  let geometryMemory = 0;
  
  // 텍스처 정리 및 메모리 계산
  uniqueTextures.forEach(texture => {
    textureMemory += disposeTexture(texture);
  });
  
  // 지오메트리 정리 및 메모리 계산
  geometries.forEach(geometry => {
    geometryMemory += estimateGeometryMemory(geometry);
    geometry.dispose();
  });
  
  // 재질 정리 (텍스처는 이미 정리됨)
  materials.forEach(material => material.dispose());
  
  // 총 메모리 계산
  const totalMemory = textureMemory + geometryMemory;
  
  // 메모리 정리 통계
  const stats: MemoryStats = {
    meshCount: meshes.length,
    materialCount: materials.length,
    geometryCount: geometries.length,
    textureCount: uniqueTextures.length,
    textureMemory,
    geometryMemory,
    totalMemory
  };
  
  // 로깅
  if (mergedOptions.logDisposal && process.env.NODE_ENV === 'development') {
    console.group('%c메모리 정리 완료', LOG_STYLES.title);
    
    console.log(
      '%c정리된 리소스:%c %d 메시, %d 재질, %d 지오메트리, %d 텍스처',
      LOG_STYLES.normal, '',
      meshes.length, materials.length, geometries.length, uniqueTextures.length
    );
    
    console.log(
      '%c추정 메모리 해제:%c 텍스처: %s, 지오메트리: %s, 총: %s',
      LOG_STYLES.success, '',
      formatBytes(textureMemory),
      formatBytes(geometryMemory),
      formatBytes(totalMemory)
    );
    
    if (mergedOptions.logLevel === 'detailed' || mergedOptions.logLevel === 'verbose') {
      console.log('%c텍스처 메모리 비율:%c %d%', LOG_STYLES.info, '', 
        totalMemory > 0 ? Math.round((textureMemory / totalMemory) * 100) : 0);
      
      if (uniqueTextures.length > 0 && textureMemory > 0) {
        console.log('%c평균 텍스처 크기:%c %s', LOG_STYLES.info, '', 
          formatBytes(textureMemory / uniqueTextures.length));
      }
      
      if (geometries.length > 0 && geometryMemory > 0) {
        console.log('%c평균 지오메트리 크기:%c %s', LOG_STYLES.info, '', 
          formatBytes(geometryMemory / geometries.length));
      }
    }
    
    if (mergedOptions.logLevel === 'verbose') {
      if (totalMemory > 10 * 1024 * 1024) { // 10MB 이상
        console.log('%c주의: 대용량 메모리 해제 감지!%c 메모리 누수 가능성 확인 필요', LOG_STYLES.warning, '');
      }
      
      if (uniqueTextures.length < textures.length) {
        console.log(
          '%c중복 텍스처 감지:%c %d개 중복 제거됨 (총 %d개 중 %d개 고유)',
          LOG_STYLES.info, '',
          textures.length - uniqueTextures.length,
          textures.length,
          uniqueTextures.length
        );
      }
    }
    
    console.groupEnd();
  }
  
  return stats;
}

/**
 * GLTF 모델 및 관련 리소스를 정리하는 함수
 * @param object - 정리할 객체 또는 씬
 * @param modelPath - 모델 경로 (useGLTF.clear를 위해 필요)
 * @param options - 정리 옵션
 * @returns 정리된 리소스 정보
 */
export function cleanupGLTFModel(
  object: THREE.Object3D, 
  modelPath: string,
  options: {
    logDisposal?: boolean,
    logLevel?: 'basic' | 'detailed' | 'verbose'
  } = {}
): MemoryStats {
  // 씬 리소스 정리
  const stats = disposeSceneResources(object, options);
  
  // GLTF 캐시 정리
  useGLTF.clear(modelPath);
  
  return stats;
}

/**
 * 텍스처 유형을 문자열로 반환하는 함수
 * @param texture - 텍스처 객체
 * @returns 텍스처 유형 문자열
 */
export function getTextureType(texture: THREE.Texture): string {
  if (texture instanceof THREE.CompressedTexture) {
    // 압축 텍스처의 포맷 확인
    const format = (texture as any).format;
    
    // KTX2 파일 확장자 확인 (source.data.src가 있는 경우)
    if (texture.source?.data?.src) {
      const src = texture.source.data.src.toLowerCase();
      if (src.endsWith('.ktx2') || src.includes('.ktx2?')) {
        return 'KTX2';
      }
    }
    
    // 포맷 기반 압축 유형 반환
    if (format) {
      // ASTC 포맷
      if (format >= 0x93B0 && format <= 0x93BD) {
        return 'ASTC';
      } 
      // ETC2/EAC 포맷
      else if (format >= 0x9270 && format <= 0x9279) {
        return 'ETC2';
      }
      // S3TC/DXT 포맷
      else if (format >= 0x83F0 && format <= 0x83F3) {
        return 'S3TC';
      }
      // PVRTC 포맷
      else if (format >= 0x8C00 && format <= 0x8C03) {
        return 'PVRTC';
      }
      // 기타 압축 포맷
      return `압축(${format.toString(16)})`;
    }
    
    return '압축';
  }
  
  // 일반 텍스처
  if (texture.source?.data?.src) {
    const src = texture.source.data.src.toLowerCase();
    if (src.endsWith('.jpg') || src.endsWith('.jpeg')) {
      return 'JPEG';
    } else if (src.endsWith('.png')) {
      return 'PNG';
    } else if (src.endsWith('.webp')) {
      return 'WebP';
    }
  }
  
  return '일반';
}

/**
 * 텍스처의 압축률을 계산하는 함수
 * @param texture - 텍스처 객체
 * @returns 압축률 (0.0-1.0, 낮을수록 더 많이 압축됨)
 */
export function calculateTextureCompressionRatio(texture: THREE.Texture): number {
  if (!texture || !texture.image) return 1.0;
  
  const width = texture.image.width || 0;
  const height = texture.image.height || 0;
  
  if (width === 0 || height === 0) return 1.0;
  
  // 비압축 RGBA 텍스처의 이론적 크기 (4바이트/픽셀)
  const uncompressedSize = width * height * 4;
  
  // 실제 추정 메모리 사용량
  const estimatedSize = estimateTextureMemory(texture);
  
  // 압축률 계산 (0.0-1.0, 낮을수록 더 압축됨)
  return estimatedSize / uncompressedSize;
}

/**
 * 씬에서 압축 텍스처 정보를 분석하는 함수
 * @param scene - 분석할 씬
 * @returns 압축 텍스처 분석 결과
 */
export function analyzeCompressedTextures(scene: THREE.Object3D): {
  totalTextures: number;
  compressedTextures: number;
  ktx2Textures: number;
  compressionRatio: number;
  savedMemory: number;
  textureDetails: Array<{
    name: string;
    type: string;
    size: number;
    dimensions: string;
    compressionRatio: number;
  }>;
} {
  const textures: THREE.Texture[] = [];
  const compressedTextures: THREE.CompressedTexture[] = [];
  const ktx2Textures: THREE.CompressedTexture[] = [];
  const textureDetails: Array<{
    name: string;
    type: string;
    size: number;
    dimensions: string;
    compressionRatio: number;
  }> = [];
  
  let totalUncompressedSize = 0;
  let totalCompressedSize = 0;
  
  // 씬에서 모든 텍스처 수집
  scene.traverse((child: any) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      
      materials.forEach((material: THREE.Material) => {
        // 모든 가능한 텍스처 속성 검사
        const textureProps = [
          'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 
          'emissiveMap', 'displacementMap', 'alphaMap', 'bumpMap',
          'envMap', 'lightMap'
        ] as const;
        
        textureProps.forEach(prop => {
          const texture = (material as any)[prop] as THREE.Texture;
          if (texture && !textures.includes(texture)) {
            textures.push(texture);
            
            // 비압축 RGBA 사이즈 계산
            const width = texture.image?.width || 0;
            const height = texture.image?.height || 0;
            if (width > 0 && height > 0) {
              totalUncompressedSize += width * height * 4;
            }
            
            // 실제 메모리 사용량 계산
            const size = estimateTextureMemory(texture);
            totalCompressedSize += size;
            
            // 압축 텍스처 분류
            if (texture instanceof THREE.CompressedTexture) {
              compressedTextures.push(texture);
              
              // KTX2 텍스처 확인
              const type = getTextureType(texture);
              if (type === 'KTX2') {
                ktx2Textures.push(texture);
              }
            }
            
            // 텍스처 상세 정보 저장
            textureDetails.push({
              name: texture.name || child.name || '이름 없음',
              type: getTextureType(texture),
              size: size,
              dimensions: `${width}×${height}`,
              compressionRatio: calculateTextureCompressionRatio(texture)
            });
          }
        });
      });
    }
  });
  
  // 결과 반환
  return {
    totalTextures: textures.length,
    compressedTextures: compressedTextures.length,
    ktx2Textures: ktx2Textures.length,
    compressionRatio: totalUncompressedSize > 0 ? totalCompressedSize / totalUncompressedSize : 1.0,
    savedMemory: totalUncompressedSize - totalCompressedSize,
    textureDetails: textureDetails.sort((a, b) => b.size - a.size) // 크기 기준 내림차순 정렬
  };
} 