import { useSpring, SpringValue } from '@react-spring/three';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { debounce } from 'lodash';
import { ANIMATION_CONFIG } from '../../config/animation';
import { useResponsiveDevice } from '../device/useResponsiveDevice';

interface UseSceneAnimationOptions {
  isExpanded: boolean;
  isTransitioning: boolean;
  setTransitioning: (isTransitioning: boolean) => void;
  setModelHovered: (isHovered: boolean) => void;
  baseScale: number;
  basePosition: [number, number, number];
}

interface UseSceneAnimationResult {
  springs: {
    scale: SpringValue<[number, number, number]>;
  };
  rotationSpring: {
    rotationX: SpringValue<number>;
    rotationY: SpringValue<number>;
  };
  rotationApi: any;
  responsiveScale: number;
  responsivePosition: [number, number, number];
  debouncedHoverHandler: (hovering: boolean) => void;
}

/**
 * 씬 애니메이션 관련 로직을 처리하는 훅
 * @param options - 애니메이션 옵션
 * @returns 애니메이션 스프링과 관련 함수들
 */
export function useSceneAnimation({
  isExpanded,
  isTransitioning,
  setTransitioning,
  setModelHovered,
  baseScale,
  basePosition
}: UseSceneAnimationOptions): UseSceneAnimationResult {
  // 반응형 정보 가져오기
  const { isMobile, getResponsiveScale, getResponsivePosition } = useResponsiveDevice();
  
  // 반응형 스케일 및 위치 계산
  const responsiveScale = getResponsiveScale(baseScale);
  const responsivePosition = getResponsivePosition(basePosition);

  // 회전 애니메이션 스프링
  const [rotationSpring, rotationApi] = useSpring(() => ({
    rotationX: 0,
    rotationY: 0,
    config: ANIMATION_CONFIG.SPRING
  }));

  // 스케일 애니메이션 스프링
  const springs = useSpring<{ scale: [number, number, number] }>({
    scale: isExpanded 
      ? [responsiveScale * 0.8, responsiveScale * 0.8, responsiveScale * 0.8] 
      : [responsiveScale * 0.7, responsiveScale * 0.7, responsiveScale * 0.7],
    config: ANIMATION_CONFIG.SPRING,
    onChange: () => {
      if (isTransitioning) {
        setTransitioning(false);
      }
    }
  });

  // 호버 이벤트 디바운스 처리
  const debouncedHoverHandler = useMemo(
    () => debounce((hovering: boolean) => {
      if (!isMobile) {
        setModelHovered(hovering && isExpanded);
      }
    }, 50),
    [isExpanded, setModelHovered, isMobile]
  );

  // 컴포넌트 언마운트 시 디바운스 핸들러 정리
  useEffect(() => {
    return () => {
      debouncedHoverHandler.cancel();
    };
  }, [debouncedHoverHandler]);

  // 확장 상태 변경 시 회전 초기화
  useEffect(() => {
    if (rotationApi) {
      rotationApi.start({
        rotationX: 0,
        rotationY: 0,
        config: ANIMATION_CONFIG.SPRING
      });
    }
  }, [rotationApi, isExpanded]);

  return {
    springs,
    rotationSpring,
    rotationApi,
    responsiveScale,
    responsivePosition,
    debouncedHoverHandler
  };
} 