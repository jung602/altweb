import * as THREE from 'three';
import { logger } from '../logger';

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
 * 지오메트리를 처분하는 함수
 * @param geometry - 처분할 지오메트리
 * @returns 처분된 메모리 추정치 (바이트)
 */
export function disposeGeometry(geometry: THREE.BufferGeometry | null | undefined): number {
  if (!geometry) return 0;
  
  // 메모리 사용량 추정
  const memoryEstimate = estimateGeometryMemory(geometry);
  
  try {
    // 지오메트리 해제
    geometry.dispose();
    logger.log(`지오메트리 처분: ${geometry.name || '이름 없음'} (${memoryEstimate} bytes)`, 'resource');
  } catch (error) {
    // 개발 환경에서만 오류 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('지오메트리 처분 중 오류 발생:', error);
    }
  }
  
  return memoryEstimate;
} 