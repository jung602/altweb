import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'
import { ModelComponentType, MODEL_COMPONENTS } from "../../types/scene"
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// 모델 프리로드 상태를 추적
const MODEL_PRELOAD_MAP: Record<ModelComponentType, boolean> = {
  Alt1: false,
  Alt2: false,
  Alt3: false,
};

interface ModelLoaderProps {
  component: ModelComponentType
  [key: string]: any
}

export function ModelLoader({ component, ...props }: ModelLoaderProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const modelPath = `${basePath}/gltf/compressed_${component.toLowerCase()}.glb`
  
  const { scene } = useGLTF(modelPath, true)
  
  const hasPreloaded = useRef(false)

  // 첫 로드 시 다음 모델 미리 로드
  useEffect(() => {
    if (!hasPreloaded.current && !MODEL_PRELOAD_MAP[component]) {
      const currentIndex = MODEL_COMPONENTS.indexOf(component);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < MODEL_COMPONENTS.length) {
        const nextComponent = MODEL_COMPONENTS[nextIndex];
        const nextModelPath = `${basePath}/gltf/${nextComponent.toLowerCase()}.glb`;
        useGLTF.preload(nextModelPath);
        MODEL_PRELOAD_MAP[component] = true;
        hasPreloaded.current = true;
      }
    }
  }, [component, basePath]);

  // 메시 최적화
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // 기하학 데이터 최적화
        if (child.geometry) {
          child.geometry.computeBoundingSphere();
          child.geometry.computeBoundingBox();
        }

        // 재질 최적화
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.Material) => {
              mat.dispose();
            });
          } else {
            child.material.dispose();
          }
        }
      }
    });

    // 클린업
    return () => {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat: THREE.Material) => {
                mat.dispose();
              });
            } else {
              child.material.dispose();
            }
          }
        }
      });
    };
  }, [scene]);

  return <primitive object={scene} {...props} />
} 