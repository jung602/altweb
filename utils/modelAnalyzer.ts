import * as THREE from 'three'
import { 
  formatBytes, 
  estimateTextureMemory, 
  getTextureType,
  analyzeCompressedTextures 
} from './sceneCleanup'
import { LogLevel } from './logger'

/**
 * 모델의 메모리 사용량을 분석하는 함수
 * @param scene - 분석할 씬
 * @returns 메모리 사용량 분석 결과
 */
export function analyzeModelMemoryUsage(scene: THREE.Group) {
  const textures: THREE.Texture[] = [];
  const largeTextures: {texture: THREE.Texture, size: number, type: string}[] = [];
  const compressedTextures: THREE.CompressedTexture[] = [];
  const ktx2Textures: THREE.CompressedTexture[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const largeGeometries: {geometry: THREE.BufferGeometry, size: number}[] = [];
  let totalTextureMemory = 0;
  let totalGeometryMemory = 0;
  let uncompressedTextureSize = 0; // 압축하지 않았을 때의 이론적 크기
  
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
            if (map && !textures.includes(map)) { // 중복 방지
              textures.push(map);
              
              // 텍스처 유형 확인 및 분류
              const textureType = getTextureType(map);
              const textureSize = estimateTextureMemory(map);
              
              // 압축 전 이론적 크기 계산 (RGBA 기준)
              if (map.image) {
                const width = map.image.width || 0;
                const height = map.image.height || 0;
                if (width > 0 && height > 0) {
                  uncompressedTextureSize += width * height * 4; // RGBA = 4 bytes per pixel
                }
              }
              
              // 메모리 사용량 합산
              totalTextureMemory += textureSize;
              
              // 압축 텍스처 분류
              if (map instanceof THREE.CompressedTexture) {
                compressedTextures.push(map);
                
                // KTX2 텍스처 확인
                if (textureType === 'KTX2') {
                  ktx2Textures.push(map);
                }
              }
              
              // 큰 텍스처 탐지
              if (textureSize > 4 * 1024 * 1024) { // 4MB 이상
                largeTextures.push({
                  texture: map,
                  size: textureSize,
                  type: textureType
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
  
  // 압축률 계산
  const compressionRatio = uncompressedTextureSize > 0 ? 
    totalTextureMemory / uncompressedTextureSize : 1.0;
  
  // 압축으로 절약된 메모리
  const savedMemoryByCompression = uncompressedTextureSize - totalTextureMemory;
  
  return {
    textureCount: textures.length,
    uniqueTextureCount: uniqueTextures.size,
    duplicateTextureCount,
    compressedTextureCount: compressedTextures.length,
    ktx2TextureCount: ktx2Textures.length,
    geometryCount: geometries.length,
    totalTextureMemory,
    uncompressedTextureSize,
    compressionRatio,
    savedMemoryByCompression,
    totalGeometryMemory,
    totalMemory: totalTextureMemory + totalGeometryMemory,
    largeTextures,
    largeGeometries
  };
}

// 이미 표시된 경고를 추적하는 객체
const displayedWarnings = {
  ktx2Compression: false,
  largeTextureResolution: false,
  memoryLeakage: false
};

/**
 * 경고 표시 상태 초기화 함수
 */
export function resetDisplayedWarnings() {
  displayedWarnings.ktx2Compression = false;
  displayedWarnings.largeTextureResolution = false;
  displayedWarnings.memoryLeakage = false;
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
  
  // 압축 텍스처 관련 제안
  if (analysis.ktx2TextureCount === 0 && analysis.compressedTextureCount === 0) {
    suggestions.push(`압축 텍스처가 사용되지 않고 있습니다. KTX2 또는 다른 GPU 압축 형식을 사용하여 텍스처 메모리 사용량을 줄이세요.`);
  } else if (!displayedWarnings.ktx2Compression && analysis.ktx2TextureCount < analysis.textureCount * 0.5) { // 50% 미만의 텍스처가 KTX2
    suggestions.push(`${analysis.ktx2TextureCount}/${analysis.textureCount} 텍스처만 KTX2 압축 형식을 사용 중입니다. 모든 텍스처에 KTX2를 적용하여 메모리를 절약하세요.`);
    displayedWarnings.ktx2Compression = true;
  }
  
  // 대형 텍스처 경고 (이미 경고가 표시된 경우 중복해서 표시하지 않음)
  if (!displayedWarnings.largeTextureResolution && analysis.largeTextures && analysis.largeTextures.length > 0) {
    const largestTexture = analysis.largeTextures.sort((a: {size: number}, b: {size: number}) => b.size - a.size)[0];
    if (largestTexture.size > 4 * 1024 * 1024) { // 4MB 이상
      suggestions.push(`가장 큰 텍스처(${largestTexture.type})는 ${formatBytes(largestTexture.size)}를 사용합니다. 이 텍스처의 해상도를 줄이는 것을 고려하세요.`);
      displayedWarnings.largeTextureResolution = true;
    }
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
  
  // 압축률 정보 계산
  const compressionPercent = analysis.compressionRatio < 1 ? 
    (1 - analysis.compressionRatio) * 100 : 0;
  
  // 콘솔에 분석 결과 출력
  startGroup(`모델 '${component}' 메모리 분석`);
  devLog(`총 메모리: ${formatBytes(analysis.totalMemory)}`, 'info');
  devLog(`텍스처 메모리: ${formatBytes(analysis.totalTextureMemory)} (${analysis.textureCount}개 텍스처, ${analysis.uniqueTextureCount}개 고유)`, 'info');
  
  // 압축 텍스처 정보
  if (analysis.compressedTextureCount > 0) {
    devLog(`압축 텍스처: ${analysis.compressedTextureCount}개 (KTX2: ${analysis.ktx2TextureCount}개)`, 'info');
    devLog(`압축률: ${compressionPercent.toFixed(1)}% (원본 대비 ${formatBytes(analysis.savedMemoryByCompression)} 절약)`, 'info');
  } else {
    devLog('압축 텍스처가 사용되지 않음 (KTX2와 같은 압축 포맷으로 최적화 필요)', 'warn');
  }
  
  devLog(`지오메트리 메모리: ${formatBytes(analysis.totalGeometryMemory)} (${analysis.geometryCount}개 지오메트리)`, 'info');
  
  // 가장 큰 텍스처 정보 출력
  if (analysis.largeTextures.length > 0) {
    const sortedTextures = analysis.largeTextures.sort((a: {size: number}, b: {size: number}) => b.size - a.size);
    devLog('가장 큰 텍스처 (상위 3개):', 'info');
    
    sortedTextures.slice(0, 3).forEach((textureInfo: {texture: THREE.Texture, size: number, type: string}, index: number) => {
      const name = textureInfo.texture.name || `텍스처 ${index + 1}`;
      devLog(`  ${index + 1}. ${name} (${textureInfo.type}): ${formatBytes(textureInfo.size)}`, 'info');
    });
  }
  
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
  
  // 비정상적인 메모리 사용 패턴 감지 및 경고 (이미 경고가 표시된 경우 중복해서 표시하지 않음)
  if (!displayedWarnings.memoryLeakage && stats.totalMemory && stats.totalMemory > 40 * 1024 * 1024) { // 40MB 이상으로 임계값 높임
    devLog(`[메모리 경고] 모델 '${component}'에서 대량의 메모리(${formatBytes(stats.totalMemory)})가 해제되었습니다. 이는 모델 전환 시 정상적인 현상일 수 있습니다.`, 'warn');
    displayedWarnings.memoryLeakage = true;
    
    // 메모리 사용량 분석 결과가 있으면 추가 정보 제공
    if (analysis) {
      conditionalLog(`메모리 분석: 텍스처 ${formatBytes(analysis.totalTextureMemory)}, 지오메트리 ${formatBytes(analysis.totalGeometryMemory)}`, isDev);
      
      // 압축 텍스처 정보 출력
      if (analysis.compressedTextureCount > 0) {
        conditionalLog(`압축 텍스처: ${analysis.compressedTextureCount}개 (KTX2: ${analysis.ktx2TextureCount}개)`, isDev);
        
        if (analysis.compressionRatio) {
          const compressionPercent = (1 - analysis.compressionRatio) * 100;
          conditionalLog(`텍스처 압축률: ${compressionPercent.toFixed(1)}% 절약됨`, isDev);
        }
      }
      
      // 이하 코드는 중복 경고를 표시하지 않도록 수정
      // 텍스처와 지오메트리 비율 계산
      if (stats.totalMemory > 0 && !displayedWarnings.ktx2Compression) {
        const textureRatio = analysis.totalTextureMemory / stats.totalMemory;
        conditionalLog(`텍스처 비율: ${(textureRatio * 100).toFixed(1)}%`, isDev);
        
        // 텍스처가 대부분의 메모리를 차지하는 경우
        if (textureRatio > 0.7) { // 70% 이상
          // KTX2 텍스처 비율 확인 - 이미 표시된 경우 중복해서 표시하지 않음
          displayedWarnings.ktx2Compression = true;
        }
      }
    }
  }
} 