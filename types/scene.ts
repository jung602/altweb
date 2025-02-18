// types/scene.ts

export const MODEL_COMPONENTS = ['Alt1', 'Alt2', 'Alt3', 'Alt4', 'Alt5'] as const;
export type ModelComponentType = typeof MODEL_COMPONENTS[number];

export interface Label {
  title: string
  content: string
  position: [number, number, number]
}
 
export interface ReflectorConfig {
  enabled: boolean;
  scale: [number, number, number];
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
}

export interface SceneConfig {
  id: string;
  title: string;
  description: string;
  location: string;
  model: {
    component: ModelComponentType;
    scale: number;
    position: [number, number, number];
    rotation: [number, number, number];
  };
  labels?: Label[];
  reflector?: ReflectorConfig;
}