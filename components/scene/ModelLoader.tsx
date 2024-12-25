import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'

interface ModelLoaderProps extends GroupProps {
  url: string
}

export const ModelLoader = ({ url, ...props }: ModelLoaderProps) => {
  const gltf = useGLTF(url) as GLTF
  const { scene } = gltf

  return <primitive object={scene} {...props} />
} 