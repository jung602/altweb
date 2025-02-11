import React, { useCallback, useMemo } from 'react';
import { Scene } from './Scene';
import { HorizontalTitles, VerticalTitles } from '../ui/Titles';
import { useSceneScroll } from '../../hooks/useSceneScroll';
import { useSceneStore } from '../../store/sceneStore';
import { X } from 'lucide-react';
import { LabelNavigation } from '../layout/LabelNav';
import { IndexView } from '../ui/IndexView';
import type { SceneConfig } from '../../types/scene';
import { SCENE_RENDER_CONFIG, ANIMATION_CONFIG } from '../../config/sceneConfig';

interface UnifiedSceneProps {
  isVertical?: boolean;
}

const SceneWrapper = React.memo(({ 
  scene, 
  scenes,
  index, 
  currentIndex, 
  baseSize, 
  gap, 
  isVertical, 
  isInitialized, 
  isExpanded 
}: {
  scene: SceneConfig;
  scenes: SceneConfig[];
  index: number;
  currentIndex: number;
  baseSize: number;
  gap: number;
  isVertical: boolean;
  isInitialized: boolean;
  isExpanded: boolean;
}) => {
  // 렌더링할 씬 결정
  const shouldRender = 
    index === currentIndex || // 현재 씬
    index === currentIndex + 1 || // 다음 씬
    (currentIndex > 0 && index === currentIndex - 1); // 이전 씬

  const distance = index - currentIndex;
  const isCenter = distance === 0;
  
  if (!shouldRender) return null;

  const offset = distance * gap;
  const zIndex = isCenter ? SCENE_RENDER_CONFIG.Z_INDEX.CENTER : SCENE_RENDER_CONFIG.Z_INDEX.SIDE;

  return (
    <div
      key={scene.id}
      className="absolute top-1/2 left-1/2 transform-gpu"
      style={{
        width: `${baseSize}px`,
        height: `${baseSize}px`,
        transform: `translate(-50%, -50%) ${isVertical ? `translateY(${offset}vh)` : `translateX(${offset}vw)`}`,
        transformOrigin: 'center center',
        transition: isInitialized ? `all ${ANIMATION_CONFIG.TRANSITION_DURATION}ms cubic-bezier(0.4, 0.0, 0.2, 1)` : 'none',
        willChange: 'transform',
        zIndex,
        opacity: isExpanded && !isCenter ? 0 : isCenter ? 1 : 0.2,
        visibility: isExpanded && !isCenter ? 'hidden' : 'visible'
      }}
    >
      <div 
        className="w-full h-full flex items-center justify-center"
      >
        <Scene 
          config={scene} 
          isActive={shouldRender}
          width={baseSize}
          height={baseSize}
          reflectorEnabled={isCenter}
        />
      </div>
    </div>
  );
});

SceneWrapper.displayName = 'SceneWrapper';

export default function UnifiedScene({ isVertical = true }: UnifiedSceneProps) {
  const {
    containerRef,
    scenes,
    currentIndex,
    dimensions,
    isInitialized,
    handleTouch
  } = useSceneScroll();

  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isIndexView = useSceneStore((state) => state.isIndexView);

  const baseSize = useMemo(() => {
    return dimensions.width < 768 
      ? Math.min(dimensions.width, dimensions.height) * 1.1
      : Math.min(dimensions.width, dimensions.height) * .95;
  }, [dimensions]);

  const gap = useMemo(() => {
    if (isVertical && dimensions.width < 600) return 35;
    if (isVertical && dimensions.width < 1080) return 55;
    if (isVertical) return 70;
    if (dimensions.width < 768) return 110;
    if (dimensions.width < 1080) return 70;
    return 55;
  }, [dimensions?.width, isVertical]);

  const handleTouchEvents = useMemo(() => ({
    onTouchStart: handleTouch.start,
    onTouchMove: handleTouch.move,
    onTouchEnd: handleTouch.end
  }), [handleTouch]);

  const handleExpandToggle = useCallback(() => {
    toggleExpanded();
  }, [toggleExpanded]);

  const handleScroll = useCallback((event: Event) => {
    const container = event.target as HTMLElement;
    if (container.scrollTop === 0) {
      container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  React.useEffect(() => {
    const current = containerRef.current;
    if (current) {
      current.addEventListener('scroll', handleScroll);
      current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      if (current) {
        current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [currentIndex, handleScroll, containerRef]);

  React.useEffect(() => {
    return () => {
      // Cleanup logic if needed
    };
  }, [scenes]);

  if (isIndexView) {
    return <IndexView />;
  }

  return (
    <>
      <div 
        ref={containerRef} 
        className={`fixed inset-0 overflow-hidden`}
        {...handleTouchEvents}
      >
        {isExpanded && (
          <>
            <button
              onClick={handleExpandToggle}
              className="fixed top-4 right-4 z-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white hover:text-white/70" />
            </button>
            <LabelNavigation />
          </>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative flex items-center justify-center"
            style={{
              [isVertical ? 'width' : 'height']: `${baseSize}px`,
              [isVertical ? 'height' : 'width']: '100%'
            }}
          >
            {scenes.map((scene, index) => (
              <SceneWrapper
                key={scene.id}
                scene={scene}
                scenes={scenes}
                index={index}
                currentIndex={currentIndex}
                baseSize={baseSize}
                gap={gap}
                isVertical={isVertical}
                isInitialized={isInitialized}
                isExpanded={isExpanded}
              />
            ))}
          </div>
        </div>
      </div>

      {isVertical ? <HorizontalTitles /> : <VerticalTitles />}
    </>
  );
}