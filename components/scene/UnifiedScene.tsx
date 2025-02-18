import React, { useCallback, useMemo, useEffect, useRef } from 'react';
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
import { Vector3 } from 'three';

interface UnifiedSceneProps {
  isVertical?: boolean;
}

const INITIAL_CAMERA_CONFIG = {
  position: [5 * 29, 6.5 * 29, -10 * 29] as [number, number, number],
  fov: 1,
  near: 60,
  far: 3000,
  zoom: 1
};

const EXPANDED_CAMERA_CONFIG = {
  ...INITIAL_CAMERA_CONFIG,
  position: [5 * 29, 6.5 * 29, -10 * 29] as [number, number, number],
};

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
  const isBlurred = useSceneStore((state) => state.isBlurred);

  const handleTouchEvents = useMemo(() => ({
    onTouchStart: handleTouch.start,
    onTouchMove: handleTouch.move,
    onTouchEnd: handleTouch.end
  }), [handleTouch]);

  const handleExpandToggle = useCallback(() => {
    toggleExpanded();
  }, [toggleExpanded]);

  const cameraConfig = isExpanded ? EXPANDED_CAMERA_CONFIG : INITIAL_CAMERA_CONFIG;
  const controlsRef = useRef(null);

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
                camera={cameraConfig}
                gl={CANVAS_CONFIG.gl}
                shadows
              >
                <Scene
                  config={scenes[currentIndex]}
                  controlsRef={controlsRef}
                />
              </Canvas>
              <div 
                className={`absolute inset-0 pointer-events-none backdrop-blur-sm transition-opacity duration-300 ${
                  isBlurred ? 'opacity-100' : 'opacity-0'
                }`}
                id="blur-layer" 
              />
            </div>
          </div>
        </div>
      </div>

      {isVertical ? <HorizontalTitles /> : <VerticalTitles />}
    </>
  );
}