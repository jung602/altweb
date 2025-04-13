// types/scene.ts

export const MODEL_COMPONENTS = ['Alt1', 'Alt2', 'Alt3', 'Alt4', 'Alt5', 'Alt6', 'Alt7', 'Alt8', 'Alt9'] as const;
export type ModelComponentType = typeof MODEL_COMPONENTS[number];

export interface Label {
  title: string
  content: string
  position: [number, number, number]
}

export interface ReflectorItemConfig {
  scale?: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  blur?: [number, number];
  mixBlur?: number;
  mixStrength?: number;
  resolution?: number;
  args?: [number, number];
  mirror?: number;
  minDepthThreshold?: number;
  maxDepthThreshold?: number;
  depthScale?: number;
  metalness?: number;
  roughness?: number;
  color?: string;
  radius?: number;
  smoothness?: number;
  clipBias?: number;
  overlayOpacity?: number;
  overlayOffset?: [number, number, number];
}

export interface ReflectorConfig {
  enabled: boolean;
  items: ReflectorItemConfig[];
}

export interface SceneConfig {
  id: string;
  title: string;
  description: string;
  location: string;
  thumbnail: string;
  model: {
    component: ModelComponentType;
    scale: number;
    position: [number, number, number];
    rotation: [number, number, number];
  };
  labels?: Label[];
  reflector?: ReflectorConfig;
}