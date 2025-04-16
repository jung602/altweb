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
  
  // 확장된 통계 정보
  duplicateTextures?: number; // 중복 텍스처 수
  rawTextureCount?: number; // 중복 포함 텍스처 총 수
  devicePixelRatio?: number; // 화면 픽셀 비율
  
  // ResourceManager 통합
  resourceManager?: {
    active: boolean;
    count: number;
    inactiveCount?: number;
    disposedCount?: number;
  };
  
  // Stats 통합
  performance?: {
    fps?: number;
    renderTime?: number;
    memoryUsage?: number;
  };
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
 * 메모리 통계 초기화 함수
 * @returns 기본값으로 초기화된 메모리 통계 객체
 */
export function createEmptyMemoryStats(): MemoryStats {
  return {
    meshCount: 0,
    materialCount: 0,
    geometryCount: 0,
    textureCount: 0,
    textureMemory: 0,
    geometryMemory: 0,
    totalMemory: 0,
    duplicateTextures: 0,
    rawTextureCount: 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    resourceManager: {
      active: false,
      count: 0
    }
  };
} 