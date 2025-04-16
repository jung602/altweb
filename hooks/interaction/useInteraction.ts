import { useCallback, useEffect, useState, useRef } from 'react';
import { devLog } from '../../utils/logger';
import { ANIMATION_CONFIG } from '../../config/animation';
import { useEventHandlers } from '../interaction/useEventHandlers';
import { useSpring, SpringValue, SpringRef } from '@react-spring/three';
import { ThreeEvent } from '@react-three/fiber';

interface PointerPosition {
  x: number;
  y: number;
}

interface UseInteractionOptions {
  // 기본 옵션
  clickThreshold?: number;
  moveThreshold?: number;
  debug?: boolean;
  
  // 상태 관련
  isExpanded?: boolean;
  toggleExpanded?: () => void;
  setBlurred?: (isBlurred: boolean) => void;
  
  // 회전 관련
  rotationApi?: SpringRef<{
    rotationX: number;
    rotationY: number;
  }>;
  rotationY?: SpringValue<number>;
  enableRotation?: boolean;
  
  // 마우스 트래킹 관련
  enableMouseTracking?: boolean;
  
  // 콜백 함수
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  onDrag?: (deltaX: number, deltaY: number) => void;
  onMouseMove?: (x: number, y: number) => void;
}

interface UseInteractionResult {
  handlePointerDown: (e: ThreeEvent<PointerEvent> | PointerEvent) => void;
  handlePointerUp: (e: ThreeEvent<PointerEvent> | PointerEvent) => void;
  handlePointerMove: (e: ThreeEvent<PointerEvent> | PointerEvent) => void;
  isUserInteracting: React.MutableRefObject<boolean>;
  isDragging: boolean;
}

/**
 * 3D 씬 인터랙션을 처리하는 훅
 * @param options - 인터랙션 옵션
 * @returns 인터랙션 핸들러와 상태
 */
export function useInteraction(options: UseInteractionOptions = {}): UseInteractionResult {
  const {
    // 기본 옵션
    clickThreshold = 200,
    moveThreshold = 10,
    debug = false,
    
    // 상태 관련
    isExpanded = false,
    toggleExpanded,
    setBlurred,
    
    // 회전 관련
    rotationApi,
    rotationY,
    enableRotation = true,
    
    // 마우스 트래킹 관련
    enableMouseTracking = false,
    
    // 콜백 함수
    onInteractionStart,
    onInteractionEnd,
    onDrag,
    onMouseMove
  } = options;

  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 드래그 시 회전 처리
  const handleSceneDrag = useCallback((deltaX: number, deltaY: number) => {
    if (!isExpanded && rotationApi && rotationY) {
      rotationApi.start({
        rotationY: rotationY.get() + deltaX * 0.01,
        config: ANIMATION_CONFIG.SPRING
      });
    }
    
    // 외부 드래그 핸들러 호출
    if (onDrag) {
      onDrag(deltaX, deltaY);
    }
    
    // 이미 드래그 중이 아니라면 상태 설정
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isExpanded, rotationApi, rotationY, onDrag, isDragging]);

  // 마우스 움직임에 따른 자동 회전 처리
  const handleSceneMouseMove = useCallback((x: number, y: number) => {
    if (rotationApi && !isExpanded && !isDragging) {
      rotationApi.start({
        rotationX: y * 0, // x축 회전은 비활성화
        rotationY: x * 0.3,
        config: ANIMATION_CONFIG.SPRING
      });
    }
    
    // 외부 마우스 이동 핸들러 호출
    if (onMouseMove) {
      onMouseMove(x, y);
    }
  }, [rotationApi, onMouseMove, isExpanded, isDragging]);

  // 이벤트 핸들러 생성
  const {
    handlePointerDown,
    handlePointerUp,
    handlePointerMove,
    handleMouseMove,
    isUserInteracting,
    handleDrag
  } = useEventHandlers({
    clickThreshold,
    moveThreshold,
    debug,
    onInteractionStart,
    onInteractionEnd,
    onDrag: handleSceneDrag,
    onMove: handleSceneMouseMove,
    onBlurChange: setBlurred,
    onClick: toggleExpanded
  });

  // 인터랙션 종료 시 드래깅 상태 리셋
  useEffect(() => {
    const checkInteraction = () => {
      if (!isUserInteracting.current && isDragging) {
        setIsDragging(false);
      }
    };
    
    const intervalId = setInterval(checkInteraction, 100);
    return () => clearInterval(intervalId);
  }, [isUserInteracting, isDragging]);

  // 포인터 이동 이벤트 리스너 등록
  useEffect(() => {
    if (enableRotation) {
      window.addEventListener('pointermove', handlePointerMove as (e: PointerEvent) => void);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove as (e: PointerEvent) => void);
      };
    }
  }, [handlePointerMove, enableRotation]);

  // 마우스 움직임 이벤트 리스너 등록
  useEffect(() => {
    if (enableMouseTracking) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleMouseMove as unknown as (e: TouchEvent) => void);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleMouseMove as unknown as (e: TouchEvent) => void);
      };
    }
  }, [handleMouseMove, enableMouseTracking]);

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerMove,
    isUserInteracting,
    isDragging
  };
} 