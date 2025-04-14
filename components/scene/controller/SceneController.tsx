import React, { useMemo, useRef } from 'react';
import { useSceneStore } from '../../../store/sceneStore';
import { useSceneScroll } from '../../../hooks/useSceneScroll';
import { getCameraConfig } from '../../../config/camera';
import { CANVAS_CONFIG } from '../../../config/scene';
import SceneCanvas from '../renderer/SceneCanvas';
import SceneGroup from '../renderer/SceneGroup';

/**
 * Scene 컨트롤러 컴포넌트
 * 상태 관리 및 Scene 렌더링 제어를 담당
 */
export const SceneController: React.FC = () => {
  const {
    containerRef,
    scenes,
    currentIndex,
    handleTouch
  } = useSceneScroll();

  const isExpanded = useSceneStore((state) => state.isExpanded);
  const isBlurred = useSceneStore((state) => state.isBlurred);
  
  const handleTouchEvents = useMemo(() => ({
    onTouchStart: handleTouch.start,
    onTouchMove: handleTouch.move,
    onTouchEnd: handleTouch.end
  }), [handleTouch]);

  // 확장 상태에 따라 적절한 카메라 설정을 가져옴
  const cameraConfig = getCameraConfig(isExpanded);
  const controlsRef = useRef(null);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0"
      {...handleTouchEvents}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="relative w-screen h-screen">
          <SceneCanvas 
            cameraConfig={cameraConfig}
            canvasConfig={CANVAS_CONFIG}
          >
            <SceneGroup
              scenes={scenes}
              currentIndex={currentIndex}
              isExpanded={isExpanded}
              controlsRef={controlsRef}
            />
          </SceneCanvas>
          
          {/* 블러 레이어 */}
          <div 
            className={`absolute inset-0 pointer-events-none backdrop-blur-sm transition-opacity duration-300 ${
              isBlurred ? 'opacity-100' : 'opacity-0'
            }`}
            id="blur-layer" 
          />
        </div>
      </div>
    </div>
  );
};

export default SceneController; 