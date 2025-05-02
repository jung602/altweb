import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useThree, extend } from '@react-three/fiber'
import * as THREE from 'three'
import { Reflector as ThreeReflector } from 'three/examples/jsm/objects/Reflector.js'
import { optimizeMaterial } from '../../utils/memory'
import { useResponsiveDevice } from '../../hooks/device'
import { SceneConfig } from '../../types/scene';
import { FrontSide, Shape, Group, Mesh, Material } from 'three';

interface ReflectorProps {
  config: SceneConfig['reflector'];
  isCurrentModel?: boolean;
}

// ThreeReflector 옵션 인터페이스
interface ReflectorOptions {
  clipBias?: number;
  textureWidth?: number;
  textureHeight?: number;
  color?: number;
  blur?: number[];
  mixBlur?: number;
  mixStrength?: number;
  [key: string]: any;
}

// 라운드 렉트 셰이프 생성 함수
const createRoundedRectShape = (width: number, height: number, radius: number) => {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  
  shape.moveTo(x, y + radius);
  shape.lineTo(x, y + height - radius);
  shape.quadraticCurveTo(x, y + height, x + radius, y + height);
  shape.lineTo(x + width - radius, y + height);
  shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  shape.lineTo(x + width, y + radius);
  shape.quadraticCurveTo(x + width, y, x + width - radius, y);
  shape.lineTo(x + radius, y);
  shape.quadraticCurveTo(x, y, x, y + radius);
  
  return shape;
};

// Three.js 네임스페이스에 리플렉터 추가
extend({ ThreeReflector });

export const Reflector: React.FC<ReflectorProps> = ({ config, isCurrentModel = true }) => {
  const { isMobile, isTablet } = useResponsiveDevice();
  const reflectorsRef = useRef<THREE.Object3D[]>([]);
  const { camera } = useThree();
  const groupRef = useRef<Group>(null);
  
  // 해상도 최적화 - 디바이스 성능에 따라 리플렉터 해상도 조절
  const getOptimalResolution = useCallback(() => {
    if (isMobile) return 512;
    if (isTablet) return 1024;
    return 2048;
  }, [isMobile, isTablet]);
  
  // 리플렉터 아이템 생성
  const reflectorItems = useMemo(() => {
    if (!config?.enabled) return [];
    
    return config.items.map((item, index) => {
      const width = item.args?.[0] ?? 10;
      const height = item.args?.[1] ?? 10;
      const radius = item.radius ?? 0;
      
      const shape = radius > 0 ? createRoundedRectShape(width, height, radius) : null;
      
      const overlayOpacity = item.overlayOpacity ?? 0.5;
      const overlayOffset = item.overlayOffset ?? [0, 0, 0];
      
      const blur = item.blur ?? [1, 1];
      const mixBlur = item.mixBlur ?? 0.5;
      const mixStrength = item.mixStrength ?? 0.5;
      
      return {
        key: `reflector-${index}`,
        shape,
        width,
        height,
        radius,
        overlayOpacity,
        overlayOffset,
        blur,
        mixBlur,
        mixStrength,
        ...item
      };
    });
  }, [config?.enabled, config?.items]);
  
  // 리플렉터 생성 - useFrame 제거
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
    
    // 리플렉터 배열 초기화
    reflectorsRef.current = [];
    
    // 새로운 리플렉터 생성
    reflectorItems.forEach(item => {
      // 지오메트리 생성
      let geometry;
      if (item.radius > 0) {
        geometry = new THREE.ShapeGeometry(item.shape as Shape);
      } else {
        geometry = new THREE.PlaneGeometry(item.width, item.height);
      }
      
      // 해상도 최적화
      const resolution = getOptimalResolution();
      
      // 리플렉터 생성
      const reflectorOptions: ReflectorOptions = {
        clipBias: item.clipBias ?? 0.1,
        textureWidth: resolution,
        textureHeight: resolution,
        color: item.color ? new THREE.Color(item.color).getHex() : 0x202020
      };
      
      const reflector = new ThreeReflector(geometry, reflectorOptions);
      
      // 속성 추가
      try {
        if (item.blur) (reflector as any).blur = item.blur;
        if (item.mixBlur) (reflector as any).mixBlur = item.mixBlur;
        if (item.mixStrength) (reflector as any).mixStrength = item.mixStrength;
      } catch (e) {
        // 에러 무시
      }
      
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
      
      // 그림자 비활성화
      reflector.castShadow = false;
      reflector.receiveShadow = false;
      
      // 재질 최적화
      if (reflector.material) {
        if (Array.isArray(reflector.material)) {
          reflector.material.forEach(material => {
            material.transparent = true;
            material.opacity = 0.3;
            optimizeMaterial(material, { isMobile });
          });
        } else {
          reflector.material.transparent = true;
          reflector.material.opacity = 0.3;
          optimizeMaterial(reflector.material, { isMobile });
        }
      }
      
      // 그룹에 추가
      groupRef.current?.add(reflector);
      
      // 참조 배열에 추가
      reflectorsRef.current.push(reflector);
      
      // 오버레이 생성
      if (item.overlayOpacity !== 0) {
        const clonedGeometry = geometry.clone();
        
        const overlayMaterial = new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: item.overlayOpacity ?? 0.5,
          side: FrontSide
        });
        
        const overlay = new THREE.Mesh(clonedGeometry, overlayMaterial);
        
        const overlayOffsetX = item.overlayOffset?.[0] ?? 0;
        const overlayOffsetY = item.overlayOffset?.[1] ?? 0;
        const overlayOffsetZ = item.overlayOffset?.[2] ?? 0;
        
        const posX = item.position[0] + overlayOffsetX;
        const posY = item.position[1] + overlayOffsetY;
        const posZ = item.position[2] + overlayOffsetZ;
        
        overlay.position.set(posX, posY, posZ);
        
        overlay.rotation.set(
          item.rotation[0],
          item.rotation[1],
          item.rotation[2]
        );
        
        if (item.scale) {
          overlay.scale.set(item.scale[0], item.scale[1], item.scale[2]);
        }
        
        overlay.userData.isReflectorOverlay = true;
        
        overlay.castShadow = false;
        overlay.receiveShadow = false;
        
        groupRef.current?.add(overlay);
      }
    });
    
    // 카메라 이동 이벤트 핸들러 - 별도 함수로 분리
    const handleCameraMove = () => {
      if (!isCurrentModel || !config?.enabled || reflectorsRef.current.length === 0) return;
      
      reflectorsRef.current.forEach(reflector => {
        if (reflector && (reflector as any).needsUpdate !== undefined) {
          (reflector as any).needsUpdate = true;
        }
      });
    };
    
    // 씬 렌더링할 때 이벤트 등록
    const renderer = THREE.WebGLRenderer.prototype;
    if (renderer.render) {
      const originalRender = renderer.render;
      renderer.render = function(...args) {
        handleCameraMove();
        return originalRender.apply(this, args);
      };
    }
    
    // 정리 함수 - 이벤트 제거
    return () => {
      renderer.render = THREE.WebGLRenderer.prototype.render;
    };
  }, [reflectorItems, isCurrentModel, isMobile, isTablet, getOptimalResolution, config?.enabled]);
  
  // 조건부 렌더링
  if (!isCurrentModel || !config?.enabled) return null;
  
  return <group ref={groupRef} />;
};

Reflector.displayName = 'Reflector';