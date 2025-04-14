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