import { useGLTF } from '@react-three/drei'
import { useEffect, useRef, memo, useState } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'
import { ModelComponentType, MODEL_COMPONENTS } from "../../types/scene"
import { DRACOLoader } from 'three-stdlib'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { optimizeMaterial } from '../../utils/materialOptimizer'
import { MODEL_PRELOAD_MAP } from '../../config/sceneConfig'
import { ThreeEvent } from '@react-three/fiber'

interface ModelLoaderProps {
  component: ModelComponentType
  [key: string]: any
}

export const ModelLoader = memo(({ component, ...props }: ModelLoaderProps) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const modelPath = `${basePath}/gltf/compressed_${component.toLowerCase()}.glb`
  const [isNewModelReady, setIsNewModelReady] = useState(false)
  const [previousScene, setPreviousScene] = useState<THREE.Group | null>(null)
  const isInitialMount = useRef(true)
  const isMobile = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null)
  
  const { scene } = useGLTF(modelPath, true, undefined, (loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    loader.setDRACOLoader(dracoLoader)

    loader.manager.onLoad = () => {
      // 모바일에서는 로딩 완료 후 약간의 지연을 두어 전환
      if (isMobile.current) {
        loadingTimeout.current = setTimeout(() => {
          setIsNewModelReady(true)
        }, 100)
      } else {
        setIsNewModelReady(true)
      }
    }
  })
  
  const hasPreloaded = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // 모델이 변경될 때 이전 모델 저장
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      setIsNewModelReady(true)
      return
    }

    setIsNewModelReady(false)
    
    // 이전 모델 복제 및 저장
    if (scene) {
      const clonedScene = scene.clone(true)
      setPreviousScene(clonedScene)
    }

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current)
      }
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
      }
    }
  }, [component])

  // 모델 로드 시 초기 회전값 설정
  useEffect(() => {
    scene.rotation.set(0, 0, 0);
  }, [scene]);

  // 첫 로드 시 다음 모델 미리 로드 - 순차적으로 처리
  useEffect(() => {
    const preloadNextModel = async () => {
      if (!hasPreloaded.current && !MODEL_PRELOAD_MAP[component]) {
        const currentIndex = MODEL_COMPONENTS.indexOf(component);
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < MODEL_COMPONENTS.length) {
          const nextComponent = MODEL_COMPONENTS[nextIndex];
          const nextModelPath = `${basePath}/gltf/compressed_${nextComponent.toLowerCase()}.glb`;
          await useGLTF.preload(nextModelPath);
          MODEL_PRELOAD_MAP[component] = true;
          hasPreloaded.current = true;
        }
      }
    };

    preloadNextModel();
  }, [component, basePath]);

  // 메시 최적화 - 메모리 누수 방지를 위한 개선
  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    const materials: THREE.Material[] = [];
    const geometries: THREE.BufferGeometry[] = [];

    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.rotation.set(0, 0, 0);
        meshes.push(child);
        
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
          geometries.push(child.geometry);
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material) => {
              optimizeMaterial(mat);
              materials.push(mat);
            });
          } else {
            optimizeMaterial(child.material);
            materials.push(child.material);
          }
        }
      }
    });

    // 클린업 함수 저장
    cleanupRef.current = () => {
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      meshes.forEach(mesh => {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material?.dispose();
        }
      });
      useGLTF.clear(modelPath);
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [scene, modelPath]);

  // 모바일 최적화 강화
  useEffect(() => {
    if (scene && isMobile.current) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          // 메시 최적화
          if (child.geometry && child.geometry.attributes) {
            if (child.geometry.attributes.position) {
              child.geometry.attributes.position.needsUpdate = false
            }
            if (child.geometry.attributes.normal) {
              child.geometry.attributes.normal.needsUpdate = false
            }
            if (child.geometry.attributes.uv) {
              child.geometry.attributes.uv.needsUpdate = false
            }
          }
          
          if (child.material) {
            // 텍스처 최적화
            if (child.material.map) {
              child.material.map.minFilter = THREE.LinearFilter
              child.material.map.magFilter = THREE.LinearFilter
              child.material.map.anisotropy = 1
            }
            // 그림자 비활성화
            child.castShadow = false
            child.receiveShadow = false
            // 재질 최적화
            child.material.precision = 'lowp'
            child.material.fog = false
          }
        }
      })
    }
  }, [scene])

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