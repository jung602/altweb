import dynamic from 'next/dynamic';
import { Suspense, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import type { SceneConfig } from '../types/scene';
import { ModelComponents } from '../types/scene';
import Label from './Label';
import { useSpring, animated } from '@react-spring/three';

const DynamicCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), {
  ssr: false
});

interface SceneProps {
  config: SceneConfig;
  isActive: boolean;
  width?: number;
  height?: number;
}


function SceneContent({ config, zoom }: { config: SceneConfig; zoom: number }) {
  const { OrbitControls, OrthographicCamera, Environment } = require('@react-three/drei');
  const ModelComponent = ModelComponents[config.model.component];
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isHoveringModel, setIsHoveringModel] = useState(false);
  const isMobileDevice = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  const { scale } = useSpring({
    scale: config.model.scale * (isExpanded ? 1.1 : 1),
    config: {
      mass: 1,
      tension: 280,
      friction: 120
    }
  });
  const handleModelHover = (hovering: boolean) => {
    if (!isMobileDevice.current) {
      setIsHoveringModel(hovering);
      setModelHovered(hovering && isExpanded);
    }
  };

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
          onPointerEnter={() => handleModelHover(true)}
          onPointerLeave={() => handleModelHover(false)}
        >
          <directionalLight
            position={config.lights.directional.position}
            intensity={config.lights.directional.intensity}
          />
          <ModelComponent />
          {isExpanded && config.labels?.map((label, index) => (
            <Label key={index} {...label} />
          ))}
        </animated.group>
      </group>

      <OrbitControls 
        enabled={true}
        enableZoom={isExpanded}
        enablePan={false}
        enableRotate={true}
        autoRotate={!isInteracting}
        autoRotateSpeed={0.1}
        minPolarAngle={isExpanded ? 0 : Math.PI / 3}
        maxPolarAngle={isExpanded ? Math.PI : Math.PI / 3}
        minAzimuthAngle={-Infinity}
        maxAzimuthAngle={Infinity}
        minZoom={zoom * 0.7}
        maxZoom={zoom * 1.2}
        onStart={() => setIsInteracting(true)}
        onEnd={() => setIsInteracting(false)}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_ROTATE
        }}
      />
      
      <ambientLight intensity={0.5} />
      {config.environment.preset !== 'none' && (
        <Environment 
          preset={config.environment.preset} 
          background 
          blur={0.5}
          resolution={1024}
        />
      )}
    </>
  );
}


export function Scene({ config, isActive, width = 2000, height = 2000 }: SceneProps) {
  const [zoom, setZoom] = useState(config.camera.fov);
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const baseZoom = config.camera.fov;
      const scaleFactor = Math.min(width, height) / 1000;
      setZoom(baseZoom * scaleFactor * (isExpanded ? 1.15 : 1));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.camera.fov, width, height, isExpanded]);

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
  }, [isExpanded, isHoveringCanvas]);

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
          shadows
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
        >
          <Suspense fallback={null}>
            <SceneContent config={config} zoom={zoom} />
          </Suspense>
        </DynamicCanvas>
      </div>
    </div>
  );
}