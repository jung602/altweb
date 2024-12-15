import React from 'react';
import { Scene } from './Scene';
import { HorizontalTitles } from './Titles';
import { useSceneScroll } from '../hooks/useSceneScroll';
import { useSceneStore } from '../store/sceneStore';
import { X } from 'lucide-react';

export default function VerticalSceneScroll() {
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isExpanded = useSceneStore((state) => state.isExpanded);

  const {
    containerRef,
    scenes,
    currentIndex,
    baseSize,
    isInitialized,
    handleTouch
  } = useSceneScroll();

  const verticalGap = 50;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 overflow-hidden"
      onTouchStart={handleTouch.start}
      onTouchMove={handleTouch.move}
      onTouchEnd={handleTouch.end}
    >
      {isExpanded && (
        <button
          onClick={toggleExpanded}
          className="fixed top-6 right-6 z-50 p-2 rounded-full bg-white/10 
            hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      )}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div 
          className="relative h-full flex items-center justify-center"
          style={{ width: `${baseSize}px` }}
        >
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            const shouldRender = Math.abs(distance) <= 1;
            const isCenter = distance === 0;
            
            if (!shouldRender) return null;

            const yOffset = distance * verticalGap;
            const zIndex = isCenter ? 12 : 11;

            return (
              <div
                key={scene.id}
                className="absolute top-1/2 left-1/2 transform-gpu"
                style={{
                  width: `${baseSize}px`,
                  height: `${baseSize}px`,
                  transform: `translate(-50%, -50%) translateY(${yOffset}vh)`,
                  transformOrigin: 'center center',
                  transition: isInitialized ? 'all 800ms cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
                  willChange: 'transform',
                  zIndex,
                  opacity: isExpanded && !isCenter ? 0 : 1,
                  visibility: isExpanded && !isCenter ? 'hidden' : 'visible'
                }}
              >
                <div 
                  className="absolute inset-0 z-[15] bg-black/70 backdrop-blur-md"
                  style={{
                    opacity: isCenter ? 0 : Math.abs(distance) * 0.8,
                    height: isCenter ? 0 : '100%',
                    transition: isInitialized 
                      ? `opacity 800ms cubic-bezier(0.4, 0.0, 0.2, 1)${isCenter ? ', height 0ms linear 800ms' : ''}`
                      : 'none',
                    pointerEvents: isCenter ? 'none' : 'auto'
                  }}
                />
                
                <div className="w-full h-full flex items-center justify-center">
                  <Scene 
                    config={scene} 
                    isActive={true}
                    width={baseSize}
                    height={baseSize}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-20">
        <HorizontalTitles />
      </div>
    </div>
  );
}