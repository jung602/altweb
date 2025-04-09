import { useEffect } from 'react';

interface UseScrollEventsProps {
  isCurrentModel: boolean;
  isExpanded: boolean;
  resetRotation: () => void;
  handleScroll: (e: WheelEvent) => void;
}

export function useScrollEvents({
  isCurrentModel,
  isExpanded,
  resetRotation,
  handleScroll
}: UseScrollEventsProps) {
  // 스크롤 이벤트 리스너 등록 - wheel 이벤트 처리 방식 수정
  useEffect(() => {
    if (isCurrentModel) {
      // wheel 이벤트 리스너 등록
      const wheelListener = (e: WheelEvent) => {
        if (isExpanded) {
          e.preventDefault(); // 확장 모드에서는 기본 스크롤 동작 방지
        }
        handleScroll(e);
      };
      
      // scroll 이벤트는 동일하게 유지
      const scrollListener = () => {
        if (!isExpanded) {
          resetRotation();
        }
      };
      
      // wheel 이벤트는 passive: false로 설정하여 preventDefault 가능하게 함
      window.addEventListener('wheel', wheelListener, { passive: false });
      window.addEventListener('scroll', scrollListener);
      
      return () => {
        window.removeEventListener('wheel', wheelListener);
        window.removeEventListener('scroll', scrollListener);
      };
    }
  }, [isCurrentModel, resetRotation, handleScroll, isExpanded]);
} 