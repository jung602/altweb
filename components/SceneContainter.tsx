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
  const isExpanded = useSceneStore((state) => state.isExpanded)
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded)
  
  const lastInteractionTimeRef = useRef(0);
  const touchStartRef = useRef(0);
  const interactionCooldown = 500;
  const directionRef = useRef<'up' | 'down' | null>(null);
  
  const getTransform = (distance: number) => {
    if (distance === 0) return 'translateY(0%)';
    if (distance === 1) return 'translateY(100%)';
    if (distance === -1) return 'translateY(-100%)';
    return 'translateY(100%)';
  };

  // ... (rest of the handlers remain the same)

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
          const distance = index - currentIndex
          const shouldRender = Math.abs(distance) <= 1
          
          if (!shouldRender) return null

          return (
            <div
              key={scene.id}
              className="absolute inset-0 w-full h-full transition-all duration-500"
              style={{
                opacity: isExpanded && distance !== 0 ? 0 : 1,
                transform: `${getTransform(distance)} ${isExpanded ? 'scale(1.3)' : 'scale(1)'}`,
                zIndex: distance === 0 ? 2 : 1,
                pointerEvents: isExpanded && distance !== 0 ? 'none' : 'auto'
              }}
            >
              <Scene config={scene} isActive={index === currentIndex} />
            </div>
          )
        })}

        {isExpanded && (
          <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md
            transform transition-transform duration-500 translate-y-0">
            <div className="max-w-4xl mx-auto py-8 px-4">
              <h2 className="text-2xl text-white mb-4">{scenes[currentIndex].title}</h2>
              <p className="text-gray-300">설명 텍스트가 여기에 들어갑니다.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}