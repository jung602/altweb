import { useCallback, useEffect, useRef, useState } from 'react';
import { useSceneStore } from '../store/sceneStore';

export const useSceneScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const isModelHovered = useSceneStore((state) => state.isModelHovered);
  const isExpanded = useSceneStore((state) => state.isExpanded);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [baseSize, setBaseSize] = useState(2000);
  const [isInitialized, setIsInitialized] = useState(false);

  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isMobileDevice = useRef(false);
  const lastScrollTime = useRef(0);
  const accumulatedDelta = useRef(0);
  const isScrolling = useRef(false);
  const scrollThreshold = 800;
  const deltaThreshold = 50;

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
      const direction = delta > 0 ? 1 : -1;
      const newIndex = currentIndex + direction;
      
      if (newIndex >= 0 && newIndex < scenes.length) {
        setCurrentScene(newIndex);
        lastScrollTime.current = now;
        accumulatedDelta.current = 0;
        
        // 스크롤 잠금 해제를 위한 타이머 설정
        setTimeout(() => {
          isScrolling.current = false;
        }, scrollThreshold);
      } else {
        isScrolling.current = false;
      }
    }
  }, [currentIndex, scenes.length, setCurrentScene, isModelHovered, isExpanded]);

  const handleTouch = {
    start: (e: React.TouchEvent) => {
      if (isExpanded) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      accumulatedDelta.current = 0; // 터치 시작시 누적값 리셋
    },
    move: (e: React.TouchEvent) => {
      if (isExpanded) return;
      
      const now = Date.now();
      if (now - lastScrollTime.current < scrollThreshold) return;
      
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = touchStartY.current - currentY;
      const deltaX = touchStartX.current - currentX;
      
      // 터치 민감도 조절
      const threshold = isMobileDevice.current ? 80 : 120;
      
      if (Math.abs(deltaY) > threshold || Math.abs(deltaX) > threshold) {
        const direction = deltaY > 0 ? 1 : -1;
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < scenes.length) {
          setCurrentScene(newIndex);
          lastScrollTime.current = now;
          touchStartY.current = currentY;
          touchStartX.current = currentX;
        }
      }
    },
    end: () => {
      touchStartY.current = 0;
      touchStartX.current = 0;
      accumulatedDelta.current = 0; // 터치 종료시 누적값 리셋
    }
  };

  useEffect(() => {
    isMobileDevice.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
        setBaseSize(Math.min(window.innerWidth, window.innerHeight) * 0.8);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    setIsInitialized(true);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
    scenes,
    currentIndex,
    baseSize,
    dimensions,
    isInitialized,
    handleTouch,
  };
};