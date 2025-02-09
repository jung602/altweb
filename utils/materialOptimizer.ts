import * as THREE from 'three';

export function optimizeMaterial(material: THREE.Material) {
  if (material instanceof THREE.MeshStandardMaterial) {
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