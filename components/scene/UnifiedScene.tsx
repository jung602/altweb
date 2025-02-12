import React, { useCallback, useMemo } from 'react';
import { Scene } from './Scene';
import { HorizontalTitles, VerticalTitles } from '../ui/Titles';
import { useSceneScroll } from '../../hooks/useSceneScroll';
import { useSceneStore } from '../../store/sceneStore';
import { X } from 'lucide-react';
import { LabelNavigation } from '../layout/LabelNav';
import { IndexView } from '../ui/IndexView';
import { Canvas } from '@react-three/fiber';
import Label from '../ui/Label';
import { CANVAS_CONFIG } from '../../config/sceneConfig';

interface UnifiedSceneProps {
  isVertical?: boolean;
}

export default function UnifiedScene({ isVertical = true }: UnifiedSceneProps) {
  const {
    containerRef,
    scenes,
    currentIndex,
    handleTouch
  } = useSceneScroll();

  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isIndexView = useSceneStore((state) => state.isIndexView);

  const handleTouchEvents = useMemo(() => ({
    onTouchStart: handleTouch.start,
    onTouchMove: handleTouch.move,
    onTouchEnd: handleTouch.end
  }), [handleTouch]);

  const handleExpandToggle = useCallback(() => {
    toggleExpanded();
  }, [toggleExpanded]);

  if (isIndexView) {
    return <IndexView />;
  }

  return (
    <>
      <div 
        ref={containerRef} 
        className="fixed inset-0 overflow-hidden"
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
          <div className="relative w-screen h-screen">
            <div className="absolute inset-0">
              <Canvas
                style={{ width: '100%', height: '100%' }}
                camera={{
                  position: [5 * 29, 6.5 * 29, -10 * 29],
                  fov: 1,
                  near: 40,
                  far: 1000,
                  zoom: 1
                }}
                gl={CANVAS_CONFIG.gl}
                shadows
              >
                <Scene
                  config={scenes[currentIndex]}
                />
              </Canvas>
            </div>
            <div className="absolute inset-0 pointer-events-none">
              {scenes[currentIndex].labels?.map((label, index) => (
                <Label
                  key={`${scenes[currentIndex].id}-label-${index}`}
                  title={label.title}
                  content={label.content}
                  position={label.position}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {isVertical ? <HorizontalTitles /> : <VerticalTitles />}
    </>
  );
}