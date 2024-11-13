// components/Scene.tsx
'use client';

import dynamic from 'next/dynamic';
import React, { Suspense, useRef } from 'react';
import { Canvas, type GroupProps } from '@react-three/fiber';
import type * as THREE from 'three';

// drei 컴포넌트들을 동적으로 임포트
const OrbitControls = dynamic(() => import('@react-three/drei').then(mod => mod.OrbitControls), { ssr: false });
const PerspectiveCamera = dynamic(() => import('@react-three/drei').then(mod => mod.PerspectiveCamera), { ssr: false });

// Altblock 컴포넌트를 동적으로 임포트
const Altblock = dynamic(() => import('../models/altblock').then(mod => mod.Altblock), { ssr: false });

// 조명과 모델이 함께 회전하는 컴포넌트
function RotatingGroup(props: GroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const useFrame = require('@react-three/fiber').useFrame;
  
  useFrame((state: any, delta: number) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} {...props}>
      <directionalLight
        position={[0, 10, 0]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Altblock />
    </group>
  );
}

// Scene 컴포넌트 내용
function SceneContent() {
  return (
    <div className="w-full h-full">
      <Canvas
        flat
        shadows
        dpr={[1, 2]}
        camera={{
          position: [0, 10, 10],
          fov: 30,
          near: 0.1,
          far: 1000
        }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[0, 6.5, 10]}
            fov={45}
          />
          
          <group position={[0, 0, 0]} scale={1}>
            <RotatingGroup />
          </group>
          
          <OrbitControls 
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={20}
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 1.5}
          />
          
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, -1.01, 0]} 
            receiveShadow
          >
            <planeGeometry args={[30, 30]} />
            <shadowMaterial transparent opacity={.7} />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}

// Scene 컴포넌트를 동적으로 내보내기
const Scene = dynamic(() => Promise.resolve(SceneContent), { ssr: false });
export default Scene;