import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ModelComponentType } from '../../types/scene';
import { ResourceManager } from '../../utils/ResourceManager';
import { devLog } from '../../utils/logger';

export interface UseModelResourcesOptions {
  scene: THREE.Group | null;
  component: ModelComponentType;
  isDev?: boolean;
}

export interface UseModelResourcesResult {
  resourceManager: ResourceManager;
  getModelAnalysis: () => any;
  disposeResources: (componentPrefix?: string) => void;
}

/**
 * 3D 모델 리소스 관리를 위한 훅
 * 모델의 메모리 사용량 분석 및 리소스 해제를 처리합니다.
 */
export function useModelResources({
  scene,
  component,
  isDev = process.env.NODE_ENV === 'development'
}: UseModelResourcesOptions): UseModelResourcesResult {
  // 리소스 관리자 초기화
  const resourceManagerRef = useRef<ResourceManager>(new ResourceManager());
  
  // 최신 분석 결과 추적
  const modelAnalysisRef = useRef<any>(null);

  // 메모리 분석 함수
  const analyzeModelMemory = useCallback((currentScene: THREE.Group) => {
    if (!currentScene) return null;
    
    // 텍스처 및 지오메트리 정보 수집
    const textureResults: { [key: string]: { size: number, name: string, count: number } } = {};
    const geometryResults: { [key: string]: { size: number, name: string, count: number } } = {};
    
    // 재질 크기 추정 (대략적인 값)
    const ESTIMATED_MATERIAL_SIZE = 1024; // 바이트 단위
    
    let textureCount = 0;
    let materialCount = 0;
    let geometryCount = 0;
    let meshCount = 0;
    
    let totalTextureMemory = 0;
    let totalGeometryMemory = 0;
    let totalMaterialMemory = 0;
    
    // 씬을 순회하며 메모리 사용량 계산
    currentScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        meshCount++;
        const mesh = child as THREE.Mesh;
        
        // 지오메트리 분석
        if (mesh.geometry) {
          geometryCount++;
          
          // 지오메트리 크기 추정
          let geometrySize = 0;
          if (mesh.geometry.attributes.position) {
            geometrySize += mesh.geometry.attributes.position.array.byteLength || 0;
          }
          if (mesh.geometry.attributes.normal) {
            geometrySize += mesh.geometry.attributes.normal.array.byteLength || 0;
          }
          if (mesh.geometry.attributes.uv) {
            geometrySize += mesh.geometry.attributes.uv.array.byteLength || 0;
          }
          if (mesh.geometry.index) {
            geometrySize += mesh.geometry.index.array.byteLength || 0;
          }
          
          // 미리 계산된 크기가 없으면 추정
          if (geometrySize === 0) {
            geometrySize = mesh.geometry.attributes.position ? 
              mesh.geometry.attributes.position.count * 12 : 0;
          }
          
          totalGeometryMemory += geometrySize;
          
          // 같은 지오메트리 타입 집계
          const geometryName = mesh.geometry.type || 'Unknown';
          if (!geometryResults[geometryName]) {
            geometryResults[geometryName] = { size: 0, name: geometryName, count: 0 };
          }
          geometryResults[geometryName].size += geometrySize;
          geometryResults[geometryName].count++;
        }
        
        // 재질 분석
        if (mesh.material) {
          // 단일 재질 또는 재질 배열 처리
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          
          materialCount += materials.length;
          totalMaterialMemory += materials.length * ESTIMATED_MATERIAL_SIZE;
          
          materials.forEach((material: THREE.Material) => {
            // 텍스처 분석
            Object.keys(material).forEach(key => {
              const value = (material as any)[key];
              if (value && value.isTexture) {
                const texture = value as THREE.Texture;
                textureCount++;
                
                // 텍스처 크기 계산
                let textureSize = 0;
                if (texture.image) {
                  if (texture.image.width && texture.image.height) {
                    // RGB 또는 RGBA 형식에 따라 픽셀당 바이트 수 계산
                    const bytesPerPixel = texture.format === THREE.RGBAFormat ? 4 : 3;
                    textureSize = texture.image.width * texture.image.height * bytesPerPixel;
                  } else if (texture.image.data && texture.image.data.length) {
                    textureSize = texture.image.data.byteLength || texture.image.data.length;
                  }
                }
                
                // 크기 정보를 얻을 수 없는 경우 추정
                if (textureSize === 0) {
                  textureSize = 1024 * 1024 * 4; // 1024x1024 RGBA 텍스처 추정
                }
                
                totalTextureMemory += textureSize;
                
                // 텍스처 이름 확인 (가능한 경우 소스 URL 사용)
                const textureName = texture.name || 
                  (texture.source && texture.source.data && texture.source.data.src) || 
                  `${key}_texture`;
                
                // 같은 텍스처 타입 집계
                if (!textureResults[textureName]) {
                  textureResults[textureName] = { size: 0, name: textureName, count: 0 };
                }
                textureResults[textureName].size += textureSize;
                textureResults[textureName].count++;
              }
            });
          });
        }
      }
    });
    
    // 큰 텍스처 찾기 (1MB 이상)
    const largeTextures = Object.values(textureResults)
      .filter(tex => tex.size > 1024 * 1024)
      .sort((a, b) => b.size - a.size);
    
    // 결과 정보 구성
    const analysis = {
      textureCount,
      uniqueTextureCount: Object.keys(textureResults).length,
      geometryCount,
      uniqueGeometryCount: Object.keys(geometryResults).length,
      materialCount,
      meshCount,
      totalMemory: totalTextureMemory + totalGeometryMemory + totalMaterialMemory,
      textureMemory: totalTextureMemory,
      geometryMemory: totalGeometryMemory,
      materialMemory: totalMaterialMemory,
      largeTextures,
      textureDetails: Object.values(textureResults).sort((a, b) => b.size - a.size),
      geometryDetails: Object.values(geometryResults).sort((a, b) => b.size - a.size),
    };
    
    // 개발 모드에서 분석 결과 로깅
    if (isDev) {
      devLog(`모델 분석 (${component})`, 'info');
      devLog(`총 메모리: ${(analysis.totalMemory / (1024 * 1024)).toFixed(2)} MB`, 'info');
      devLog(`텍스처: ${analysis.textureCount} (${(analysis.textureMemory / (1024 * 1024)).toFixed(2)} MB)`, 'info');
      devLog(`지오메트리: ${analysis.geometryCount} (${(analysis.geometryMemory / (1024 * 1024)).toFixed(2)} MB)`, 'info');
      devLog(`재질: ${analysis.materialCount} (${(analysis.materialMemory / (1024 * 1024)).toFixed(2)} MB)`, 'info');
      devLog(`메시: ${analysis.meshCount}`, 'info');
      
      if (largeTextures.length > 0) {
        devLog('큰 텍스처 (>1MB):', 'warn');
        largeTextures.forEach(tex => {
          devLog(`${tex.name}: ${(tex.size / (1024 * 1024)).toFixed(2)} MB, ${tex.count}개`, 'warn');
        });
      }
    }
    
    return analysis;
  }, [component, isDev]);

  // 씬 변경 시 분석 실행
  useEffect(() => {
    if (!scene) return;
    
    // 모델 분석 실행
    const analysis = analyzeModelMemory(scene);
    
    // 분석 결과 저장
    if (analysis) {
      modelAnalysisRef.current = analysis;
    }
  }, [scene, analyzeModelMemory]);

  // 리소스 해제 함수
  const disposeResources = useCallback((componentPrefix?: string) => {
    const prefix = componentPrefix || component;
    
    // ResourceManager를 통해 등록된 리소스 해제
    resourceManagerRef.current.disposeResources(prefix);
    
    if (isDev) {
      devLog(`${prefix} 리소스 해제 완료`, 'info');
    }
  }, [component, isDev]);

  // 모델 분석 결과 가져오기
  const getModelAnalysis = useCallback(() => {
    return modelAnalysisRef.current;
  }, []);

  // 컴포넌트 언마운트 시 리소스 해제
  useEffect(() => {
    return () => {
      disposeResources();
    };
  }, [disposeResources]);

  return {
    resourceManager: resourceManagerRef.current,
    getModelAnalysis,
    disposeResources
  };
} 