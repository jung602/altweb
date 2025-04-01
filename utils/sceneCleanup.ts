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