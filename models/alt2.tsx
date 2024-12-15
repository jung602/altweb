import dynamic from 'next/dynamic'
import React from 'react'
import { type GroupProps } from '@react-three/fiber'
import { type GLTF } from 'three-stdlib'
import type * as THREE from 'three'

{/* type GLTFResult = GLTF & {
  nodes: {
    mesh004: THREE.Mesh
    mesh004_1: THREE.Mesh
    mesh004_2: THREE.Mesh
    mesh004_3: THREE.Mesh
    mesh004_4: THREE.Mesh
    mesh004_5: THREE.Mesh
    mesh004_6: THREE.Mesh
    mesh004_7: THREE.Mesh
    mesh004_8: THREE.Mesh
    mesh004_9: THREE.Mesh
  }
  materials: {
    ['omeko metal4']: THREE.MeshStandardMaterial
    ['omeko metal.001']: THREE.MeshStandardMaterial
    ['omeko metal4.003']: THREE.MeshStandardMaterial
    ['omeko metal3']: THREE.MeshStandardMaterial
    ['omeko metal2']: THREE.MeshStandardMaterial
    black: THREE.MeshStandardMaterial
    white: THREE.MeshStandardMaterial
    ['omeko logo']: THREE.MeshPhysicalMaterial
    bulb: THREE.MeshStandardMaterial
    Steel: THREE.MeshStandardMaterial
  }
}

// 실제 컴포넌트 구현
const Alt2Component = (props: GroupProps) => {
  const { useGLTF } = require('@react-three/drei')
  const { nodes, materials } = useGLTF('./gltf/alt2.glb') as GLTFResult
  
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004.geometry}
        material={materials['omeko metal4']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_1.geometry}
        material={materials['omeko metal.001']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_2.geometry}
        material={materials['omeko metal4.003']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_3.geometry}
        material={materials['omeko metal3']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_4.geometry}
        material={materials['omeko metal2']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_5.geometry}
        material={materials.black}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_6.geometry}
        material={materials.white}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_7.geometry}
        material={materials['omeko logo']}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_8.geometry}
        material={materials.bulb}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.mesh004_9.geometry}
        material={materials.Steel}
      />
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
  useGLTF.preload('./gltf/alt2.glb')
} */}

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