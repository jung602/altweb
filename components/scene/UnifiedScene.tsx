import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { Scene } from './Scene';
import { VerticalTitles } from '../ui/Titles';
import { useSceneScroll } from '../../hooks/useSceneScroll';
import { useSceneStore } from '../../store/sceneStore';
import { X } from 'lucide-react';
import { LabelNavigation } from '../layout/LabelNav';
import { IndexView } from '../ui/IndexView';
import { Canvas } from '@react-three/fiber';
import Label from '../ui/Label';
import { CANVAS_CONFIG } from '../../config/sceneConfig';
import { getCameraConfig, setupRenderer } from '../../config/cameraConfig';

/**
 * 통합 씬 컴포넌트
 * 여러 3D 씬을 관리하고 표시하는 컴포넌트
 */
export default function UnifiedScene() {
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

  // 확장 상태에 따라 적절한 카메라 설정을 가져옴
  const cameraConfig = getCameraConfig(isExpanded);
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
                onCreated={({ gl }) => {
                  // 분리된 설정 함수 사용
                  setupRenderer(gl);
                }}
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

      <VerticalTitles />
    </>
  );
}