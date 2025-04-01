import { useCallback, useRef, useEffect } from 'react';

interface UseWheelNavigationOptions {
  currentIndex: number;
  totalItems: number;
  isExpanded: boolean;
  isModelHovered: boolean;
  onIndexChange: (newIndex: number) => void;
  onBlurChange: (isBlurred: boolean) => void;
  scrollThreshold?: number;
  deltaThreshold?: number;
}

interface UseWheelNavigationResult {
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * 휠 스크롤을 통한 네비게이션을 처리하는 훅
 * @param options - 휠 네비게이션 옵션
 * @returns 컨테이너 참조
 */
export function useWheelNavigation({
  currentIndex,
  totalItems,
  isExpanded,
  isModelHovered,
  onIndexChange,
  onBlurChange,
  scrollThreshold = 800,
  deltaThreshold = 50
}: UseWheelNavigationOptions): UseWheelNavigationResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  const accumulatedDelta = useRef(0);
  const isScrolling = useRef(false);
  
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
    containerRef
  };
} 