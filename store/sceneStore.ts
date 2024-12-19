import { create } from 'zustand'
import { SceneConfig } from '../types/scene'
import { scenesData } from '../data/scenes'

interface SceneState {
  scenes: SceneConfig[]
  currentIndex: number
  isTransitioning: boolean
  isExpanded: boolean
  scrollCompleted: boolean
  isModelHovered: boolean
  isVertical: boolean
  setIsVertical: (isVertical: boolean) => void
  setModelHovered: (hovered: boolean) => void
  setCurrentScene: (index: number) => void
  setTransitioning: (isTransitioning: boolean) => void
  toggleExpanded: () => void
  setScrollCompleted: (completed: boolean) => void
  isLabelsVisible: boolean
  areLabelsOpen: boolean
  setLabelsVisible: (visible: boolean) => void
  setLabelsOpen: (open: boolean) => void
}

export const useSceneStore = create<SceneState>((set) => ({
  scenes: scenesData,
  currentIndex: 0,
  isTransitioning: false,
  isExpanded: false,
  scrollCompleted: false,
  isModelHovered: false,
  isVertical: true,
  setIsVertical: (isVertical) => set({ isVertical }),
  setModelHovered: (hovered) => set({ isModelHovered: hovered }),
  setCurrentScene: (index) => set({ 
    currentIndex: index,
    scrollCompleted: false 
  }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
  toggleExpanded: () => set((state) => ({ 
    isExpanded: !state.isExpanded,
    scrollCompleted: false
  })),
  setScrollCompleted: (completed) => set({ scrollCompleted: completed }),
  isLabelsVisible: true,
  areLabelsOpen: false,
  setLabelsVisible: (visible) => set({ isLabelsVisible: visible }),
  setLabelsOpen: (open) => set({ areLabelsOpen: open })
}))