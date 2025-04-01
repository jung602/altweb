import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { SceneConfig } from '../types/scene'
import { scenesData } from '../data/scenes'

// 상태를 논리적 그룹으로 분리
interface ViewState {
  isIndexView: boolean
  previousIsIndexView: boolean
  isExpanded: boolean
}

interface SceneState {
  scenes: SceneConfig[]
  currentIndex: number
  isTransitioning: boolean
  scrollCompleted: boolean
}

interface InteractionState {
  isModelHovered: boolean
  isLabelsVisible: boolean
  areLabelsOpen: boolean
  isLoading: boolean
  error: string | null
  isBlurred: boolean
}

interface StoreState extends ViewState, SceneState, InteractionState {
  // 기본 액션
  setModelHovered: (hovered: boolean) => void
  setCurrentScene: (index: number) => void
  setTransitioning: (isTransitioning: boolean) => void
  toggleExpanded: () => void
  setScrollCompleted: (completed: boolean) => void
  setLabelsVisible: (visible: boolean) => void
  setLabelsOpen: (open: boolean) => void
  setIndexView: (isIndexView: boolean) => void
  setExpanded: (isExpanded: boolean) => void
  
  // 추가된 액션
  resetState: () => void
  setError: (error: string | null) => void
  setLoading: (isLoading: boolean) => void
  
  // 비동기 액션
  loadScene: (index: number) => Promise<void>
  setBlurred: (blurred: boolean) => void
}

// 초기 상태를 상수로 분리
const initialState = {
  // 뷰 상태
  isIndexView: false,
  previousIsIndexView: false,
  isExpanded: false,
  
  // 씬 상태
  scenes: scenesData,
  currentIndex: 0,
  isTransitioning: false,
  scrollCompleted: false,
  
  // 인터랙션 상태
  isModelHovered: false,
  isLabelsVisible: false,
  areLabelsOpen: false,
  isLoading: false,
  error: null,
  isBlurred: false,
}

// 타입 가드
const isValidSceneIndex = (index: number, scenes: SceneConfig[]): boolean => {
  return index >= 0 && index < scenes.length
}

export const useSceneStore = create<StoreState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // 기본 액션들
        setCurrentScene: (index: number) => 
          set(
            (state) => {
              if (!isValidSceneIndex(index, state.scenes)) {
                state.error = '유효하지 않은 씬 인덱스입니다.'
                return
              }
              if (state.currentIndex === index) return
              state.currentIndex = index
              state.isTransitioning = true
              state.error = null
            },
            false,
            'setCurrentScene'
          ),

        setTransitioning: (isTransitioning: boolean) =>
          set((state) => { state.isTransitioning = isTransitioning }, false, 'setTransitioning'),

        setModelHovered: (hovered: boolean) =>
          set((state) => { state.isModelHovered = hovered }, false, 'setModelHovered'),

        toggleExpanded: () =>
          set(
            (state) => {
              const wasExpanded = state.isExpanded;
              const wasIndexView = state.isIndexView;
              
              if (wasExpanded) {
                // expanded 상태가 해제될 때
                state.isExpanded = false;
                state.isIndexView = state.previousIsIndexView;
              } else {
                // expanded 상태가 활성화될 때
                state.isExpanded = true;
                state.previousIsIndexView = wasIndexView;
                state.isIndexView = false;
              }
            },
            false,
            'toggleExpanded'
          ),

        setScrollCompleted: (completed: boolean) =>
          set((state) => { state.scrollCompleted = completed }, false, 'setScrollCompleted'),

        setLabelsVisible: (visible: boolean) =>
          set((state) => { state.isLabelsVisible = visible }, false, 'setLabelsVisible'),

        setLabelsOpen: (open: boolean) =>
          set((state) => { state.areLabelsOpen = open }, false, 'setLabelsOpen'),

        setIndexView: (isIndexView: boolean) =>
          set(
            (state) => {
              state.isIndexView = isIndexView;
              state.previousIsIndexView = isIndexView;
              state.isExpanded = false;
              state.scrollCompleted = false;
            },
            false,
            'setIndexView'
          ),

        setExpanded: (isExpanded: boolean) =>
          set(
            (state) => {
              const wasExpanded = state.isExpanded;
              
              state.isExpanded = isExpanded;
              
              if (!isExpanded && wasExpanded) {
                // expanded 상태가 해제될 때만 이전 상태로 복원
                state.isIndexView = state.previousIsIndexView;
              } else if (isExpanded) {
                // expanded 상태가 활성화될 때
                state.previousIsIndexView = state.isIndexView;
                state.isIndexView = false;
              }
              
              state.scrollCompleted = false;
            },
            false,
            'setExpanded'
          ),

        // 추가된 액션들
        resetState: () => set(
          () => ({ ...initialState }),
          false,
          'resetState'
        ),

        setError: (error: string | null) =>
          set((state) => { state.error = error }, false, 'setError'),

        setLoading: (isLoading: boolean) =>
          set((state) => { state.isLoading = isLoading }, false, 'setLoading'),

        // 비동기 액션
        loadScene: async (index: number) => {
          const state = get()
          if (!isValidSceneIndex(index, state.scenes)) {
            set((state) => { state.error = '유효하지 않은 씬 인덱스입니다.' }, false, 'loadScene/error')
            return
          }

          set((state) => { state.isLoading = true }, false, 'loadScene/start')

          try {
            // 씬 로딩 시뮬레이션 (실제 구현에서는 여기에 로딩 로직 추가)
            await new Promise(resolve => setTimeout(resolve, 500))
            
            set(
              (state) => {
                state.currentIndex = index
                state.isTransitioning = true
                state.isLoading = false
                state.error = null
              },
              false,
              'loadScene/success'
            )
          } catch (error) {
            set(
              (state) => {
                state.isLoading = false
                state.error = error instanceof Error ? error.message : '씬 로딩 중 오류가 발생했습니다.'
              },
              false,
              'loadScene/error'
            )
          }
        },

        setBlurred: (blurred) =>
          set((state) => {
            state.isBlurred = blurred;
          }),
      })),
      {
        name: 'scene-store',
        version: 1,
        partialize: (state) => ({
          isIndexView: state.isIndexView,
          previousIsIndexView: state.previousIsIndexView,
        }),
      }
    ),
    {
      name: 'scene-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

// 기본 selector 함수들
export const useSceneIndex = () => useSceneStore((state) => state.currentIndex)
export const useIsExpanded = () => useSceneStore((state) => state.isExpanded)
export const useIsIndexView = () => useSceneStore((state) => state.isIndexView)

// 추가 selector 함수들
export const useCurrentScene = () => useSceneStore((state) => state.scenes[state.currentIndex])
export const useSceneError = () => useSceneStore((state) => state.error)
export const useIsLoading = () => useSceneStore((state) => state.isLoading)
export const useLabelsState = () => useSceneStore((state) => ({
  isVisible: state.isLabelsVisible,
  isOpen: state.areLabelsOpen,
}))

// 복합 selector
export const useSceneNavigation = () => useSceneStore((state) => ({
  currentIndex: state.currentIndex,
  isTransitioning: state.isTransitioning,
  canGoNext: state.currentIndex < state.scenes.length - 1,
  canGoPrev: state.currentIndex > 0,
  totalScenes: state.scenes.length,
}))