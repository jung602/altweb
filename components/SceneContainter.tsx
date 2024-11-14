'use client';

import { useRef, useEffect } from 'react';
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
  
  const lastScrollTimeRef = useRef(0);
  const scrollCooldown = 500;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const currentTime = performance.now();
      if (currentTime - lastScrollTimeRef.current < scrollCooldown) return;

      const delta = e.deltaY;
      if (Math.abs(delta) > 30) {
        lastScrollTimeRef.current = currentTime;
        
        if (delta > 0 && currentIndex < scenes.length - 1) {
          setCurrentScene(currentIndex + 1);
        } else if (delta < 0 && currentIndex > 0) {
          setCurrentScene(currentIndex - 1);
        }

        setTransitioning(true);
        setTimeout(() => {
          setTransitioning(false);
        }, scrollCooldown);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [currentIndex, scenes.length, setCurrentScene, setTransitioning]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen overflow-hidden relative"
    >
      {scenes.map((sceneConfig, index) => {
        const [ref] = useInView({
          threshold: 0,
          rootMargin: '100% 0px',
          triggerOnce: true
        });

        // 현재 인덱스와의 거리 계산
        const distance = index - currentIndex;
        const shouldRender = Math.abs(distance) <= 1;
        
        // z-index 계산: 현재 보이는 씬이 항상 위에 오도록
        const zIndex = distance === 0 ? 2 : 
                      distance === 1 ? 1 : 
                      distance === -1 ? 1 : 0;

        return (
          <div
            key={sceneConfig.id}
            ref={ref}
            className="absolute inset-0 w-full h-full"
            style={{
              zIndex,
              transform: `translateY(${distance > 0 ? 100 : 0}%)`,
              transition: 'transform 500ms ease-out',
              willChange: 'transform',
              visibility: shouldRender ? 'visible' : 'hidden'
            }}
          >
            {shouldRender && (
              <div 
                className="w-full h-full"
                style={{
                  transform: `translateY(${
                    distance === 0 ? '0%' :
                    distance === 1 ? `${-100 + (isTransitioning ? 100 : 0)}%` :
                    distance === -1 ? `${100 + (isTransitioning ? -100 : 0)}%` : '0%'
                  })`,
                  transition: 'transform 500ms ease-out',
                  willChange: 'transform'
                }}
              >
                <Scene 
                  config={sceneConfig} 
                  isActive={index === currentIndex || Math.abs(index - currentIndex) === 1} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}