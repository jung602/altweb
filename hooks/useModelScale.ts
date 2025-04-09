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
  const [scrollScale, setScrollScale] = useState(1.0);
  
  // 기본 스케일 계산
  const responsiveScale = getResponsiveScale(baseScale);
  const targetScaleFactor = isExpanded ? scrollScale : 0.9;
  
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
    if (isCurrentModel) {
      if (isExpanded) {
        // 확장 모드에서는 스크롤로 크기 조절
        e.preventDefault();
        // 스크롤 방향에 따라 크기 증감 (deltaY가 양수면 축소, 음수면 확대)
        const scrollDirection = e.deltaY > 0 ? -1 : 1;
        // 스크롤 감도 조절 (값이 작을수록 더 세밀하게 조절)
        const scrollSensitivity = 0.03; // 더 부드럽게 조절하기 위해 감도 감소
        
        setScrollScale(prevScale => {
          // 새 스케일 계산 (범위 제한)
          const newScale = Math.max(0.8, Math.min(1.3, prevScale + scrollDirection * scrollSensitivity));
          return newScale;
        });
      } else {
        // 확장 모드가 아닐 때는 기존 동작 유지
        resetRotation();
      }
    }
  }, [isCurrentModel, resetRotation, isExpanded]);

  // isExpanded 상태가 변경될 때 스크롤 스케일 초기화
  useEffect(() => {
    if (!isExpanded) {
      setScrollScale(1.0);
      // 확장 모드에서 일반 모드로 돌아갈 때 회전도 초기화
      resetRotation();
    }
  }, [isExpanded, resetRotation]);

  return {
    finalScale: spring.scale,
    handleScroll
  };
} 