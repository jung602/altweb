'use client';

import { useRef, useEffect, TouchEvent } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { Scene } from './Scene';
import { useInView } from 'react-intersection-observer';

export function SceneContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isTransitioning = useSceneStore((state) => state.isTransitioning);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const setTransitioning = useSceneStore((state) => state.setTransitioning);
  
  const lastInteractionTimeRef = useRef(0);
  const touchStartRef = useRef(0);
  const interactionCooldown = 500;
  const directionRef = useRef<'up' | 'down' | null>(null);

  const handleSceneChange = (direction: 'up' | 'down') => {
    const currentTime = performance.now();
    if (currentTime - lastInteractionTimeRef.current < interactionCooldown) return;
    
    lastInteractionTimeRef.current = currentTime;
    
    if (direction === 'down' && currentIndex < scenes.length - 1) {
      setCurrentScene(currentIndex + 1);
      directionRef.current = 'down';
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentScene(currentIndex - 1);
      directionRef.current = 'up';
    }

    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      directionRef.current = null;
    }, interactionCooldown);
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

  const handleTouchStart = (e: TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartRef.current === 0) return;
    
    const touchEnd = e.touches[0].clientY;
    const delta = touchStartRef.current - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(delta) > minSwipeDistance) {
      const direction = delta > 0 ? 'down' : 'up';
      handleSceneChange(direction);
      touchStartRef.current = 0;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = 0;
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {scenes.map((sceneConfig, index) => {
        const distance = index - currentIndex;
        const shouldRender = Math.abs(distance) <= 1;
        
        // 다음 씬이 현재 씬 위에 올라오도록 zIndex 조정
        const zIndex = distance === 1 ? 2 : 1;

        const getTransform = () => {
          // 현재 씬은 항상 제자리
          if (distance === 0) {
            return 'translateY(0%)';
          }
          
          // 다음 씬 (아래에서 위로 덮어씌우기)
          if (distance === 1) {
            return isTransitioning && directionRef.current === 'down'
              ? 'translateY(0%)'  // 덮어씌우는 중
              : 'translateY(100%)';  // 대기 위치 (아래)
          }
          
          // 이전 씬 (현재 씬이 아래로 빠지면서 드러나기)
          if (distance === -1) {
            return 'translateY(0%)';  // 항상 제자리
          }
          
          return 'translateY(100%)';
        };

        if (!shouldRender) return null;

        return (
          <div
            key={sceneConfig.id}
            className="absolute inset-0 w-full h-full"
            style={{
              zIndex,
              transform: getTransform(),
              transition: 'transform 500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
              willChange: 'transform',
            }}
          >
            <Scene 
              config={sceneConfig} 
              isActive={index === currentIndex || Math.abs(index - currentIndex) === 1} 
            />
          </div>
        );
      })}
    </div>
  );
}