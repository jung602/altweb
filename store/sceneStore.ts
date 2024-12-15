// store/sceneStore.ts
import { create } from 'zustand'
import { SceneConfig } from '../types/scene'
import { scenesData } from '../data/scenes'

interface SceneState {
  scenes: SceneConfig[]
  currentIndex: number
  isTransitioning: boolean
  isExpanded: boolean
  setCurrentScene: (index: number) => void
  setTransitioning: (isTransitioning: boolean) => void
  toggleExpanded: () => void
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: scenesData,
  currentIndex: 0,
  isTransitioning: false,
  isExpanded: false,
  setCurrentScene: (index) => set({ currentIndex: index }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded }))
}))