// components/HorizontalSceneScroll.tsx
'use client';

import React, { useMemo } from 'react';
import { Scene } from './Scene';
import { VerticalTitles } from './Titles';
import { useSceneScroll } from '../hooks/useSceneScroll';

export default function HorizontalSceneScroll() {
  const {
    containerRef,
    scenes,
    currentIndex,
    baseSize,
    dimensions,
    isInitialized,
    handleTouch
  } = useSceneScroll();

  const horizontalGap = useMemo(() => {
    return dimensions.width < 768 ? 150 : 50;
  }, [dimensions.width]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 overflow-hidden"
      onTouchStart={handleTouch.start}
      onTouchMove={handleTouch.move}
      onTouchEnd={handleTouch.end}
    >
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div 
          className="relative w-full flex items-center justify-center"
          style={{ height: `${baseSize}px` }}
        >
          {scenes.map((scene, index) => {
            const distance = index - currentIndex;
            const shouldRender = Math.abs(distance) <= 1;
            
            if (!shouldRender) return null;

            const offset = distance * horizontalGap;
            const isCenter = distance === 0;
            const zIndex = isCenter ? 12 : 11;

            return (
              <div
                key={scene.id}
                className="absolute top-1/2 left-1/2 transform-gpu"
                style={{
                  width: `${baseSize}px`,
                  height: `${baseSize}px`,
                  transform: `translate(-50%, -50%) translateX(${offset}vw)`,
                  transformOrigin: 'center center',
                  transition: isInitialized ? 'transform 800ms ease' : 'none',
                  willChange: 'transform',
                  zIndex
                }}
              >
                <div 
                  className="absolute inset-0 z-[15] bg-black/70 backdrop-blur-md"
                  style={{
                    opacity: isCenter ? 0 : Math.abs(distance) * 0.8,
                    width: isCenter ? 0 : '100%',
                    transition: isInitialized 
                      ? 'opacity 800ms ease, width 0ms linear'
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
        <VerticalTitles />
      </div>
    </div>
  );
}