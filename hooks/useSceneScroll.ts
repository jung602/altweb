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
  const scrollThreshold = 500; // ms between scroll events

  const handleScroll = useCallback((e: WheelEvent) => {
    if (isExpanded || isModelHovered) return;
    
    e.preventDefault();
    const now = Date.now();
    
    // Throttle scroll events
    if (now - lastScrollTime.current < scrollThreshold) return;
    
    const delta = e.deltaY;
    if (Math.abs(delta) > 0) {
      const direction = delta > 0 ? 1 : -1;
      const newIndex = currentIndex + direction;
      
      if (newIndex >= 0 && newIndex < scenes.length) {
        setCurrentScene(newIndex);
        lastScrollTime.current = now;
      }
    }
  }, [currentIndex, scenes.length, setCurrentScene, isModelHovered, isExpanded]);

  const handleTouch = {
    start: (e: React.TouchEvent) => {
      if (isExpanded) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    },
    move: (e: React.TouchEvent) => {
      if (isExpanded) return;
      
      const now = Date.now();
      if (now - lastScrollTime.current < scrollThreshold) return;
      
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = touchStartY.current - currentY;
      const deltaX = touchStartX.current - currentX;
      
      const threshold = isMobileDevice.current ? 50 : 80;
      
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