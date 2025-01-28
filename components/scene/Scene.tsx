import dynamic from 'next/dynamic';
import { Suspense, useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import type { ModelComponentType } from '../../types/scene';
import Label from '../ui/Label';
import { useSpring, animated } from '@react-spring/three';
import { Stats, useGLTF } from '@react-three/drei';
import { ModelLoader } from './ModelLoader';
import { debounce } from 'lodash';

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
  /** 줌 레벨 */
  zoom: number;
  /** 상호작용 시작 핸들러 */
  onStart: () => void;
  /** 상호작용 종료 핸들러 */
  onEnd: () => void;
}

// 모델 컴포넌트를 별도로 분리하여 메모이제이션
const Model = memo(({ url, component, ...props }: ModelProps & { component: ModelComponentType }) => {
  useGLTF.preload(url);
  return <ModelLoader url={url} component={component} {...props} />;
}, (prevProps, nextProps) => prevProps.url === nextProps.url && prevProps.component === nextProps.component);

// OrbitControls를 별도 컴포넌트로 분리
const Controls = memo(({ isExpanded, isInteracting, zoom, onStart, onEnd }: ControlsProps) => {
  const { OrbitControls } = require('@react-three/drei');
  
  // OrbitControls 설정을 useMemo로 최적화
  const controlsConfig = useMemo(() => ({
    enabled: true,
    enableZoom: isExpanded,
    enablePan: false,
    enableRotate: true,
    autoRotate: !isInteracting && !isExpanded,
    autoRotateSpeed: 0.1,
    minPolarAngle: isExpanded ? 0 : Math.PI / 3,
    maxPolarAngle: isExpanded ? Math.PI : Math.PI / 3,
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    minZoom: zoom * 0.7,
    maxZoom: zoom * 1.2,
    touches: {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    }
  }), [isExpanded, isInteracting, zoom]);
  
  return <OrbitControls {...controlsConfig} onStart={onStart} onEnd={onEnd} />;
}, (prevProps, nextProps) => {
  return prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isInteracting === nextProps.isInteracting &&
    prevProps.zoom === nextProps.zoom;
});

// SceneContent를 메모이제이션
const SceneContent = memo(({ config, zoom }: { config: SceneConfig; zoom: number }) => {
  const { OrthographicCamera } = require('@react-three/drei');
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const [isInteracting, setIsInteracting] = useState(false);
  const isMobileDevice = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // GLB 파일 경로 생성
  const modelPath = useMemo(() => {
    const modelName = config.model.component.toLowerCase();
    return `${basePath}/gltf/${modelName}.glb`;
  }, [basePath, config.model.component]);

  const { scale } = useSpring({
    scale: config.model.scale * (isExpanded ? 1.1 : 1),
    config: {
      mass: 1,
      tension: 280,
      friction: 120
    }
  });

  // 디바운스된 호버 핸들러를 useCallback과 함께 메모이제이션
  const debouncedHoverHandler = useMemo(
    () => debounce((hovering: boolean) => {
      if (!isMobileDevice.current) {
        setModelHovered(hovering && isExpanded);
      }
    }, 100),
    [isExpanded, setModelHovered]
  );

  // 클린업 함수 추가
  useEffect(() => {
    return () => {
      debouncedHoverHandler.cancel();
    };
  }, [debouncedHoverHandler]);

  const handleInteractionStart = useCallback(() => setIsInteracting(true), []);
  const handleInteractionEnd = useCallback(() => setIsInteracting(false), []);

  // 카메라 설정을 메모이제이션
  const cameraProps = useMemo(() => ({
    makeDefault: true,
    position: config.camera.position,
    zoom,
    near: 0.1,
    far: 1000
  }), [config.camera.position, zoom]);

  // 라이트 설정을 메모이제이션
  const lightProps = useMemo(() => ({
    position: config.lights.directional.position,
    intensity: config.lights.directional.intensity
  }), [config.lights.directional]);

  return (
    <>
      <OrthographicCamera {...cameraProps} />
      
      <group>
        <animated.group 
          scale={scale}
          position={config.model.position}
          onPointerEnter={() => debouncedHoverHandler(true)}
          onPointerLeave={() => debouncedHoverHandler(false)}
        >
          <directionalLight {...lightProps} />
          <ModelLoader component={config.model.component} />
          {isExpanded && config.labels?.map((label, index) => (
            <Label key={index} {...label} />
          ))}
        </animated.group>
      </group>

      <Controls 
        isExpanded={isExpanded}
        isInteracting={isInteracting}
        zoom={zoom}
        onStart={handleInteractionStart}
        onEnd={handleInteractionEnd}
      />
    </>
  );
});

// Scene 컴포넌트도 메모이제이션
export const Scene = memo(({ config, isActive, width = 2000, height = 2000 }: SceneProps) => {
  const [zoom, setZoom] = useState(config.camera.fov);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  // 디바운스된 리사이즈 핸들러를 useMemo로 최적화
  const handleResize = useMemo(
    () => debounce(() => {
      const baseZoom = config.camera.fov;
      const scaleFactor = Math.min(width, height) / 1000;
      setZoom(baseZoom * scaleFactor * (isExpanded ? 1.15 : 1));
    }, 100),
    [config.camera.fov, width, height, isExpanded]
  );

  const handleScroll = useCallback((e: WheelEvent) => {
    if (isExpanded && isHoveringCanvas) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isExpanded, isHoveringCanvas]);

  // 클린업 함수에 handleResize.cancel 추가
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [handleResize]);

  useEffect(() => {
    if (isExpanded) {
      window.addEventListener('wheel', handleScroll, { passive: false });
      return () => window.removeEventListener('wheel', handleScroll);
    }
  }, [isExpanded, handleScroll]);

  // 상호작용 핸들러를 useMemo로 최적화
  const handleInteraction = useMemo(() => ({
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
  }), [isActive, toggleExpanded]);

  // Canvas 설정을 메모이제이션
  const canvasConfig = useMemo(() => ({
    flat: true,
    gl: {
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
      powerPreference: "high-performance",
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.2,
    },
    dpr: [1, 2] as [number, number]
  }), []);

  return (
    <div 
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
        <DynamicCanvas {...canvasConfig}>
          {process.env.NODE_ENV === 'development' && <Stats />}
          <Suspense fallback={null}>
            <SceneContent config={config} zoom={zoom} />
          </Suspense>
        </DynamicCanvas>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.config === nextProps.config;
});