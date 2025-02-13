import { useCallback, useEffect, useRef, useState } from 'react';
import { useSceneStore } from '../store/sceneStore';

export const useSceneScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const isModelHovered = useSceneStore((state) => state.isModelHovered);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setBlurred = useSceneStore((state) => state.setBlurred);

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
      setBlurred(true);  // 스크롤 시작 시 블러 적용
      const direction = delta > 0 ? 1 : -1;
      const newIndex = currentIndex + direction;
      
      if (newIndex >= 0 && newIndex < scenes.length) {
        setCurrentScene(newIndex);
        lastScrollTime.current = now;
        accumulatedDelta.current = 0;
        
        // 스크롤 완료 후 블러 해제
        setTimeout(() => {
          isScrolling.current = false;
          setBlurred(false);
        }, scrollThreshold);
      } else {
        isScrolling.current = false;
        setBlurred(false);
      }
    }
  }, [currentIndex, scenes.length, setCurrentScene, isExpanded, isModelHovered, setBlurred]);

  const handleTouch = {
    start: (e: React.TouchEvent) => {
      if (isExpanded) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      accumulatedDelta.current = 0;
      setBlurred(true);
    },
    move: (e: React.TouchEvent) => {
      if (isExpanded) return;
      
      const now = Date.now();
      if (now - lastScrollTime.current < scrollThreshold) return;
      
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = touchStartY.current - currentY;
      const deltaX = touchStartX.current - currentX;
      
      // 수직 스크롤만 감지하도록 수정
      if (Math.abs(deltaY) > 20) { // 작은 수직 움직임은 무시
        const threshold = isMobileDevice.current ? 30 : 50;
        
        if (Math.abs(deltaY) > threshold) {
          const direction = deltaY > 0 ? 1 : -1;
          const newIndex = currentIndex + direction;
          
          if (newIndex >= 0 && newIndex < scenes.length) {
            e.preventDefault(); // 브라우저 기본 스크롤 동작 방지
            setCurrentScene(newIndex);
            lastScrollTime.current = now;
            touchStartY.current = currentY;
            touchStartX.current = currentX;
          }
        }
      }
    },
    end: () => {
      touchStartY.current = 0;
      touchStartX.current = 0;
      accumulatedDelta.current = 0;
      setTimeout(() => {
        setBlurred(false);
      }, 300);
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