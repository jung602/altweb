/**
 * 지오메트리 최적화 유틸리티
 * Three.js 지오메트리에 대한 최적화 기능을 제공합니다.
 */

import * as THREE from 'three';
import { estimateGeometryMemory } from './GeometryUtils';
import { getCurrentPerformanceMode } from '../performance';

// 지오메트리 복잡도 제한 설정
const GEOMETRY_DETAIL_LIMITS = {
  'high-performance': 1.0, // 원본 유지
  'balanced': 0.7, // 30% 감소
  'power-saving': 0.5 // 50% 감소
};

/**
 * 현재 성능 모드에 기반한 지오메트리 상세 수준 계수 반환
 */
export function getGeometryDetailFactor(): number {
  const mode = getCurrentPerformanceMode();
  return GEOMETRY_DETAIL_LIMITS[mode] || GEOMETRY_DETAIL_LIMITS['balanced'];
}

/**
 * 원본 버텍스 수를 최적화된 값으로 변환
 */
export function getOptimizedVertexCount(originalVertexCount: number): number {
  const factor = getGeometryDetailFactor();
  return Math.floor(originalVertexCount * factor);
}

/**
 * 지오메트리의 메모리 사용량 추정 및 최적화 수준 제안
 * @param geometry - 분석할 지오메트리
 * @returns 메모리 사용량 및 최적화 정보를 포함하는 객체
 */
export function analyzeGeometryOptimization(geometry: THREE.BufferGeometry): {
  originalMemory: number;
  optimizedMemory: number;
  reductionPercentage: number;
  isHighPoly: boolean;
} {
  // 원본 메모리 사용량 계산
  const originalMemory = estimateGeometryMemory(geometry);
  
  // 최적화 수준 계산
  const factor = getGeometryDetailFactor();
  
  // 가장 중요한 attribute는 position
  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) {
    return {
      originalMemory,
      optimizedMemory: originalMemory,
      reductionPercentage: 0,
      isHighPoly: false
    };
  }
  
  // 버텍스 수 계산
  const vertexCount = positionAttribute.count;
  const optimizedVertexCount = Math.floor(vertexCount * factor);
  
  // 최적화 메모리 추정 (단순 비례 관계로 계산)
  const optimizedMemory = Math.floor(originalMemory * factor);
  
  // 고폴리곤 여부 판단 (10,000개 이상의 버텍스를 고폴리곤으로 간주)
  const isHighPoly = vertexCount > 10000;
  
  // 최적화 비율 계산
  const reductionPercentage = (1 - factor) * 100;
  
  return {
    originalMemory,
    optimizedMemory,
    reductionPercentage,
    isHighPoly
  };
}

/**
 * 성능 모드에 따라 지오메트리를 최적화합니다.
 * @param geometry - 최적화할 지오메트리
 * @returns 최적화된 지오메트리
 */
export function optimizeGeometry(
  geometry: THREE.BufferGeometry
): THREE.BufferGeometry {
  // 지오메트리가 이미 최적화되었거나 최고 성능 모드인 경우 원본 반환
  if (
    getCurrentPerformanceMode() === 'high-performance' ||
    !geometry.attributes.position
  ) {
    return geometry;
  }
  
  // 분석 수행
  const analysis = analyzeGeometryOptimization(geometry);
  
  // 고폴리곤이 아니거나 최적화가 필요 없는 경우 원본 반환
  if (!analysis.isHighPoly || analysis.reductionPercentage < 5) {
    return geometry;
  }
  
  // 여기서는 실제 지오메트리 복잡도 감소 처리를 구현해야 합니다.
  // 프로덕션 환경에서는 decimateGeometry와 같은 메서드를 구현하여 사용합니다.
  // 이 예제에서는 간단히 복제본을 반환합니다.
  
  return geometry.clone();
} 