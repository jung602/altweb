export * from './components';
export * from './optimizer';
export * from './analysis';
export * from './hook';

import { Position3D, Rotation3D, Scale3D } from '../common';
import { ModelComponentType } from './components';

/**
 * 모델 구성 타입
 */
export interface ModelConfig {
  component: ModelComponentType;
  scale: number;
  position: Position3D;
  rotation: Rotation3D;
} 