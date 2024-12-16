import dynamic from 'next/dynamic';
import { Suspense, useRef, useEffect, useState } from 'react';
import type { GroupProps } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import type { SceneConfig } from '../types/scene';
import { ModelComponents } from '../types/scene';

const DynamicCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), {
  ssr: false
});
const DynamicOrbitControls = dynamic(() => import('@react-three/drei').then(mod => mod.OrbitControls), {
  ssr: false
});
const DynamicOrthographicCamera = dynamic(() => import('@react-three/drei').then(mod => mod.OrthographicCamera), {
  ssr: false
});
const DynamicEnvironment = dynamic(() => import('@react-three/drei').then(mod => mod.Environment), {
  ssr: false
});

interface SceneProps {
  config: SceneConfig;
  isActive: boolean;
  width?: number;
  height?: number;
}

function RotatingGroup({ config, ...props }: GroupProps & { config: SceneConfig }) {
  const ModelComponent = ModelComponents[config.model.component];
  return (
    <group 
      scale={config.model.scale} 
      position={config.model.position as [number, number, number]}
      {...props}
    >
      <directionalLight
        position={config.lights.directional.position}
        intensity={config.lights.directional.intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <ModelComponent />
    </group>
  );
}

export function Scene({ config, isActive, width = 2000, height = 2000 }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(config.camera.fov);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);

  useEffect(() => {
    const handleResize = () => {
      const baseZoom = config.camera.fov;
      const scaleFactor = Math.min(width, height) / 1000;
      setZoom(baseZoom * scaleFactor * (isExpanded ? 1.2 : 1));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.camera.fov, width, height, isExpanded]);
  
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPos.current) return;
    
    const deltaX = Math.abs(e.clientX - startPos.current.x);
    const deltaY = Math.abs(e.clientY - startPos.current.y);
    
    if (deltaX > 5 || deltaY > 5) {
      isDragging.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current && isActive) {
      toggleExpanded();
    }
    startPos.current = { x: 0, y: 0 };
  };

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full transition-all duration-500 ease-out cursor-pointer
        ${isExpanded ? 'scale-110' : 'scale-100'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <DynamicCanvas
        ref={canvasRef}
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
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <DynamicOrthographicCamera
            makeDefault
            position={config.camera.position}
            zoom={zoom}
            near={0.1}
            far={1000}
          />
          
          <group position={[0, 0, 0]}>
            <RotatingGroup config={config} />
          </group>
          
          <DynamicOrbitControls 
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.3}
            minPolarAngle={isExpanded ? 0 : Math.PI / 3}
            maxPolarAngle={isExpanded ? Math.PI : Math.PI / 3}
            minAzimuthAngle={-Infinity}
            maxAzimuthAngle={Infinity}
          />
          
          <ambientLight intensity={0.5} />
          {config.environment.preset !== 'none' && (
            <DynamicEnvironment 
              preset={config.environment.preset} 
              background 
              blur={0.5}
              resolution={1024}
            />
          )}
        </Suspense>
      </DynamicCanvas>
    </div>
  );
}