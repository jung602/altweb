import * as THREE from 'three';

// 메탈 메터리얼
export const metalMaterial = new THREE.MeshStandardMaterial({
  metalness: 1.0,
  roughness: 0.2,
  color: 0x8c8c8c,
});

// 유리 메터리얼
export const glassMaterial = new THREE.MeshPhysicalMaterial({
  transparent: true,
  opacity: 0.3,
  metalness: 0,
  roughness: 0,
  transmission: 1,
  thickness: 0.5,
});

// 메터리얼 캐시
const materialCache = new Map<string, THREE.Material>();

export const getSharedMaterial = (name: string): THREE.Material | undefined => {
  if (materialCache.has(name)) {
    return materialCache.get(name);
  }

  let material: THREE.Material | undefined;
  switch (name) {
    case 'metal':
      material = metalMaterial;
      break;
    case 'glass':
    case 'glassforgltf':
      material = glassMaterial;
      break;
  }

  if (material) {
    materialCache.set(name, material);
  }
  return material;
}; 