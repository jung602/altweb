import dynamic from 'next/dynamic'
import React from 'react'
import { type GroupProps } from '@react-three/fiber'
import { type GLTF } from 'three-stdlib'
import type * as THREE from 'three'


type GLTFResult = GLTF & {
  nodes: {
    Plane001: THREE.Mesh
    Plane001_1: THREE.Mesh
    Plane001_2: THREE.Mesh
    Plane001_3: THREE.Mesh
    Plane001_4: THREE.Mesh
  }
  materials: {
    walls: THREE.MeshStandardMaterial
    blacks: THREE.MeshStandardMaterial
    metal2: THREE.MeshStandardMaterial
    metal: THREE.MeshPhysicalMaterial
    rooms: THREE.MeshStandardMaterial
  }
}

// 실제 컴포넌트 구현
const Alt2Component = (props: GroupProps) => {
  const { useGLTF } = require('@react-three/drei')
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const { nodes, materials } = useGLTF(`${basePath}/gltf/lees.glb`) as GLTFResult

  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Plane001.geometry} material={materials.walls} />
      <mesh geometry={nodes.Plane001_1.geometry} material={materials.blacks} />
      <mesh geometry={nodes.Plane001_2.geometry} material={materials.metal2} />
      <mesh geometry={nodes.Plane001_3.geometry} material={materials.metal} />
      <mesh geometry={nodes.Plane001_4.geometry} material={materials.rooms} />
    </group>
  )
}


// 동적 임포트로 내보내기
export const Alt2 = dynamic(
  () => Promise.resolve(Alt2Component),
  {
    ssr: false
  }
)

// GLB 파일 프리로드 (클라이언트 사이드에서만)
if (typeof window !== 'undefined') {
  const { useGLTF } = require('@react-three/drei')
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  useGLTF.preload(`${basePath}/gltf/lees.glb`)
}