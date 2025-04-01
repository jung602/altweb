import { useCallback, useRef } from 'react';
import { useResponsiveDevice } from './useResponsiveDevice';

interface UseTouchNavigationOptions {
  currentIndex: number;
  totalItems: number;
  isExpanded: boolean;
  onIndexChange: (newIndex: number) => void;
  onBlurChange: (isBlurred: boolean) => void;
  scrollThreshold?: number;
}

interface UseTouchNavigationResult {
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
}

/**
 * 터치 제스처를 통한 네비게이션을 처리하는 훅
 * @param options - 터치 네비게이션 옵션
 * @returns 터치 이벤트 핸들러
 */
export function useTouchNavigation({
  currentIndex,
  totalItems,
  isExpanded,
  onIndexChange,
  onBlurChange,
  scrollThreshold = 800
}: UseTouchNavigationOptions): UseTouchNavigationResult {
  const { isMobile } = useResponsiveDevice();
  
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const lastScrollTime = useRef(0);
  
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
  
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
} 