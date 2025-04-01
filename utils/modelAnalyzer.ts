import * as THREE from 'three'
import { formatBytes, estimateTextureMemory } from './sceneCleanup'
import { LogLevel } from './logger'

/**
 * 모델의 메모리 사용량을 분석하는 함수
 * @param scene - 분석할 씬
 * @returns 메모리 사용량 분석 결과
 */
export function analyzeModelMemoryUsage(scene: THREE.Group) {
  const textures: THREE.Texture[] = [];
  const largeTextures: {texture: THREE.Texture, size: number}[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const largeGeometries: {geometry: THREE.BufferGeometry, size: number}[] = [];
  let totalTextureMemory = 0;
  let totalGeometryMemory = 0;
  
  // 씬 순회하며 리소스 수집 및 분석
  scene.traverse((child: any) => {
    if (child.isMesh) {
      // 지오메트리 분석
      if (child.geometry) {
        const geometrySize = child.geometry.attributes.position ? 
          child.geometry.attributes.position.count * 3 * 4 : 0; // Float32Array = 4 bytes per value
        
        geometries.push(child.geometry);
        totalGeometryMemory += geometrySize;
        
        if (geometrySize > 1024 * 1024) { // 1MB 이상
          largeGeometries.push({
            geometry: child.geometry,
            size: geometrySize
          });
        }
      }
      
      // 재질 및 텍스처 분석
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      
      materials.forEach((material: THREE.Material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          // 모든 가능한 텍스처 맵 확인
          const maps = [
            material.map, material.normalMap, material.roughnessMap, 
            material.metalnessMap, material.aoMap, material.emissiveMap,
            material.displacementMap, material.alphaMap, material.bumpMap,
            material.envMap, material.lightMap
          ];
          
          maps.forEach(map => {
            if (map) {
              textures.push(map);
              const textureSize = estimateTextureMemory(map);
              totalTextureMemory += textureSize;
              
              if (textureSize > 4 * 1024 * 1024) { // 4MB 이상
                largeTextures.push({
                  texture: map,
                  size: textureSize
                });
              }
            }
          });
        }
      });
    }
  });
  
  // 중복 텍스처 확인
  const uniqueTextures = new Set(textures);
  const duplicateTextureCount = textures.length - uniqueTextures.size;
  
  return {
    textureCount: textures.length,
    uniqueTextureCount: uniqueTextures.size,
    duplicateTextureCount,
    geometryCount: geometries.length,
    totalTextureMemory,
    totalGeometryMemory,
    totalMemory: totalTextureMemory + totalGeometryMemory,
    largeTextures,
    largeGeometries
  };
}

/**
 * 모델 최적화 제안을 생성하는 함수
 * @param analysis - 메모리 사용량 분석 결과
 * @returns 최적화 제안 메시지
 */
export function generateOptimizationSuggestions(analysis: any): string[] {
  const suggestions: string[] = [];
  
  // 텍스처 관련 제안
  if (analysis.totalTextureMemory > 100 * 1024 * 1024) { // 100MB 이상
    suggestions.push(`텍스처가 과도한 메모리(${formatBytes(analysis.totalTextureMemory)})를 사용합니다. 텍스처 해상도를 줄이는 것을 고려하세요.`);
  }
  
  if (analysis.duplicateTextureCount > 0) {
    suggestions.push(`${analysis.duplicateTextureCount}개의 중복 텍스처가 발견되었습니다. 텍스처를 공유하도록 모델을 최적화하세요.`);
  }
  
  if (analysis.largeTextures.length > 0) {
    const largestTexture = analysis.largeTextures.sort((a: {size: number}, b: {size: number}) => b.size - a.size)[0];
    suggestions.push(`가장 큰 텍스처는 ${formatBytes(largestTexture.size)}를 사용합니다. 이 텍스처의 해상도를 줄이는 것을 고려하세요.`);
  }
  
  // 지오메트리 관련 제안
  if (analysis.totalGeometryMemory > 50 * 1024 * 1024) { // 50MB 이상
    suggestions.push(`지오메트리가 과도한 메모리(${formatBytes(analysis.totalGeometryMemory)})를 사용합니다. 모델의 폴리곤 수를 줄이는 것을 고려하세요.`);
  }
  
  if (analysis.largeGeometries.length > 0) {
    const largestGeometry = analysis.largeGeometries.sort((a: {size: number}, b: {size: number}) => b.size - a.size)[0];
    suggestions.push(`가장 큰 지오메트리는 ${formatBytes(largestGeometry.size)}를 사용합니다. 이 메시의 디테일을 줄이는 것을 고려하세요.`);
  }
  
  // 일반적인 제안
  if (analysis.totalMemory > 150 * 1024 * 1024) { // 150MB 이상
    suggestions.push(`모델 전체가 매우 큰 메모리(${formatBytes(analysis.totalMemory)})를 사용합니다. 모바일 기기에서는 성능 문제가 발생할 수 있습니다.`);
  }
  
  return suggestions;
}

