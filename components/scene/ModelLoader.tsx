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

        // 재질과 텍스처 최적화
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: THREE.MeshStandardMaterial) => {
              // 텍스처 색상 공간 설정
              if (mat.map) mat.map.colorSpace = THREE.LinearSRGBColorSpace;
              if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.LinearSRGBColorSpace;
              
              // 재질 속성 조정
              mat.roughness = Math.min(mat.roughness, 0.9);  // 거칠기 제한
              mat.metalness = Math.min(mat.metalness, 0.8);  // 금속성 제한
              
              // 방사(Emissive) 강도 조절
              if (mat.emissiveIntensity !== undefined) {
                mat.emissiveIntensity = 1.0;  // 방사 강도 조절
              }

              // 환경 맵 영향도 조절
              mat.envMapIntensity = 1.0;  // 환경 맵 강도
            });
          } else {
            const material = child.material as THREE.MeshStandardMaterial;
            
            // 텍스처 색상 공간 설정
            if (material.map) material.map.colorSpace = THREE.LinearSRGBColorSpace;
            if (material.emissiveMap) material.emissiveMap.colorSpace = THREE.LinearSRGBColorSpace;
            
            // 재질 속성 조정
            material.roughness = Math.min(material.roughness, 0.9);  // 거칠기 제한
            material.metalness = Math.min(material.metalness, 0.8);  // 금속성 제한
            
            // 방사(Emissive) 강도 조절
            if (material.emissiveIntensity !== undefined) {
              material.emissiveIntensity = 1.0;  // 방사 강도 조절
            }

            // 환경 맵 영향도 조절
            material.envMapIntensity = 1.0;  // 환경 맵 강도
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