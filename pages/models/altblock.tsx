// models/altblock.tsx
import * as THREE from 'three'
import React from 'react'
import { useGLTF } from '@react-three/drei'
import { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: {
    Cube_Baked: THREE.Mesh
  }
  materials: {
    ['Cube_Baked.001']: THREE.MeshStandardMaterial
  }
}

export function Altblock(props: JSX.IntrinsicElements['group']) {
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

useGLTF.preload('./gltf/altblock.glb')