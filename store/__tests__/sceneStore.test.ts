import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSceneStore } from '../sceneStore'
import { act } from '@testing-library/react'

describe('sceneStore', () => {
  beforeEach(() => {
    const store = useSceneStore.getState()
    store.resetState()
  })

  describe('기본 상태', () => {
    it('초기 상태가 올바르게 설정되어 있어야 함', () => {
      const state = useSceneStore.getState()
      expect(state.currentIndex).toBe(0)
      expect(state.isExpanded).toBe(false)
      expect(state.isIndexView).toBe(false)
    })
  })

  describe('씬 네비게이션', () => {
    it('유효한 인덱스로 씬을 변경할 수 있어야 함', () => {
      const store = useSceneStore.getState()
      act(() => {
        store.setCurrentScene(1)
      })
      expect(store.currentIndex).toBe(1)
      expect(store.isTransitioning).toBe(true)
    })

    it('유효하지 않은 인덱스는 에러를 설정해야 함', () => {
      const store = useSceneStore.getState()
      act(() => {
        store.setCurrentScene(-1)
      })
      expect(store.error).toBeTruthy()
      expect(store.currentIndex).toBe(0)
    })
  })

  describe('뷰 상태 관리', () => {
    it('expanded 상태를 토글할 수 있어야 함', () => {
      const store = useSceneStore.getState()
      act(() => {
        store.toggleExpanded()
      })
      expect(store.isExpanded).toBe(true)
      expect(store.isIndexView).toBe(false)

      act(() => {
        store.toggleExpanded()
      })
      expect(store.isExpanded).toBe(false)
      expect(store.isIndexView).toBe(store.previousIsIndexView)
    })

    it('인덱스 뷰 상태를 변경할 수 있어야 함', () => {
      const store = useSceneStore.getState()
      act(() => {
        store.setIndexView(true)
      })
      expect(store.isIndexView).toBe(true)
      expect(store.previousIsIndexView).toBe(true)
      expect(store.isExpanded).toBe(false)
    })
  })

  describe('비동기 액션', () => {
    it('씬 로딩을 처리할 수 있어야 함', async () => {
      const store = useSceneStore.getState()
      
      const loadingStates: boolean[] = []
      const unsubscribe = useSceneStore.subscribe(
        (state) => loadingStates.push(state.isLoading)
      )

      await act(async () => {
        await store.loadScene(1)
      })

      unsubscribe()

      expect(loadingStates).toEqual([false, true, false])
      expect(store.currentIndex).toBe(1)
      expect(store.error).toBeNull()
    })

    it('잘못된 씬 인덱스에 대해 에러를 처리해야 함', async () => {
      const store = useSceneStore.getState()
      
      await act(async () => {
        await store.loadScene(-1)
      })

      expect(store.error).toBeTruthy()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('상태 초기화', () => {
    it('상태를 초기값으로 리셋할 수 있어야 함', () => {
      const store = useSceneStore.getState()
      
      act(() => {
        store.setCurrentScene(1)
        store.setExpanded(true)
        store.setIndexView(true)
      })

      act(() => {
        store.resetState()
      })

      expect(store.currentIndex).toBe(0)
      expect(store.isExpanded).toBe(false)
      expect(store.isIndexView).toBe(false)
    })
  })
}) 