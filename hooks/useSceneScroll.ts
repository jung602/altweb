// hooks/useSceneScroll.ts
'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useSceneStore } from '../store/sceneStore';

type Direction = 'up' | 'down';

const INTERACTION_COOLDOWN = 800;
const MIN_SWIPE_DISTANCE = 50;

export const useSceneScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastInteractionTimeRef = useRef(0);
  const touchStartRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const setTransitioning = useSceneStore((state) => state.setTransitioning);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      setIsInitialized(false);
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsInitialized(true);
        });
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSceneChange = (direction: Direction) => {
    const currentTime = performance.now();
    if (currentTime - lastInteractionTimeRef.current < INTERACTION_COOLDOWN) return;
    
    lastInteractionTimeRef.current = currentTime;
    
    if (direction === 'down' && currentIndex < scenes.length - 1) {
      setCurrentScene(currentIndex + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentScene(currentIndex - 1);
    }

    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
    }, INTERACTION_COOLDOWN);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 30 ? 'down' : e.deltaY < -30 ? 'up' : null;
      if (direction) handleSceneChange(direction);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [currentIndex, scenes.length]);

  const baseSize = useMemo(() => {
    const minSize = 300;
    const maxSize = 600;
    const size = Math.min(dimensions.width * 0.8, dimensions.height * 0.8);
    return Math.max(minSize, Math.min(size, maxSize));
  }, [dimensions]);

  const handleTouch = {
    start: (e: React.TouchEvent) => {
      touchStartRef.current = e.touches[0].clientY;
    },
    move: (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = e.touches[0].clientY;
      const delta = touchStartRef.current - touchEnd;

      if (Math.abs(delta) > MIN_SWIPE_DISTANCE) {
        const direction = delta > 0 ? 'down' : 'up';
        handleSceneChange(direction);
        touchStartRef.current = 0;
      }
    },
    end: () => {
      touchStartRef.current = 0;
    }
  };

  return {
    containerRef,
    scenes,
    currentIndex,
    baseSize,
    dimensions,
    isInitialized,
    handleTouch
  };
};