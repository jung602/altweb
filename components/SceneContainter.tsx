'use client';

import { useRef, useEffect, TouchEvent } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { Scene } from './Scene';
import { ArrowLeft } from 'lucide-react';

export function SceneContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scenes = useSceneStore((state) => state.scenes);
  const currentIndex = useSceneStore((state) => state.currentIndex);
  const isTransitioning = useSceneStore((state) => state.isTransitioning);
  const setCurrentScene = useSceneStore((state) => state.setCurrentScene);
  const setTransitioning = useSceneStore((state) => state.setTransitioning);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  
  const lastInteractionTimeRef = useRef(0);
  const touchStartRef = useRef(0);
  const interactionCooldown = 500;
  const directionRef = useRef<'up' | 'down' | null>(null);
  
  const handleWheel = (e: WheelEvent) => {
    if (isExpanded || isTransitioning) return;
    
    const now = Date.now();
    if (now - lastInteractionTimeRef.current < interactionCooldown) return;
    
    const direction = e.deltaY > 0 ? 'down' : 'up';
    if (direction !== directionRef.current) {
      directionRef.current = direction;
      return;
    }
    
    lastInteractionTimeRef.current = now;
    
    setTransitioning(true);
    const nextIndex = direction === 'down' 
      ? (currentIndex + 1) % scenes.length
      : (currentIndex - 1 + scenes.length) % scenes.length;
    
    setCurrentScene(nextIndex);
    setTimeout(() => setTransitioning(false), 800);
  };
  
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [currentIndex, isTransitioning, isExpanded]);

  const getTransform = (distance: number) => {
    if (distance === 0) return 'translateY(0%)';
    if (distance === 1) return 'translateY(100%)';
    if (distance === -1) return 'translateY(-100%)';
    return 'translateY(100%)';
  };

  return (
    <>
      {isExpanded && (
        <button
          onClick={() => toggleExpanded()}
          className="fixed top-5 left-5 z-50 bg-white/10 backdrop-blur-md rounded-full p-2
            hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
      )}
      
      <div className="w-full h-screen overflow-hidden relative">
        {scenes.map((scene, index) => {
          const distance = index - currentIndex;
          const shouldRender = Math.abs(distance) <= 1;
          
          if (!shouldRender) return null;

          return (
            <div
              key={scene.id}
              className="absolute inset-0 w-full h-full transition-all duration-500"
              style={{
                opacity: isExpanded && distance !== 0 ? 0 : 1,
                transform: `${getTransform(distance)} ${isExpanded ? 'scale(1.2)' : 'scale(1)'}`,
                zIndex: distance === 0 ? 2 : 1,
                pointerEvents: isExpanded && distance !== 0 ? 'none' : 'auto',
                height: isExpanded ? 'auto' : '100%'
              }}
            >
              <Scene config={scene} isActive={index === currentIndex} />
            </div>
          );
        })}
      </div>
    </>
  );
}