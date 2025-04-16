import { useCallback, useRef } from 'react';
import { devLog } from '../../utils/logger';
import { ThreeEvent } from '@react-three/fiber';

interface PointerPosition {
  x: number;
  y: number;
}

interface UseEventHandlersOptions {
  clickThreshold?: number;
  moveThreshold?: number;
  debug?: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  onDrag?: (deltaX: number, deltaY: number) => void;
  onMove?: (x: number, y: number) => void;
  onBlurChange?: (isBlurred: boolean) => void;
  onClick?: () => void;
}

// 포인터 이벤트 타입 정의
type PointerEventWithClientPosition = 
  | PointerEvent 
  | MouseEvent 
  | TouchEvent 
  | ThreeEvent<PointerEvent>;

/**
 * 기본적인 이벤트 핸들러와 상태 관리를 위한 훅
 * @param options - 이벤트 핸들러 옵션
 * @returns 이벤트 핸들러와 상태 관련 객체
 */
export function useEventHandlers({
  clickThreshold = 200,
  moveThreshold = 10,
  debug = false,
  onInteractionStart,
  onInteractionEnd,
  onDrag,
  onMove,
  onBlurChange,
  onClick
}: UseEventHandlersOptions = {}) {
  const clickStartTime = useRef<number>(0);
  const clickStartPosition = useRef<PointerPosition | null>(null);
  const isUserInteracting = useRef<boolean>(false);
  const lastPosition = useRef<PointerPosition | null>(null);
  
  // 인터랙션 시작 처리
  const startInteraction = useCallback((x: number, y: number) => {
    clickStartTime.current = performance.now();
    clickStartPosition.current = { x, y };
    lastPosition.current = { x, y };
    isUserInteracting.current = true;
    
    if (debug) {
      devLog(`인터랙션 시작: (${x}, ${y})`, 'debug');
    }
    
    // 블러 효과 설정
    if (onBlurChange) {
      onBlurChange(true);
    }
    
    // 인터랙션 시작 핸들러 호출
    if (onInteractionStart) {
      onInteractionStart();
    }
  }, [onInteractionStart, onBlurChange, debug]);

  // 인터랙션 종료 처리
  const endInteraction = useCallback((x: number, y: number, isClick: boolean) => {
    if (isClick && onClick) {
      onClick();
      if (debug) {
        devLog('클릭 이벤트 발생', 'debug');
      }
    }
    
    clickStartPosition.current = null;
    lastPosition.current = null;
    isUserInteracting.current = false;
    
    // 블러 효과 해제
    if (onBlurChange) {
      onBlurChange(false);
    }
    
    if (debug) {
      devLog(`인터랙션 종료: (${x}, ${y})`, 'debug');
    }
    
    // 인터랙션 종료 핸들러 호출
    if (onInteractionEnd) {
      onInteractionEnd();
    }
  }, [onClick, onInteractionEnd, onBlurChange, debug]);

  // 드래그 처리
  const handleDrag = useCallback((currentX: number, currentY: number) => {
    if (!lastPosition.current) return;
    
    const deltaX = currentX - lastPosition.current.x;
    const deltaY = currentY - lastPosition.current.y;
    
    // 드래그 핸들러 호출
    if (onDrag) {
      onDrag(deltaX, deltaY);
    }
    
    lastPosition.current = { x: currentX, y: currentY };
    
    if (debug) {
      devLog(`드래그: deltaX=${deltaX}, deltaY=${deltaY}`, 'debug');
    }
  }, [onDrag, debug]);

  // 움직임 처리
  const handleMove = useCallback((x: number, y: number) => {
    if (onMove) {
      onMove(x, y);
    }
  }, [onMove]);

  // 이벤트에서 클라이언트 좌표 추출
  const getClientCoordinates = (e: PointerEventWithClientPosition): { x: number, y: number } | null => {
    // React Three Fiber의 ThreeEvent인 경우
    if ('nativeEvent' in e) {
      return {
        x: e.clientX || e.nativeEvent.clientX,
        y: e.clientY || e.nativeEvent.clientY
      };
    }
    // TouchEvent인 경우
    else if ('touches' in e) {
      if (e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      }
      return null;
    }
    // 일반 MouseEvent/PointerEvent인 경우
    else {
      return { x: e.clientX, y: e.clientY };
    }
  };

  // 포인터 다운 이벤트 처리
  const handlePointerDown = useCallback((e: PointerEventWithClientPosition) => {
    if ('stopPropagation' in e) {
      e.stopPropagation();
    }
    
    const coords = getClientCoordinates(e);
    if (!coords) return;
    
    startInteraction(coords.x, coords.y);
  }, [startInteraction]);

  // 포인터 업 이벤트 처리
  const handlePointerUp = useCallback((e: PointerEventWithClientPosition) => {
    if ('stopPropagation' in e) {
      e.stopPropagation();
    }
    
    if (!clickStartPosition.current) return;
    
    const coords = getClientCoordinates(e);
    if (!coords) return;
    
    const clickDuration = performance.now() - clickStartTime.current;
    
    const moveDistance = Math.sqrt(
      Math.pow(coords.x - clickStartPosition.current.x, 2) +
      Math.pow(coords.y - clickStartPosition.current.y, 2)
    );

    // 짧은 시간 내에 적은 움직임이 있었을 때만 클릭으로 처리
    const isClick = clickDuration < clickThreshold && moveDistance < moveThreshold;
    endInteraction(coords.x, coords.y, isClick);
  }, [clickThreshold, moveThreshold, endInteraction]);

  // 포인터 이동 이벤트 처리
  const handlePointerMove = useCallback((e: PointerEventWithClientPosition) => {
    if (!isUserInteracting.current || !clickStartPosition.current) return;
    
    const coords = getClientCoordinates(e);
    if (!coords) return;
    
    const moveDistance = Math.sqrt(
      Math.pow(coords.x - clickStartPosition.current.x, 2) +
      Math.pow(coords.y - clickStartPosition.current.y, 2)
    );

    // 일정 거리 이상 움직였을 때는 드래그 시작
    if (moveDistance > moveThreshold) {
      handleDrag(coords.x, coords.y);
    }
  }, [moveThreshold, handleDrag]);

  // 마우스 움직임 이벤트 처리
  const handleMouseMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (isUserInteracting.current) return;
    
    let x, y;
    
    if ('touches' in event) {
      // 터치 이벤트인 경우
      const touch = event.touches[0];
      x = (touch.clientX / window.innerWidth) * 2 - 1;
      y = -(touch.clientY / window.innerHeight) * 2 + 1;
    } else {
      // 마우스 이벤트인 경우
      x = (event.clientX / window.innerWidth) * 2 - 1;
      y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    // 마우스 이동 처리
    handleMove(x, y);
  }, [handleMove]);

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerMove,
    handleMouseMove,
    isUserInteracting,
    startInteraction,
    endInteraction,
    handleDrag,
    handleMove
  };
} 