import { useGLTF } from '@react-three/drei'
import { useEffect, useRef, memo } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { GroupProps } from '@react-three/fiber'
import { ModelComponentType, MODEL_COMPONENTS } from "../../types/scene"
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { optimizeMaterial } from '../../utils/materialOptimizer'
import { MODEL_PRELOAD_MAP } from '../../config/sceneConfig'

interface ModelLoaderProps {
  component: ModelComponentType
  [key: string]: any
}

export const ModelLoader = memo(({ component, ...props }: ModelLoaderProps) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const modelPath = `${basePath}/gltf/compressed_${component.toLowerCase()}.glb`
  
  const { scene } = useGLTF(modelPath, true)
  const hasPreloaded = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

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

  return <primitive object={scene} {...props} />
})

ModelLoader.displayName = 'ModelLoader' 