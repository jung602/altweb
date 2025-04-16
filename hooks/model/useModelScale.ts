import { useState, useCallback, useEffect } from 'react';
import { useSpring } from '@react-spring/three';

interface UseModelScaleProps {
  baseScale: number;
  isCurrentModel: boolean;
  isExpanded: boolean;
  resetRotation: () => void;
  getResponsiveScale: (scale: number) => number;
}

export function useModelScale({
  baseScale,
  isCurrentModel,
  isExpanded,
  resetRotation,
  getResponsiveScale
}: UseModelScaleProps) {
  // 스크롤에 의한 스케일 조정을 위한 상태 추가
  const [scrollScale] = useState(1.0);
  
  // 기본 스케일 계산
  const responsiveScale = getResponsiveScale(baseScale);
  const targetScaleFactor = isExpanded ? 1.0 : 0.9;
  
  // 스프링 애니메이션 적용 - 더 자연스러운 스프링 값 적용
  const spring = useSpring({
    scale: responsiveScale * targetScaleFactor,
    config: { 
      mass: 1.2,       // 질량 - 높을수록 더 무거운 느낌
      tension: 210,    // 탄성 - 낮을수록 더 부드러움
      friction: 24,    // 마찰 - 높을수록 더 빨리 안정화됨
      clamp: false     // 오버슈트 허용 (true로 설정하면 목표값을 초과하지 않음)
    }
  });

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback((e: WheelEvent) => {
    if (isCurrentModel && !isExpanded) {
      // 확장 모드가 아닐 때만 기존 동작 유지
      resetRotation();
    }
  }, [isCurrentModel, resetRotation, isExpanded]);

  // isExpanded 상태가 변경될 때 회전 초기화
  useEffect(() => {
    if (!isExpanded) {
      // 확장 모드에서 일반 모드로 돌아갈 때 회전도 초기화
      resetRotation();
    }
  }, [isExpanded, resetRotation]);

  return {
    finalScale: spring.scale,
    handleScroll
  };
} 