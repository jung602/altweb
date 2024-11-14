// components/Scene.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense, useRef } from 'react';
import type { GroupProps } from '@react-three/fiber';
import type * as THREE from 'three';
import type { RootState } from '@react-three/fiber';
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
}

function RotatingGroup({ config, ...props }: GroupProps & { config: SceneConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const useFrame = require('@react-three/fiber').useFrame;
  useFrame((_: RootState, delta: number) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const ModelComponent = ModelComponents[config.model.component];

  return (
    <group 
      ref={groupRef} 
      scale={config.model.scale} 
      position={config.model.position as [number, number, number]}
      {...props}
    >
      <directionalLight
        position={config.lights.directional.position}
        intensity={config.lights.directional.intensity}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ModelComponent />
    </group>
  );
}

export function Scene({ config, isActive }: SceneProps) {
  if (!isActive) return null;

  return (
    <div className="w-full h-full">
      <DynamicCanvas
        flat
        shadows
        dpr={[1, 2]}
        camera={{
          position: config.camera.position,
          fov: config.camera.fov,
          near: 0.1,
          far: 1000
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
          <color attach="background" args={[config.background.color]} />
          {config.environment.preset !== 'none' && (
            <DynamicEnvironment preset={config.environment.preset} />
          )}
        </Suspense>
      </DynamicCanvas>
    </div>
  );
}