import React, { useMemo, useRef, useEffect } from 'react';
import { SceneConfig } from '../../types/scene';
import { FrontSide, Shape, BufferGeometry, Group, Mesh, Material } from 'three';
import * as THREE from 'three';
import { Reflector as ThreeReflector } from 'three/examples/jsm/objects/Reflector.js';
import { optimizeMaterial } from '../../utils/materialOptimizer';
import { useResponsiveDevice } from '../../hooks/useResponsiveDevice';

interface ReflectorProps {
  config: SceneConfig['reflector'];
  isCurrentModel?: boolean;
}

// 라운딩된 직사각형 셰이프를 생성하는 함수
const createRoundedRectShape = (width: number, height: number, radius: number) => {
  const shape = new Shape();
  const w = width / 2;
  const h = height / 2;
  const r = radius;
  
  // 시작점 (오른쪽 상단 모서리)
  shape.moveTo(w - r, -h);
  // 오른쪽 변
  shape.lineTo(w, -h + r);
  shape.quadraticCurveTo(w, -h, w - r, -h);
  // 위쪽 변
  shape.lineTo(-w + r, -h);
  shape.quadraticCurveTo(-w, -h, -w, -h + r);
  // 왼쪽 변
  shape.lineTo(-w, h - r);
  shape.quadraticCurveTo(-w, h, -w + r, h);
  // 아래쪽 변
  shape.lineTo(w - r, h);
  shape.quadraticCurveTo(w, h, w, h - r);
  // 오른쪽 상단 모서리까지 돌아옴
  shape.lineTo(w, -h + r);
  
  return shape;
};

export const Reflector: React.FC<ReflectorProps> = ({ config, isCurrentModel = true }) => {
  const { isMobile } = useResponsiveDevice();
  
  const reflectorItems = useMemo(() => {
    if (!config?.enabled) return [];
    
    return config.items.map((item, index) => {
      const width = item.args?.[0] ?? 10;
      const height = item.args?.[1] ?? 10;
      const radius = item.radius ?? 0;
      
      const shape = radius > 0 ? createRoundedRectShape(width, height, radius) : null;
      
      return {
        key: `reflector-${index}`,
        shape,
        width,
        height,
        radius,
        ...item
      };
    });
  }, [config?.enabled, config?.items]);
  
  const groupRef = useRef<Group>(null);
  
  useEffect(() => {
    if (!groupRef.current || !config?.enabled || !isCurrentModel) return;
    
    // 기존 리플렉터 제거
    const existingReflectors = groupRef.current.children.filter(
      child => child.userData.isReflector || child.userData.isReflectorOverlay
    );
    existingReflectors.forEach(child => {
      groupRef.current?.remove(child);
      // 메쉬로 타입 단언하여 material과 geometry에 접근
      const mesh = child as Mesh;
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: Material) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      if (mesh.geometry) mesh.geometry.dispose();
    });
    
    // 새로운 리플렉터 생성
    reflectorItems.forEach(item => {
      // 지오메트리 생성
      let geometry;
      if (item.radius > 0) {
        // ExtrudeGeometry 대신 ShapeGeometry 사용하여 두께를 제거
        geometry = new THREE.ShapeGeometry(item.shape as Shape);
      } else {
        geometry = new THREE.PlaneGeometry(item.width, item.height);
      }
      
      // 디바이스 타입에 따라 해상도 설정
      const resolution = isMobile ? 512 : 2048;
      
      // 리플렉터 생성 - 바닐라 Three.js Reflector에서 지원하는 속성만 사용
      const reflector = new ThreeReflector(
        geometry,
        {
          clipBias: item.clipBias ?? 0.1,
          textureWidth: resolution,
          textureHeight: resolution,
          color: item.color ? new THREE.Color(item.color).getHex() : 0x202020
        }
      );
      
      // 리플렉터 속성 설정
      reflector.position.set(
        item.position[0],
        item.position[1],
        item.position[2]
      );
      reflector.rotation.set(
        item.rotation[0],
        item.rotation[1],
        item.rotation[2]
      );
      
      if (item.scale) {
        reflector.scale.set(item.scale[0], item.scale[1], item.scale[2]);
      }
      
      reflector.userData.isReflector = true;
      
      // 모든 리플렉터의 그림자 비활성화
      reflector.castShadow = false;
      reflector.receiveShadow = false;
      
      // 리플렉터의 재질 최적화
      if (reflector.material) {
        if (Array.isArray(reflector.material)) {
          reflector.material.forEach(material => {
            // 투명도 설정 추가
            material.transparent = true;
            material.opacity = 0.3; // 투명도 값 조정 (0-1 사이 값)
            optimizeMaterial(material, { isMobile });
          });
        } else {
          // 투명도 설정 추가
          reflector.material.transparent = true;
          reflector.material.opacity = 0.3; // 투명도 값 조정 (0-1 사이 값)
          optimizeMaterial(reflector.material, { isMobile });
        }
      }
      
      // 그룹에 추가
      groupRef.current?.add(reflector);
    });
  }, [reflectorItems, config?.enabled, isMobile, isCurrentModel]);
  
  // Move the condition check here, after all hooks
  if (!isCurrentModel || !config?.enabled) return null;
  
  return <group ref={groupRef} />;
};

Reflector.displayName = 'Reflector';