/**
 * 개발 모드에서 모델 분석 결과를 콘솔에 출력하는 함수
 * @param scene - 분석할 씬
 * @param component - 모델 컴포넌트 이름
 * @param devLog - 개발 로그 함수
 * @param startGroup - 콘솔 그룹 시작 함수
 * @param endGroup - 콘솔 그룹 종료 함수
 * @returns 분석 결과
 */
export function analyzeAndLogModelInfo(
  scene: THREE.Group, 
  component: string,
  devLog: (message: string, level?: LogLevel) => void,
  startGroup: (label: string) => void,
  endGroup: () => void
) {
  // 모델 메모리 사용량 분석
  const analysis = analyzeModelMemoryUsage(scene);
  
  // 콘솔에 분석 결과 출력
  startGroup(`모델 '${component}' 메모리 분석`);
  devLog(`총 메모리: ${formatBytes(analysis.totalMemory)}`, 'info');
  devLog(`텍스처 메모리: ${formatBytes(analysis.totalTextureMemory)} (${analysis.textureCount}개 텍스처, ${analysis.uniqueTextureCount}개 고유)`, 'info');
  devLog(`지오메트리 메모리: ${formatBytes(analysis.totalGeometryMemory)} (${analysis.geometryCount}개 지오메트리)`, 'info');
  
  // 최적화 제안
  const suggestions = generateOptimizationSuggestions(analysis);
  if (suggestions.length > 0) {
    devLog('최적화 제안:', 'warn');
    suggestions.forEach((suggestion, index) => {
      devLog(`${index + 1}. ${suggestion}`, 'warn');
    });
  }
  
  endGroup();
  
  // 메모리 사용량이 매우 큰 경우 경고
  if (analysis.totalMemory > 150 * 1024 * 1024) { // 150MB 이상
    devLog(`[메모리 경고] 모델 '${component}'가 과도한 메모리(${formatBytes(analysis.totalMemory)})를 사용합니다. 최적화가 필요합니다.`, 'warn');
  }
  
  return analysis;
}

/**
 * 메모리 통계를 기반으로 추가 최적화 제안을 제공하는 함수
 * @param stats - 메모리 통계
 * @param analysis - 모델 분석 결과
 * @param component - 모델 컴포넌트 이름
 * @param devLog - 개발 로그 함수
 * @param conditionalLog - 조건부 로그 함수
 */
export function checkMemoryUsageAndSuggestOptimizations(
  stats: any, 
  analysis: any, 
  component: string,
  devLog: (message: string, level?: LogLevel) => void,
  conditionalLog: (message: string, condition: boolean, level?: LogLevel) => void
) {
  const isDev = true; // 이 함수는 개발 모드에서만 호출되므로 항상 true
  
  // 비정상적인 메모리 사용 패턴 감지 및 경고
  if (stats.totalMemory && stats.totalMemory > 20 * 1024 * 1024) { // 20MB 이상
    devLog(`[메모리 경고] 모델 '${component}'에서 대량의 메모리(${formatBytes(stats.totalMemory)})가 해제되었습니다. 메모리 누수 가능성을 확인하세요.`, 'warn');
    
    // 메모리 사용량 분석 결과가 있으면 추가 정보 제공
    if (analysis) {
      conditionalLog(`메모리 분석: 텍스처 ${formatBytes(analysis.totalTextureMemory)}, 지오메트리 ${formatBytes(analysis.totalGeometryMemory)}`, isDev);
      
      // 텍스처와 지오메트리 비율 계산
      if (stats.totalMemory > 0) {
        const textureRatio = analysis.totalTextureMemory / stats.totalMemory;
        conditionalLog(`텍스처 비율: ${(textureRatio * 100).toFixed(1)}%`, isDev);
        
        // 텍스처가 대부분의 메모리를 차지하는 경우
        if (textureRatio > 0.7) { // 70% 이상
          conditionalLog('최적화 제안: 텍스처 해상도를 줄이거나 압축 포맷(KTX2, BASIS)을 사용하세요.', isDev, 'warn');
        }
      }
    }
  }
} 