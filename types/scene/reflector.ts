import { Position3D, Rotation3D, Scale3D, ColorString, Size2D } from '../common';

/**
 * 리플렉터 아이템 구성 타입
 */
export interface ReflectorItemConfig {
  scale?: Scale3D;
  position: Position3D;
  rotation: Rotation3D;
  blur?: Size2D;
  mixBlur?: number;
  mixStrength?: number;
  resolution?: number;
  args?: Size2D;
  mirror?: number;
  minDepthThreshold?: number;
  maxDepthThreshold?: number;
  depthScale?: number;
  metalness?: number;
  roughness?: number;
  color?: ColorString;
  radius?: number;
  smoothness?: number;
  clipBias?: number;
  overlayOpacity?: number;
  overlayOffset?: Position3D;
}

/**
 * 리플렉터 전체 구성 타입
 */
export interface ReflectorConfig {
  enabled: boolean;
  items: ReflectorItemConfig[];
} 