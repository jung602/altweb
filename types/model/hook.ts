import * as THREE from 'three';
import { ModelComponentType } from './components';
import { MemoryStats } from './analysis';

/**
 * useModel 훅 옵션 인터페이스
 */
export interface UseModelOptions {
  component: ModelComponentType;
  basePath?: string;
  onLoad?: () => void;
  onError?: (url: string) => void;
  defaultColor?: THREE.Color;
  checkInterval?: number;
  isDev?: boolean;
  renderer?: THREE.WebGLRenderer | null;
}

/**
 * useModel 훅 결과 인터페이스
 */
export interface UseModelResult {
  scene: THREE.Group;
  isNewModelReady: boolean;
  previousScene: THREE.Group | null;
  memoryStats: MemoryStats | null;
} 