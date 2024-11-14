// types/scene.ts
import { Alt1 } from '../models/alt1'
import { Alt2 } from '../models/alt2'

export const ModelComponents = {
  Alt1,
  Alt2,
} as const

export interface SceneConfig {
  id: number
  title: string
  subtitle: string
  author: string
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
  shadowPlane: {
    position: [number, number, number]
    opacity: number
  }
  environment: {
    preset: 'none' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'
  }
}