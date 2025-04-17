import { Position3D, Rotation3D } from './common';

/**
 * Rarerow 모델 구성 타입
 */
export interface RarerowModelConfig {
  position: Position3D;
  rotation: Rotation3D;
  scale: number;
}

/**
 * Rarerow 아이템 구성 타입
 */
export interface RarerowConfig {
  id: number;
  model: RarerowModelConfig;
} 