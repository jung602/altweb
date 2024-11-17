// components/Scene.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useRef, useEffect } from 'react';
import type { GroupProps } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneConfig } from '../types/scene';
import { ModelComponents } from '../types/scene';

const DynamicCanvas = dynamic(() => import('@react-three/fiber').then(mod => mod.Canvas), {
  ssr: false
});
const DynamicOrbitControls = dynamic(() => import('@react-three/drei').then(mod => mod.OrbitControls), {
  ssr: false
});
const DynamicPerspectiveCamera = dynamic(() => import('@react-three/drei').then(mod => mod.PerspectiveCamera), {
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

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, [width, height]);

  if (!isActive) return null;

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
    >
      <DynamicCanvas
        ref={canvasRef}
        flat
        shadows
        style={{
          width: `${width}px`,
          height: `${height}px`
        }}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          alpha: true,
          stencil: true,
          depth: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace
        }}
        camera={{
          position: config.camera.position,
          fov: config.camera.fov,
          near: 0.1,
          far: 1000
        }}
        onCreated={({ gl }) => {
          gl.setSize(width, height);
          gl.setPixelRatio(window.devicePixelRatio || 1);
        }}
      >
        <Suspense fallback={null}>
          <DynamicPerspectiveCamera
            makeDefault
            position={config.camera.position}
            fov={config.camera.fov}
          />
          
          <group position={[0, 0, 0]}>
            <RotatingGroup config={config} />
          </group>
          
          <DynamicOrbitControls 
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={1}
            minDistance={5}
            maxDistance={20}
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 1.5}
          />
          
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={config.shadowPlane.position} 
            receiveShadow
          >
            <planeGeometry args={[30, 30]} />
            <shadowMaterial transparent opacity={config.shadowPlane.opacity} />
          </mesh>
          
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