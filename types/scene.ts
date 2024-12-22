// types/scene.ts
import { Alt1 } from '../models/alt1'
import { Alt2 } from '../models/alt2'
import { BufferGeometry, Material } from 'three';

export const ModelComponents = {
  Alt1,
  Alt2,
} as const

// types/scene.ts
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
    component: keyof typeof ModelComponents
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
  background: {
    color: string
  }
  environment: {
    preset: 'none' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'
  }
  labels?: Label[]
 }