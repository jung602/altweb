import { useState, useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { useResponsiveDevice } from './useResponsiveDevice';
import { useDeviceNavigation } from './useDeviceNavigation';

/**
 * 씬 스크롤 및 네비게이션을 처리하는 훅
 * @returns 씬 스크롤 관련 상태 및 핸들러
 */
export const useSceneScroll = () => {
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const isModelHovered = useSceneStore((state) => state.isModelHovered);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setBlurred = useSceneStore((state) => state.setBlurred);

  const { width, height, getBaseSize } = useResponsiveDevice();
  const [isInitialized, setIsInitialized] = useState(false);

  // 기본 크기 계산
  const baseSize = getBaseSize();

  // 초기화 상태 설정
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 통합된 디바이스 네비게이션 훅 사용
  const { containerRef, handleTouch } = useDeviceNavigation({
    currentIndex,
    totalItems: scenes.length,
    isExpanded,
    isModelHovered,
    onIndexChange: setCurrentScene,
    onBlurChange: setBlurred
  });

  return {
    containerRef,
    scenes,
    currentIndex,
    baseSize,
    dimensions: { width, height },
    isInitialized,
    handleTouch
  };
};