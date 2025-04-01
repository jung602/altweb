import { useCallback, useRef, useEffect, useState } from 'react';
import { devLog } from '../utils/logger';
import { ANIMATION_CONFIG } from '../config/sceneConfig';

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
  rotationApi?: any;
  rotationY?: any;
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
  handlePointerDown: (e: any) => void;
  handlePointerUp: (e: any) => void;
  handlePointerMove: (e: any) => void;
  isUserInteracting: React.MutableRefObject<boolean>;
  isDragging: boolean;
  startInteraction: (x: number, y: number) => void;
  endInteraction: (x: number, y: number, isClick: boolean) => void;
}

/**
 * 포인터 및 씬 인터랙션을 통합적으로 처리하는 훅
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

  const clickStartTime = useRef<number>(0);
  const clickStartPosition = useRef<PointerPosition | null>(null);
  const isUserInteracting = useRef<boolean>(false);
  const lastPosition = useRef<PointerPosition | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 드래그 시 회전 처리
  const handleSceneDrag = useCallback((deltaX: number, deltaY: number) => {
    if (!isExpanded && rotationApi && rotationY) {
      rotationApi.start({
        rotationY: rotationY.get() + deltaX * 0.01,
        // x축 회전은 제한
        config: ANIMATION_CONFIG.SPRING
      });
    }
    
    // 외부 드래그 핸들러 호출
    if (onDrag) {
      onDrag(deltaX, deltaY);
    }
  }, [isExpanded, rotationApi, rotationY, onDrag]);

  // 마우스 움직임에 따른 자동 회전 처리
  const handleSceneMouseMove = useCallback((x: number, y: number) => {
    if (rotationApi) {
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
  }, [rotationApi, onMouseMove]);

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
    if (!isExpanded && setBlurred) {
      setBlurred(true);
    }
    
    // 외부 인터랙션 시작 핸들러 호출
    if (onInteractionStart) {
      onInteractionStart();
    }
  }, [onInteractionStart, isExpanded, setBlurred, debug]);

  // 인터랙션 종료 처리
  const endInteraction = useCallback((x: number, y: number, isClick: boolean) => {
    if (isClick && toggleExpanded) {
      toggleExpanded();
      if (debug) {
        devLog('클릭 이벤트 발생', 'debug');
      }
    }
    
    clickStartPosition.current = null;
    lastPosition.current = null;
    isUserInteracting.current = false;
    setIsDragging(false);
    
    // 블러 효과 해제
    if (!isExpanded && setBlurred) {
      setBlurred(false);
    }
    
    if (debug) {
      devLog(`인터랙션 종료: (${x}, ${y})`, 'debug');
    }
    
    // 외부 인터랙션 종료 핸들러 호출
    if (onInteractionEnd) {
      onInteractionEnd();
    }
  }, [toggleExpanded, onInteractionEnd, isExpanded, setBlurred, debug]);

  // 드래그 처리
  const handleDrag = useCallback((currentX: number, currentY: number) => {
    if (!lastPosition.current) return;
    
    const deltaX = currentX - lastPosition.current.x;
    const deltaY = currentY - lastPosition.current.y;
    
    // 씬 드래그 처리
    handleSceneDrag(deltaX, deltaY);
    
    lastPosition.current = { x: currentX, y: currentY };
    
    if (debug) {
      devLog(`드래그: deltaX=${deltaX}, deltaY=${deltaY}`, 'debug');
    }
  }, [handleSceneDrag, debug]);

  // 포인터 다운 이벤트 처리
  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    const x = e.clientX || e.touches?.[0]?.clientX;
    const y = e.clientY || e.touches?.[0]?.clientY;
    startInteraction(x, y);
  }, [startInteraction]);

  // 포인터 업 이벤트 처리
  const handlePointerUp = useCallback((e: any) => {
    e.stopPropagation();
    
    if (!clickStartPosition.current) return;
    
    const endX = e.clientX || e.changedTouches?.[0]?.clientX;
    const endY = e.clientY || e.changedTouches?.[0]?.clientY;
    const clickDuration = performance.now() - clickStartTime.current;
    
    const moveDistance = Math.sqrt(
      Math.pow(endX - clickStartPosition.current.x, 2) +
      Math.pow(endY - clickStartPosition.current.y, 2)
    );

    // 짧은 시간 내에 적은 움직임이 있었을 때만 클릭으로 처리
    const isClick = clickDuration < clickThreshold && moveDistance < moveThreshold;
    endInteraction(endX, endY, isClick);
  }, [clickThreshold, moveThreshold, endInteraction]);

  // 포인터 이동 이벤트 처리
  const handlePointerMove = useCallback((e: any) => {
    if (!isUserInteracting.current || !clickStartPosition.current) return;
    
    const currentX = e.clientX || e.touches?.[0]?.clientX;
    const currentY = e.clientY || e.touches?.[0]?.clientY;
    
    if (!isDragging) {
      const moveDistance = Math.sqrt(
        Math.pow(currentX - clickStartPosition.current.x, 2) +
        Math.pow(currentY - clickStartPosition.current.y, 2)
      );

      // 일정 거리 이상 움직였을 때는 드래그 시작
      if (moveDistance > moveThreshold) {
        setIsDragging(true);
        if (debug) {
          devLog('드래그 시작', 'debug');
        }
      }
    } else {
      // 드래그 중이면 드래그 처리
      handleDrag(currentX, currentY);
    }
  }, [moveThreshold, isDragging, handleDrag, debug]);

  // 마우스 움직임에 따른 자동 회전 처리
  const handleMouseMove = useCallback((event: MouseEvent | TouchEvent) => {
    // 사용자 인터랙션 중이거나 확장 상태이거나 드래그 중이면 무시
    if (isUserInteracting.current || isExpanded || isDragging) return;
    
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
    
    // 씬 마우스 이동 처리
    handleSceneMouseMove(x, y);
  }, [handleSceneMouseMove, isExpanded, isDragging]);

  // 포인터 이동 이벤트 리스너 등록
  useEffect(() => {
    if (enableRotation) {
      window.addEventListener('pointermove', handlePointerMove);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
      };
    }
  }, [handlePointerMove, enableRotation]);

  // 마우스 움직임 이벤트 리스너 등록
  useEffect(() => {
    if (enableMouseTracking) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleMouseMove);
      };
    }
  }, [handleMouseMove, enableMouseTracking]);

  return {
    handlePointerDown,
    handlePointerUp,
    handlePointerMove,
    isUserInteracting,
    isDragging,
    startInteraction,
    endInteraction
  };
} 