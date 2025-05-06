/**
 * 메모리 관리 및 최적화 유틸리티 모듈
 */

// 메모리 관리 및 최적화 유틸리티
export * from './ModelCleaner';
export * from './ResourceDisposal';
export * from './MemoryStats';
export * from './GeometryUtils';
export * from './TextureUtils';
export * from './ModelAnalyzer';
export * from './ModelLoader';
export * from './MaterialOptimizer';
export * from './GeometryOptimizer';
export * from './SceneOptimizer';

// 메모리 통계 유틸리티
export { 
  formatBytes,
  createEmptyMemoryStats
} from './MemoryStats';
export type { MemoryStats } from './MemoryStats';

// 텍스처 관련 유틸리티
export {
  estimateTextureMemory,
  estimateCompressedTextureMemory,
  getTextureType,
  disposeTexture,
  disposeTexturesFromMaterial,
  analyzeCompressedTextures,
  optimizeTexture,
  optimizeMaterialTextures,
  cleanupTextureReferences
} from './TextureUtils';
export type { TextureOptimizationOptions } from './TextureUtils';

// 지오메트리 관련 유틸리티
export {
  estimateGeometryMemory,
  disposeGeometry
} from './GeometryUtils';

// 지오메트리 최적화 관련 유틸리티
export {
  getGeometryDetailFactor,
  getOptimizedVertexCount,
  analyzeGeometryOptimization,
  optimizeGeometry
} from './GeometryOptimizer';

// 리소스 처분 관련 유틸리티
export {
  disposeMesh,
  disposeSceneResources,
  cleanupGLTFModel,
  forceGlobalMemoryCleanup
} from './ResourceDisposal';

// 모델 최적화 관련 유틸리티
export {
  cleanupAndDisposeModel
} from './ModelCleaner';
export type { ModelOptimizationOptions } from './ModelCleaner';

// 모델 분석 관련 유틸리티
export {
  analyzeModelMemoryUsage,
  generateOptimizationSuggestions,
  analyzeAndLogModelInfo,
  checkMemoryUsageAndSuggestOptimizations,
  resetDisplayedWarnings
} from './ModelAnalyzer';

// 모델 로더 관련 유틸리티
export {
  loadGLTFModel,
  clearModelCache,
  preloadModels,
  getModelPath,
  cloneScene,
  isModelLoaded
} from './ModelLoader';

// 재질 및 씬 최적화 관련 유틸리티
export {
  optimizeMaterial,
  setEmissionIntensity,
  getTextureSizeLimit,
  getOptimizedTextureSize,
  cleanupMaterialOptimizations
} from './MaterialOptimizer';
export type { MaterialOptions } from './MaterialOptimizer';

// 씬 최적화 관련 유틸리티
export {
  optimizeScene,
  setSceneEmissionIntensity,
  getShadowQualitySettings,
  cleanupSceneOptimizations,
  initSceneOptimizer
} from './SceneOptimizer';
export type { SceneOptions } from './SceneOptimizer'; 