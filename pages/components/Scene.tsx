// components/Scene.tsx
'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Altblock } from '../models/altblock';
import * as THREE from 'three';

// 조명과 모델이 함께 회전하는 컴포넌트
function RotatingGroup() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 조명도 그룹 안에 포함 */}
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

export default function Scene() {
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
        
          
          {/* 회전하는 그룹 (조명 + 모델) */}
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
          
          {/* 그림자를 받는 바닥면 */}
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