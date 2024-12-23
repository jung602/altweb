import dynamic from 'next/dynamic'
import React from 'react'
import { type GroupProps } from '@react-three/fiber'
import { type GLTF } from 'three-stdlib'
import type * as THREE from 'three'

type GLTFResult = GLTF & {
  nodes: {
    Plane020: THREE.Mesh
    Plane020_1: THREE.Mesh
    Plane020_2: THREE.Mesh
    Plane020_3: THREE.Mesh
    Plane020_4: THREE.Mesh
    Plane020_5: THREE.Mesh
    Plane020_6: THREE.Mesh
    Plane020_7: THREE.Mesh
  }
  materials: {
    walls: THREE.MeshStandardMaterial
    desk: THREE.MeshStandardMaterial
    bed: THREE.MeshStandardMaterial
    tv: THREE.MeshStandardMaterial
    mirror: THREE.MeshStandardMaterial
    metal: THREE.MeshStandardMaterial
    black: THREE.MeshStandardMaterial
    glassforgltf: THREE.MeshPhysicalMaterial
  }
}

// 실제 컴포넌트 구현
const Alt1Component = (props: GroupProps) => {
  const { useGLTF } = require('@react-three/drei')
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const { nodes, materials } = useGLTF(`${basePath}/gltf/klar.glb`) as GLTFResult
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Plane020.geometry} material={materials.walls} />
      <mesh geometry={nodes.Plane020_1.geometry} material={materials.desk} />
      <mesh geometry={nodes.Plane020_2.geometry} material={materials.bed} />
      <mesh geometry={nodes.Plane020_3.geometry} material={materials.tv} />
      <mesh geometry={nodes.Plane020_4.geometry} material={materials.mirror} />
      <mesh geometry={nodes.Plane020_5.geometry} material={materials.metal} />
      <mesh geometry={nodes.Plane020_6.geometry} material={materials.black} />
      <mesh geometry={nodes.Plane020_7.geometry} material={materials.glassforgltf} />
    </group>
  )
}

// 동적 임포트로 내보내기
export const Alt1 = dynamic(
  () => Promise.resolve(Alt1Component),
  {
    ssr: false
  }
)

// GLB 파일 프리로드 (클라이언트 사이드에서만)
if (typeof window !== 'undefined') {
  const { useGLTF } = require('@react-three/drei')
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  useGLTF.preload(`${basePath}/gltf/klar.glb`)
}
