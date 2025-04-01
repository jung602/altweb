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
  
  // 스크롤 이벤트 처리
  const handleScroll = useCallback((e: WheelEvent) => {
    if (isExpanded || isModelHovered) return;
    
    e.preventDefault();
    const now = Date.now();
    
    // 이미 스크롤 중이면 무시
    if (isScrolling.current) return;
    
    // 시간 간격 체크
    if (now - lastScrollTime.current < scrollThreshold) return;
    
    // 누적 델타값 계산 및 체크
    accumulatedDelta.current += Math.abs(e.deltaY);
    if (accumulatedDelta.current < deltaThreshold) return;
    
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
        
        // 스크롤 완료 후 블러 해제
        setTimeout(() => {
          isScrolling.current = false;
          onBlurChange(false);
        }, scrollThreshold);
      } else {
        isScrolling.current = false;
        onBlurChange(false);
      }
    }
  }, [currentIndex, totalItems, onIndexChange, isExpanded, isModelHovered, onBlurChange, scrollThreshold, deltaThreshold]);
  
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
    if (now - lastScrollTime.current < scrollThreshold) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = touchStartY.current - currentY;
    const deltaX = touchStartX.current - currentX;
    
    // 수직 스크롤만 감지하도록 수정
    if (Math.abs(deltaY) > 20) { // 작은 수직 움직임은 무시
      const threshold = isMobile ? 30 : 50;
      
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
  }, [isExpanded, scrollThreshold, isMobile, currentIndex, totalItems, onIndexChange]);
  
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