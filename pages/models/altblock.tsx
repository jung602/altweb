// models/altblock.tsx
import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'
import dynamic from 'next/dynamic'

type GLTFResult = GLTF & {
  nodes: {
    Cube_Baked: THREE.Mesh
  }
  materials: {
    ['Cube_Baked.001']: THREE.MeshStandardMaterial
  }
}

// 동적으로 로드될 컴포넌트 생성
const AltblockComponent = (props: GroupProps) => {
  const { useGLTF } = require('@react-three/drei')
  const { nodes, materials } = useGLTF('./gltf/altblock.glb') as GLTFResult
  
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

// SSR을 비활성화하고 동적 임포트 설정
const Altblock = dynamic(
  () => Promise.resolve(AltblockComponent),
  {
    ssr: false,
  }
)

// 컴포넌트 내보내기
export { Altblock }

// 모델 프리로드 (브라우저 환경에서만 실행)
if (typeof window !== 'undefined') {
  const { useGLTF } = require('@react-three/drei')
  useGLTF.preload('./gltf/altblock.glb')
}