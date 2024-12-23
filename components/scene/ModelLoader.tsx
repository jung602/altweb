import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import { getSharedMaterial } from '../../materials/sharedMaterials'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'

interface ModelLoaderProps extends GroupProps {
  url: string
}

export const ModelLoader = ({ url, ...props }: ModelLoaderProps) => {
  const gltf = useGLTF(url) as GLTF
  const { scene } = gltf

  useEffect(() => {
    scene.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        const materialName = object.material instanceof THREE.Material ? object.material.name?.toLowerCase() : undefined
        if (materialName) {
          const sharedMaterial = getSharedMaterial(materialName)
          if (sharedMaterial) {
            object.material = sharedMaterial
          }
        }
      }
    })
  }, [scene])

  return <primitive object={scene} {...props} />
} 