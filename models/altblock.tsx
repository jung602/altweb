// src/models/altblock.tsx
import dynamic from 'next/dynamic'
import React from 'react'
import { type GroupProps } from '@react-three/fiber'
import { type GLTF } from 'three-stdlib'
import type * as THREE from 'three'

type GLTFResult = GLTF & {
  nodes: {
    Cube_Baked: THREE.Mesh
  }
  materials: {
    ['Cube_Baked.001']: THREE.MeshStandardMaterial
  }
}

// 실제 컴포넌트 구현
const AltblockComponent = (props: GroupProps) => {
  const { useGLTF } = require('@react-three/drei')
  const { nodes, materials } = useGLTF('/gltf/altblock.glb') as GLTFResult
  
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        geometry={nodes.Cube_Baked.geometry}
        material={materials['Cube_Baked.001']}
      />
    </group>
  )
}

// 동적 임포트로 내보내기
export const Altblock = dynamic(
  () => Promise.resolve(AltblockComponent),
  {
    ssr: false
  }
)

// GLB 파일 프리로드 (클라이언트 사이드에서만)
if (typeof window !== 'undefined') {
  const { useGLTF } = require('@react-three/drei')
  useGLTF.preload('/gltf/altblock.glb')
}