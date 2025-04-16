import { useState, useEffect, useRef } from 'react';

interface UseModelVisibilityProps {
  currentIndex: number;
  allConfigsLength: number;
  isExpanded: boolean;
}

export function useModelVisibility({
  currentIndex,
  allConfigsLength,
  isExpanded
}: UseModelVisibilityProps) {
  // 이전 인덱스 추적
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  
  // 로드된 모델을 추적
  const [visibleModels, setVisibleModels] = useState<number[]>([
    Math.max(0, currentIndex - 1),
    currentIndex,
    Math.min(allConfigsLength - 1, currentIndex + 1)
  ].filter((idx, i, arr) => arr.indexOf(idx) === i)); // 중복 제거
  
  // 언로드 타이머
  const unloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 현재, 이전, 다음 모델만 로드하도록 관리 및 isExpanded 상태에 따라 메모리 해제
  useEffect(() => {
    // isExpanded 상태일 때는 현재 모델만 유지하고 다른 모델은 메모리에서 해제
    if (isExpanded) {
      if (visibleModels.length > 1 || !visibleModels.includes(currentIndex)) {
        setVisibleModels([currentIndex]);
      }
      return;
    }

    // 인덱스가 변경되었거나 isExpanded가 false로 변경된 경우 
    if (currentIndex !== prevIndex || visibleModels.length === 1) {
      // 현재 모델, 이전 모델, 다음 모델 순서로 배열 구성 (현재 모델이 1순위)
      const newVisibleModels = [
        currentIndex, // 현재 모델 먼저 로드 (1순위)
        Math.max(0, currentIndex - 1), // 이전 모델
        Math.min(allConfigsLength - 1, currentIndex + 1) // 다음 모델
      ].filter((idx, i, arr) => arr.indexOf(idx) === i); // 중복 제거
      
      setVisibleModels(newVisibleModels);
      setPrevIndex(currentIndex);
    }
  }, [currentIndex, allConfigsLength, visibleModels, prevIndex, isExpanded]);
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 모든 모델 메모리 해제
      setVisibleModels([]);
      
      // 언로드 타이머 정리
      if (unloadTimerRef.current) {
        clearTimeout(unloadTimerRef.current);
        unloadTimerRef.current = null;
      }
    };
  }, []);

  return {
    visibleModels
  };
} 