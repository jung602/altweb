// store/sceneStore.ts
import { create } from 'zustand'
import { SceneConfig } from '../types/scene'
import { scenesData } from '../data/scenes'

interface SceneState {
  scenes: SceneConfig[]
  currentIndex: number
  isTransitioning: boolean
  setCurrentScene: (index: number) => void
  setTransitioning: (isTransitioning: boolean) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: scenesData,
  currentIndex: 0,
  isTransitioning: false,
  setCurrentScene: (index) => set({ currentIndex: index }),
  setTransitioning: (isTransitioning) => set({ isTransitioning })
}))