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
  const isMobileDevice = useRef(true);

  const handleScroll = useCallback((e: WheelEvent) => {
    if (isMobileDevice.current || isExpanded || isModelHovered) return;
    
    e.preventDefault();
    const delta = e.deltaY;
    
    if (Math.abs(delta) > 0) {
      const direction = delta > 0 ? 1 : -1;
      const newIndex = currentIndex + direction;
      
      if (newIndex >= 0 && newIndex < scenes.length) {
        setCurrentScene(newIndex);
      }
    }
  }, [currentIndex, scenes.length, setCurrentScene, isModelHovered, isExpanded]);

  const handleTouch = {
    start: (e: React.TouchEvent) => {
      if (isExpanded) return;
      if (e.touches.length === 2) {
        touchStartY.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        touchStartX.current = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      }
    },
    move: (e: React.TouchEvent) => {
      if (isExpanded || e.touches.length !== 2) return;
      
      const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const deltaY = touchStartY.current - currentY;
      const deltaX = touchStartX.current - currentX;
      
      if (Math.abs(deltaY) > 80 || Math.abs(deltaX) > 80) {
        const direction = deltaY > 0 ? 1 : -1;
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < scenes.length) {
          setCurrentScene(newIndex);
        }
        
        touchStartY.current = currentY;
        touchStartX.current = currentX;
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