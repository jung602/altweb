import dynamic from 'next/dynamic';
import { Suspense, useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import type { ModelComponentType } from '../../types/scene';
import Label from '../ui/Label';
import { useSpring, animated } from '@react-spring/three';
import { Stats, useGLTF, PerspectiveCamera } from '@react-three/drei';
import { ModelLoader } from './ModelLoader';
import { debounce } from 'lodash';
import { GroupProps } from '@react-three/fiber';
import { CANVAS_CONFIG, ORBIT_CONTROLS_CONFIG, ANIMATION_CONFIG } from '../../config/sceneConfig';
import { SceneContent } from './SceneContent';
import { Canvas } from '@react-three/fiber';
import { Controls as SceneControls, ControlsRef } from './Controls';

const DynamicCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), {
  ssr: false
});

/**
 * Scene 컴포넌트의 props 인터페이스
 * @interface SceneProps
 */
interface SceneProps {
  /** 씬 설정 객체 */
  config: SceneConfig;
  /** 씬의 활성화 상태 */
  isActive: boolean;
  /** 씬의 너비 (선택적) */
  width?: number;
  /** 씬의 높이 (선택적) */
  height?: number;
}

/**
 * 3D 모델 props 인터페이스
 * @interface ModelProps
 */
interface ModelProps {
  /** 모델의 URL */
  url: string;
  [key: string]: any;
}

/**
 * 컨트롤 props 인터페이스
 * @interface ControlsProps
 */
interface ControlsProps {
  /** 확장 상태 여부 */
  isExpanded: boolean;
  /** 상호작용 중인지 여부 */
  isInteracting: boolean;
  /** 상호작용 시작 핸들러 */
  onStart: () => void;
  /** 상호작용 종료 핸들러 */
  onEnd: () => void;
}

// 모델 컴포넌트를 별도로 분리하여 메모이제이션
const Model = memo(({ component, ...props }: { component: ModelComponentType } & GroupProps) => {
  return <ModelLoader component={component} {...props} />;
}, (prevProps, nextProps) => prevProps.component === nextProps.component);

// OrbitControls를 별도 컴포넌트로 분리
const Controls = memo(({ isExpanded, isInteracting, onStart, onEnd }: ControlsProps) => {
  const { OrbitControls } = require('@react-three/drei');
  
  // OrbitControls 설정을 useMemo로 최적화
  const controlsConfig = useMemo(() => ({
    enabled: true,
    enableZoom: isExpanded,
    enablePan: false,
    enableRotate: true,
    autoRotate: !isInteracting && !isExpanded,
    autoRotateSpeed: ORBIT_CONTROLS_CONFIG.AUTO_ROTATE_SPEED,
    minPolarAngle: isExpanded ? 0 : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
    maxPolarAngle: isExpanded ? ORBIT_CONTROLS_CONFIG.MAX_POLAR_ANGLE : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
    minAzimuthAngle: ORBIT_CONTROLS_CONFIG.MIN_AZIMUTH_ANGLE,
    maxAzimuthAngle: ORBIT_CONTROLS_CONFIG.MAX_AZIMUTH_ANGLE,
    minZoom: ORBIT_CONTROLS_CONFIG.ZOOM_SCALE.MIN,
    maxZoom: ORBIT_CONTROLS_CONFIG.ZOOM_SCALE.MAX,
    touches: {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    }
  }), [isExpanded, isInteracting]);
  
  return <OrbitControls {...controlsConfig} onStart={onStart} onEnd={onEnd} />;
}, (prevProps, nextProps) => {
  return prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isInteracting === nextProps.isInteracting;
});

// Scene 컴포넌트도 메모이제이션
export const Scene = memo(({ config, isActive, width = 2000, height = 2000 }: SceneProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<ControlsRef>(null);
  
  // 기본 zoom 계산 함수
  const calculateZoom = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const baseWidth = 1920;
    const scale = viewportWidth / baseWidth;
    const zoom = Math.max(0.8, scale * 1.5);
    return zoom;
  }, []);

  // 초기 상태 설정
  const [cameraState, setCameraState] = useState(() => {
    const zoom = calculateZoom();
    const baseDistance = 29 / zoom;
    return { zoom, baseDistance };
  });

  // 카메라 상태 업데이트 함수
  const updateCameraState = useCallback(() => {
    const zoom = calculateZoom();
    const baseDistance = 29 / zoom;
    
    setCameraState({ zoom, baseDistance });

    // OrbitControls의 카메라 업데이트
    if (controlsRef.current?.object) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [calculateZoom]);

  // 리사이즈 핸들러
  const handleResize = useCallback(() => {
    updateCameraState();
  }, [updateCameraState]);

  // 초기 설정
  useEffect(() => {
    updateCameraState();
  }, [updateCameraState]);

  // 리사이즈 이벤트 리스너
  useEffect(() => {
    const debouncedResize = debounce(handleResize, 100);
    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      debouncedResize.cancel();
    };
  }, [handleResize]);

  const handleScroll = (e: WheelEvent) => {
    if (isExpanded && isHoveringCanvas) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (isExpanded) {
      window.addEventListener('wheel', handleScroll, { passive: false });
      return () => window.removeEventListener('wheel', handleScroll);
    }
  }, [isExpanded, handleScroll]);

  const handleInteraction = {
    pointerDown: (e: React.PointerEvent) => {
      isDragging.current = false;
      startPos.current = { x: e.clientX, y: e.clientY };
    },
    pointerMove: (e: React.PointerEvent) => {
      if (!startPos.current) return;
      const deltaX = Math.abs(e.clientX - startPos.current.x);
      const deltaY = Math.abs(e.clientY - startPos.current.y);
      if (deltaX > 5 || deltaY > 5) isDragging.current = true;
    },
    pointerUp: (e: React.PointerEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('[data-label]')) return;
      if (!isDragging.current && isActive) toggleExpanded();
      startPos.current = { x: 0, y: 0 };
    }
  };

  return (
    <div 
      ref={containerRef}
      className="scene-container w-full h-full transition-all duration-500 ease-out cursor-pointer overflow-visible"
      onPointerDown={handleInteraction.pointerDown}
      onPointerMove={handleInteraction.pointerMove}
      onPointerUp={handleInteraction.pointerUp}
    >
      <div 
        className="absolute w-dvw h-dvh left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        onMouseEnter={() => setIsHoveringCanvas(true)}
        onMouseLeave={() => setIsHoveringCanvas(false)}
      >
        <Canvas
          style={{ height: '100%', width: '100%' }}
          camera={{
            position: [
              5 * cameraState.baseDistance,
              6.5 * cameraState.baseDistance,
              -10 * cameraState.baseDistance
            ],
            fov: 1,
            near: 40,
            far: 1000,
            zoom: cameraState.zoom
          }}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
            outputColorSpace: THREE.LinearSRGBColorSpace,
          }}
          shadows
        >
          {process.env.NODE_ENV === 'development' && <Stats />}
          <Suspense fallback={null}>
            <SceneControls
              ref={controlsRef}
              isExpanded={isExpanded}
              isInteracting={isDragging.current}
              onStart={() => isDragging.current = true}
              onEnd={() => isDragging.current = false}
            />
            <SceneContent
              config={config}
              width={width}
              height={height}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.config === nextProps.config;
});