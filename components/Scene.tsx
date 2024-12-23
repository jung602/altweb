import dynamic from 'next/dynamic';
import { Suspense, useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import type { SceneConfig } from '../types/scene';
import { ModelComponents } from '../types/scene';
import Label from './Label';
import { useSpring, animated } from '@react-spring/three';
import { Stats, useGLTF } from '@react-three/drei';
import { ModelLoader } from './ModelLoader';
import { debounce } from 'lodash';

const DynamicCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), {
  ssr: false
});

interface SceneProps {
  config: SceneConfig;
  isActive: boolean;
  width?: number;
  height?: number;
}

interface ModelProps {
  url: string;
  [key: string]: any;
}

interface ControlsProps {
  isExpanded: boolean;
  isInteracting: boolean;
  zoom: number;
  onStart: () => void;
  onEnd: () => void;
}

// 모델 컴포넌트를 별도로 분리하여 메모이제이션
const Model = memo(({ url, ...props }: ModelProps) => {
  useGLTF.preload(url);
  return <ModelLoader url={url} {...props} />;
});

// OrbitControls를 별도 컴포넌트로 분리
const Controls = memo(({ isExpanded, isInteracting, zoom, onStart, onEnd }: ControlsProps) => {
  const { OrbitControls } = require('@react-three/drei');
  
  return (
    <OrbitControls 
      enabled={true}
      enableZoom={isExpanded}
      enablePan={false}
      enableRotate={true}
      autoRotate={!isInteracting && !isExpanded}
      autoRotateSpeed={0.1}
      minPolarAngle={isExpanded ? 0 : Math.PI / 3}
      maxPolarAngle={isExpanded ? Math.PI : Math.PI / 3}
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}
      minZoom={zoom * 0.7}
      maxZoom={zoom * 1.2}
      onStart={onStart}
      onEnd={onEnd}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_ROTATE
      }}
    />
  );
});

function SceneContent({ config, zoom }: { config: SceneConfig; zoom: number }) {
  const { OrthographicCamera } = require('@react-three/drei');
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const [isInteracting, setIsInteracting] = useState(false);
  const isMobileDevice = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // GLB 파일 경로 생성
  const modelPath = useMemo(() => {
    const modelName = config.model.component === 'Alt1' ? 'klar' : 'lees';
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

  // 디바운스된 호버 핸들러
  const debouncedHoverHandler = useCallback(
    debounce((hovering: boolean) => {
      if (!isMobileDevice.current) {
        setModelHovered(hovering && isExpanded);
      }
    }, 100),
    [isExpanded, setModelHovered]
  );

  const handleInteractionStart = useCallback(() => setIsInteracting(true), []);
  const handleInteractionEnd = useCallback(() => setIsInteracting(false), []);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={config.camera.position}
        zoom={zoom}
        near={0.1}
        far={1000}
      />
      
      <group>
        <animated.group 
          scale={scale}
          position={config.model.position}
          onPointerEnter={() => debouncedHoverHandler(true)}
          onPointerLeave={() => debouncedHoverHandler(false)}
        >
          <directionalLight
            position={config.lights.directional.position}
            intensity={config.lights.directional.intensity}
          />
          <Model url={modelPath} />
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
      
      <ambientLight intensity={0.5} />
    </>
  );
}

// Scene 컴포넌트도 메모이제이션
export const Scene = memo(({ config, isActive, width = 2000, height = 2000 }: SceneProps) => {
  const [zoom, setZoom] = useState(config.camera.fov);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  // 디바운스된 리사이즈 핸들러
  const handleResize = useCallback(
    debounce(() => {
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

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel(); // 디바운스 핸들러 취소
    };
  }, [handleResize]);

  useEffect(() => {
    if (isExpanded) {
      window.addEventListener('wheel', handleScroll, { passive: false });
      return () => window.removeEventListener('wheel', handleScroll);
    }
  }, [isExpanded, handleScroll]);

  const handleInteraction = {
    pointerDown: useCallback((e: React.PointerEvent) => {
      isDragging.current = false;
      startPos.current = { x: e.clientX, y: e.clientY };
    }, []),
    pointerMove: useCallback((e: React.PointerEvent) => {
      if (!startPos.current) return;
      const deltaX = Math.abs(e.clientX - startPos.current.x);
      const deltaY = Math.abs(e.clientY - startPos.current.y);
      if (deltaX > 5 || deltaY > 5) isDragging.current = true;
    }, []),
    pointerUp: useCallback((e: React.PointerEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('[data-label]')) return;
      if (!isDragging.current && isActive) toggleExpanded();
      startPos.current = { x: 0, y: 0 };
    }, [isActive, toggleExpanded])
  };

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
        <DynamicCanvas
          flat
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          dpr={[1, 2]} // 디바이스 픽셀 비율 최적화
        >
          {process.env.NODE_ENV === 'development' && <Stats />}
          <Suspense fallback={null}>
            <SceneContent config={config} zoom={zoom} />
          </Suspense>
        </DynamicCanvas>
      </div>
    </div>
  );
});