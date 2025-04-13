import { useCallback, useRef, useEffect } from 'react';
import { useResponsiveDevice } from './useResponsiveDevice';

interface UseDeviceNavigationOptions {
  currentIndex: number;
  totalItems: number;
  isExpanded: boolean;
  isModelHovered?: boolean;
  onIndexChange: (newIndex: number) => void;
  onBlurChange: (isBlurred: boolean) => void;
  scrollThreshold?: number;
  deltaThreshold?: number;
}

interface UseDeviceNavigationResult {
  containerRef: React.RefObject<HTMLDivElement>;
  handleTouch: {
    start: (e: React.TouchEvent) => void;
    move: (e: React.TouchEvent) => void;
    end: () => void;
  };
}

/**
 * 여러 입력 장치를 통한 네비게이션을 처리하는 통합 훅
 * @param options - 네비게이션 옵션
 * @returns 컨테이너 참조 및 터치 이벤트 핸들러
 */
export function useDeviceNavigation({
  currentIndex,
  totalItems,
  isExpanded,
  isModelHovered = false,
  onIndexChange,
  onBlurChange,
  scrollThreshold = 800,
  deltaThreshold = 50
}: UseDeviceNavigationOptions): UseDeviceNavigationResult {
  const { isMobile } = useResponsiveDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  const accumulatedDelta = useRef(0);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const lastWheelEvent = useRef<WheelEvent | null>(null);
  const wheelEvents = useRef<number[]>([]);
  
  // 트랙패드 인식 로직
  const isTrackpad = useCallback((e: WheelEvent): boolean => {
    // deltaMode가 0이면 픽셀 기반으로, 대부분의 트랙패드는 이 모드를 사용
    // deltaY 값이 작으면 대체로 트랙패드 (트랙패드는 미세한 움직임도 감지)
    const isSmallDelta = Math.abs(e.deltaY) < 10;
    const isPixelMode = e.deltaMode === 0;
    
    // 트랙패드는 보통 이전 이벤트 발생 시간과 매우 가까움
    if (lastWheelEvent.current) {
      const timeDiff = e.timeStamp - lastWheelEvent.current.timeStamp;
      if (timeDiff < 100) { // 100ms 내에 이벤트가 연속적으로 발생하면 트랙패드일 가능성이 높음
        wheelEvents.current.push(timeDiff);
        
        // 최근 4개 이벤트만 유지
        if (wheelEvents.current.length > 4) {
          wheelEvents.current.shift();
        }
        
        // 이벤트 간격이 일정하면 트랙패드일 가능성이 높음
        if (wheelEvents.current.length >= 3) {
          const avg = wheelEvents.current.reduce((a, b) => a + b, 0) / wheelEvents.current.length;
          const isConsistent = wheelEvents.current.every(t => Math.abs(t - avg) < 20);
          
          lastWheelEvent.current = e;
          return isPixelMode && isConsistent;
        }
      } else {
        // 시간 간격이 멀면 휠 이벤트 배열 초기화
        wheelEvents.current = [];
      }
    }
    
    lastWheelEvent.current = e;
    return isPixelMode && isSmallDelta;
  }, []);
  
  // 스크롤 이벤트 처리
  const handleScroll = useCallback((e: WheelEvent) => {
    if (isExpanded || isModelHovered) return;
    
    e.preventDefault();
    const now = Date.now();
    
    // 이미 스크롤 중이면 무시
    if (isScrolling.current) return;
    
    // 트랙패드 감지
    const usingTrackpad = isTrackpad(e);
    
    // 시간 간격 체크 (디바이스에 따라 다른 간격 적용)
    const timeThreshold = usingTrackpad ? 1200 : 1000; // 트랙패드는 더 긴 시간 간격 적용
    if (now - lastScrollTime.current < timeThreshold) return;
    
    // 누적 델타값 계산 및 체크 (디바이스에 따라 다른 임계값 적용)
    accumulatedDelta.current += Math.abs(e.deltaY);
    
    // 트랙패드는 더 높은 임계값 적용 (덜 민감하게)
    const deltaLimit = usingTrackpad ? 120 : 30;
    if (accumulatedDelta.current < deltaLimit) return;
    
    const delta = e.deltaY;
    if (Math.abs(delta) > 0) {
      isScrolling.current = true;
      onBlurChange(true);  // 스크롤 시작 시 블러 적용
      const direction = delta > 0 ? 1 : -1;
      const newIndex = currentIndex + direction;
      
      if (newIndex >= 0 && newIndex < totalItems) {
        onIndexChange(newIndex);
        lastScrollTime.current = now;
        accumulatedDelta.current = 0;
        
        // 스크롤 완료 후 블러 해제 (더 빠른 응답을 위해 시간 간격 감소)
        setTimeout(() => {
          isScrolling.current = false;
          onBlurChange(false);
        }, usingTrackpad ? 700 : 500); // 트랙패드는 더 긴 시간 적용
      } else {
        isScrolling.current = false;
        onBlurChange(false);
      }
    }
  }, [currentIndex, totalItems, onIndexChange, isExpanded, isModelHovered, onBlurChange, isTrackpad]);
  
  // 터치 시작 처리
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isExpanded) return;
    
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    onBlurChange(true);
  }, [isExpanded, onBlurChange]);
  
  // 터치 이동 처리
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isExpanded) return;
    
    const now = Date.now();
    if (now - lastScrollTime.current < 1100) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = touchStartY.current - currentY;
    const deltaX = touchStartX.current - currentX;
    
    // 수직 스크롤만 감지하도록 수정
    if (Math.abs(deltaY) > 20) { // 작은 수직 움직임은 무시
      const threshold = isMobile ? 25 : 40; // 감도 증가
      
      if (Math.abs(deltaY) > threshold) {
        const direction = deltaY > 0 ? 1 : -1;
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < totalItems) {
          e.preventDefault(); // 브라우저 기본 스크롤 동작 방지
          onIndexChange(newIndex);
          lastScrollTime.current = now;
          touchStartY.current = currentY;
          touchStartX.current = currentX;
        }
      }
    }
  }, [isExpanded, isMobile, currentIndex, totalItems, onIndexChange]);
  
  // 터치 종료 처리
  const handleTouchEnd = useCallback(() => {
    touchStartY.current = 0;
    touchStartX.current = 0;
    
    setTimeout(() => {
      onBlurChange(false);
    }, 300);
  }, [onBlurChange]);
  
  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleScroll, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleScroll);
      }
    };
  }, [handleScroll]);
  
  return {
    containerRef,
    handleTouch: {
      start: handleTouchStart,
      move: handleTouchMove,
      end: handleTouchEnd
    }
  };
} 