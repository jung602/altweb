import React from 'react';
import { Scene } from './Scene';
import { HorizontalTitles, VerticalTitles } from './Titles';
import { useSceneScroll } from '../hooks/useSceneScroll';
import { useSceneStore } from '../store/sceneStore';
import { X } from 'lucide-react';

interface UnifiedSceneProps {
  isVertical?: boolean;
}

export default function UnifiedScene({ isVertical = true }: UnifiedSceneProps) {
  const {
    containerRef,
    scenes,
    currentIndex,
    baseSize,
    dimensions,
    isInitialized,
    handleTouch
  } = useSceneScroll();

  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);

  const gap = React.useMemo(() => {
    if (isVertical) return 50;
    return dimensions.width < 768 ? 150 : 50;
  }, [dimensions?.width, isVertical]);

  return (
    <>
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
            className="fixed top-4 right-4 z-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white hover:text-white/70" />
          </button>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative flex items-center justify-center"
            style={{
              [isVertical ? 'width' : 'height']: `${baseSize}px`,
              [isVertical ? 'height' : 'width']: '100%'
            }}
          >
            {scenes.map((scene, index) => {
              const distance = index - currentIndex;
              const shouldRender = Math.abs(distance) <= 1;
              
              if (!shouldRender) return null;

              const offset = distance * gap;
              const isCenter = distance === 0;
              const zIndex = isCenter ? 12 : 11;

              return (
                <div
                  key={scene.id}
                  className="absolute top-1/2 left-1/2 transform-gpu"
                  style={{
                    width: `${baseSize}px`,
                    height: `${baseSize}px`,
                    transform: `translate(-50%, -50%) ${isVertical ? `translateY(${offset}vh)` : `translateX(${offset}vw)`}`,
                    transformOrigin: 'center center',
                    transition: isInitialized ? 'all 800ms cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
                    willChange: 'transform',
                    zIndex,
                    opacity: isExpanded && !isCenter ? 0 : 1,
                    visibility: isExpanded && !isCenter ? 'hidden' : 'visible'
                  }}
                >
                  <div 
                    className="absolute inset-0 z-[15] bg-black/80 backdrop-blur-md"
                    style={{
                      opacity: isCenter ? 0 : Math.abs(distance) * 0.8,
                      [isVertical ? 'height' : 'width']: isCenter ? 0 : '100%',
                      transition: isInitialized 
                        ? 'opacity 800ms cubic-bezier(0.4, 0.0, 0.2, 1), width 0ms linear 0ms'
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
      </div>

      {isVertical ? <HorizontalTitles /> : <VerticalTitles />}
    </>
  );
}