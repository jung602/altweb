import { useCallback, useEffect, useRef, useState } from 'react';
import { useSceneStore } from '../store/sceneStore';

export const useSceneScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const isModelHovered = useSceneStore((state) => state.isModelHovered);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [baseSize, setBaseSize] = useState(2000);
  const [isInitialized, setIsInitialized] = useState(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

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

  const handleScroll = useCallback((e: WheelEvent) => {
    if (isModelHovered) {
      return;
    }
    
    e.preventDefault();
    const delta = e.deltaY;
    
    if (Math.abs(delta) > 0) {
      const direction = delta > 0 ? 1 : -1;
      const newIndex = currentIndex + direction;
      
      if (newIndex >= 0 && newIndex < scenes.length) {
        setCurrentScene(newIndex);
      }
    }
  }, [currentIndex, scenes.length, setCurrentScene, isModelHovered]);

  const handleTouch = {
    start: (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    },
    move: (e: React.TouchEvent) => {
      if (isModelHovered) {
        return;
      }
      
      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const deltaY = touchStartY.current - touchY;
      const deltaX = touchStartX.current - touchX;
      
      if (Math.abs(deltaY) > 50 || Math.abs(deltaX) > 50) {
        const direction = deltaY > 0 ? 1 : -1;
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < scenes.length) {
          setCurrentScene(newIndex);
        }
        
        touchStartY.current = touchY;
        touchStartX.current = touchX;
      }
    },
    end: () => {
      touchStartY.current = 0;
      touchStartX.current = 0;
    }
  };

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