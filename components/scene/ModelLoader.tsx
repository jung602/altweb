import { useGLTF } from '@react-three/drei'
import { useEffect, useRef, memo, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'
import { ModelComponentType, MODEL_COMPONENTS } from "../../types/scene"
import { DRACOLoader } from 'three-stdlib'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { optimizeMaterial } from '../../utils/materialOptimizer'
import { MODEL_PRELOAD_MAP } from '../../config/sceneConfig'
import { ThreeEvent } from '@react-three/fiber'
import { useSceneStore } from '../../store/sceneStore'

interface ModelLoaderProps {
  component: ModelComponentType
  controlsRef?: React.RefObject<any>
  [key: string]: any
}

export const ModelLoader = memo(({ component, controlsRef, ...props }: ModelLoaderProps) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const modelPath = `${basePath}/gltf/compressed_${component.toLowerCase()}.glb`
  const [isNewModelReady, setIsNewModelReady] = useState(false)
  const [previousScene, setPreviousScene] = useState<THREE.Group | null>(null)
  const isInitialMount = useRef(true)
  const isMobile = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  const hasPreloaded = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)
  
  const preloadNextModel = useCallback(async () => {
    if (!hasPreloaded.current && !MODEL_PRELOAD_MAP[component]) {
      const currentIndex = MODEL_COMPONENTS.indexOf(component)
      const nextIndex = (currentIndex + 1) % MODEL_COMPONENTS.length
      const nextComponent = MODEL_COMPONENTS[nextIndex]
      const nextModelPath = `${basePath}/gltf/compressed_${nextComponent.toLowerCase()}.glb`
      
      try {
        await useGLTF.preload(nextModelPath)
        MODEL_PRELOAD_MAP[component] = true
        hasPreloaded.current = true
      } catch (error) {
        console.error('Failed to preload next model:', error)
      }
    }
  }, [basePath, component])

  const { scene } = useGLTF(modelPath, true, undefined, (loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    loader.setDRACOLoader(dracoLoader)

    loader.manager.onLoad = () => {
      setIsNewModelReady(true)
    }
  })
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      setIsNewModelReady(true)
      return
    }

    setIsNewModelReady(false)
    
    if (scene) {
      const clonedScene = scene.clone()
      setPreviousScene(clonedScene)
    }

    // Reset controls when model changes
    if (controlsRef?.current) {
      controlsRef.current.reset()
    }

    return () => {
      if (previousScene) {
        previousScene.traverse((child: any) => {
          if (child.isMesh) {
            child.geometry?.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: THREE.Material) => mat.dispose())
            } else {
              child.material?.dispose()
            }
          }
        })
        setPreviousScene(null)
      }
    }
  }, [component, controlsRef])

  useEffect(() => {
    scene.rotation.set(0, 0, 0)
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.rotation.set(0, 0, 0)
      }
    })
  }, [scene])

  useEffect(() => {
    if (previousScene !== scene) {
      preloadNextModel();
    }
  }, [previousScene, scene, preloadNextModel]);

  useEffect(() => {
    const meshes: THREE.Mesh[] = []
    const materials: THREE.Material[] = []
    const geometries: THREE.BufferGeometry[] = []

    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.rotation.set(0, 0, 0)
        meshes.push(child)
        
        if (child.geometry) {
          child.geometry.computeBoundingSphere()
          child.geometry.computeBoundingBox()
          geometries.push(child.geometry)
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material) => {
              optimizeMaterial(mat)
              materials.push(mat)
            })
          } else {
            optimizeMaterial(child.material)
            materials.push(child.material)
          }
        }
      }
    })

    cleanupRef.current = () => {
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      meshes.forEach(mesh => {
        mesh.geometry?.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose())
        } else {
          mesh.material?.dispose()
        }
      })
      useGLTF.clear(modelPath)
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [scene, modelPath])

  useEffect(() => {
    if (scene && isMobile.current) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.material) {
            if (child.material.map) {
              child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
              child.material.map.magFilter = THREE.LinearFilter;
              child.material.map.anisotropy = 4;
            }
            child.castShadow = false;
            child.receiveShadow = false;
          }
        }
      });
    }
  }, [scene]);

  return (
    <>
      <primitive 
        object={scene} 
        {...props}
        visible={isNewModelReady}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          if (props.onPointerEnter) props.onPointerEnter(e)
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          document.body.style.cursor = 'auto'
          if (props.onPointerLeave) props.onPointerLeave(e)
        }}
      />
      {previousScene && !isNewModelReady && (
        <primitive 
          object={previousScene} 
          {...props}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation()
            document.body.style.cursor = 'pointer'
            if (props.onPointerEnter) props.onPointerEnter(e)
          }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation()
            document.body.style.cursor = 'auto'
            if (props.onPointerLeave) props.onPointerLeave(e)
          }}
        />
      )}
    </>
  )
})

ModelLoader.displayName = 'ModelLoader' 