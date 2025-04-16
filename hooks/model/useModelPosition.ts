import { useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { ANIMATION_CONFIG } from '../../config/animation';

interface UseModelPositionProps {
  basePosition: [number, number, number];
  index: number;
  width: number;
  getResponsivePosition: (position: [number, number, number]) => [number, number, number];
}

export function useModelPosition({
  basePosition,
  index,
  width,
  getResponsivePosition
}: UseModelPositionProps) {
  // 반응형 위치 계산
  const responsivePosition = getResponsivePosition(basePosition);
  
  // 브라우저 너비 기준: 768px 이하면 4, 768px 초과 1440px 이하면 5, 1440px 초과면 6
  const ySpacing = width <= 768 ? 4 : width <= 1440 ? 5 : 6;
  const yPos = responsivePosition[1] + (index * -ySpacing);

  // 스프링 애니메이션 적용 - 원본과 동일한 설정 적용
  const spring = useSpring({
    positionX: responsivePosition[0],
    positionY: yPos,
    positionZ: responsivePosition[2],
    config: {
      ...ANIMATION_CONFIG.SPRING,
      friction: 60, // 원본 값으로 복원 (26 -> 60)
      tension: 280  // 원본 값으로 복원 (170 -> 280)
    }
  });

  return {
    spring,
    ySpacing
  };
} 