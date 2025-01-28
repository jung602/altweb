// types/scene.ts
import { BufferGeometry, Material } from 'three';

export const MODEL_COMPONENTS = ['Alt1', 'Alt2', 'Alt3'] as const;
export type ModelComponentType = typeof MODEL_COMPONENTS[number];

export interface Label {
  title: string
  content: string
  position: [number, number, number]
}
 
export interface SceneConfig {
  id: string;
  title: string;
  description: string;
  geometry?: BufferGeometry;
  material?: Material;
  location: string
  model: {
    component: ModelComponentType
    scale: number
    position: [number, number, number]
    rotation: [number, number, number]
  }
  camera: {
    position: [number, number, number]
    fov: number
  }
  lights: {
    directional: {
      position: [number, number, number]
      intensity: number
    }
  }
  labels?: Label[]
}