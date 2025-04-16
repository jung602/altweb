import React, { memo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { animated } from '@react-spring/three';
import { OrbitControls } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { ModelLoader } from './ModelLoader';
import { Reflector } from './Reflector';
import { useResponsiveDevice } from '../../hooks/device';
import type { SceneConfig } from '../../types/scene';
import { useModelRotation, useModelScale, useModelPosition, useModelEmission, useModelOrbitControl } from '../../hooks/model';
import { useScrollEvents } from '../../hooks/interaction';
import { ORBIT_CONTROLS_CONFIG } from '../../config/camera';

// OrbitControls의 인스턴스 타입을 any로 지정 (타입 안전성을 희생하고 실용성 추구)
// 정확한 타입을 사용하려면 @react-three/drei의 내부 타입을 가져와야 하지만,
// 라이브러리 버전 변경에 따라 깨질 수 있음
type OrbitControlsType = any;

interface ModelProps {
  sceneConfig: SceneConfig;
  index: number;
  currentIndex: number;
  isExpanded: boolean;
  handlePointerDown: (e: ThreeEvent<PointerEvent>) => void;
  handlePointerUp: (e: ThreeEvent<PointerEvent>) => void;
  setModelHovered: (isHovered: boolean) => void;
  setBlurred?: (isBlurred: boolean) => void;
  controlsRef?: React.RefObject<OrbitControlsType>;
}

/**
 * 개별 3D 모델을 렌더링하고 관리하는 컴포넌트
 */
export const Model = memo(({ 
  sceneConfig,
  index, 
  currentIndex, 
  isExpanded,
  handlePointerDown,
  handlePointerUp,
  setModelHovered,
  setBlurred,
  controlsRef
}: ModelProps) => {
  const { getResponsiveScale, getResponsivePosition, width } = useResponsiveDevice();
  const isCurrentModel = index === currentIndex;
  const modelRef = useRef<THREE.Group>(null);
  const orbitControlsRef = useRef<OrbitControlsType>(null);
  
  // 회전 로직 커스텀 훅으로 분리
  const { 
    rotationY,
    handleModelPointerDown: handleRotationPointerDown,
    handleModelPointerUp: handleRotationPointerUp,
    resetRotation
  } = useModelRotation({
    modelRef,
    isCurrentModel,
    isExpanded,
    initialRotation: sceneConfig.model.rotation[1],
    handlePointerDown,
    handlePointerUp
  });

  // 스케일 로직 커스텀 훅으로 분리
  const { 
    finalScale,
    handleScroll 
  } = useModelScale({
    baseScale: sceneConfig.model.scale,
    isCurrentModel,
    isExpanded,
    resetRotation,
    getResponsiveScale
  });
  
  // 위치 계산 로직 커스텀 훅으로 분리
  const { spring } = useModelPosition({
    basePosition: sceneConfig.model.position,
    index,
    width,
    getResponsivePosition
  });
  
  // Emission 텍스처 밝기 조정 로직 커스텀 훅으로 분리
  useModelEmission({ 
    modelRef, 
    isCurrentModel 
  });

  // 스크롤 이벤트 리스너 등록 로직 커스텀 훅으로 분리
  useScrollEvents({
    isCurrentModel,
    isExpanded,
    resetRotation,
    handleScroll
  });

  // OrbitControls 관리 로직 커스텀 훅으로 분리
  const { resetOrbitControls } = useModelOrbitControl({
    modelRef,
    controlsRef: orbitControlsRef,
    isCurrentModel,
    isExpanded,
    enabled: true
  });

  // OrbitControls가 마운트되면 외부 controlsRef가 있을 경우 해당 정보를 외부 컴포넌트에 전달
  const handleOrbitControlsRef = useCallback((node: OrbitControlsType) => {
    orbitControlsRef.current = node;
    
    // 외부 컴포넌트의 ref에 현재 OrbitControls 인스턴스 전달
    if (controlsRef && node) {
      // @ts-ignore - read-only 속성 문제 우회
      controlsRef.current = node;
    }
  }, [controlsRef]);

  // 현재 모델 여부가 변경될 때마다 처리
  useEffect(() => {
    // 현재 모델이 아니게 되었을 때 초기 회전 상태로 즉시 리셋
    if (!isCurrentModel) {
      resetRotation();
      resetOrbitControls();
    }
  }, [isCurrentModel, resetRotation, resetOrbitControls]);

  // 포인터 이벤트 핸들러 메모이제이션
  const handlePointerEnter = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isCurrentModel) {
      e.stopPropagation();
      setModelHovered(true);
    }
  }, [isCurrentModel, setModelHovered]);

  const handlePointerLeave = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isCurrentModel) {
      e.stopPropagation();
      setModelHovered(false);
    }
  }, [isCurrentModel, setModelHovered]);

  return (
    <animated.group
      ref={modelRef}
      position-x={spring.positionX}
      position-y={spring.positionY}
      position-z={spring.positionZ}
      scale-x={finalScale}
      scale-y={finalScale}
      scale-z={finalScale}
      rotation-x={sceneConfig.model.rotation[0]}
      rotation-y={rotationY}
      rotation-z={sceneConfig.model.rotation[2]}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handleRotationPointerDown}
      onPointerUp={handleRotationPointerUp}
    >
      <React.Suspense fallback={null}>
        <ModelLoader 
          component={sceneConfig.model.component}
          controlsRef={controlsRef}
          isCurrentModel={isCurrentModel}
        />
      </React.Suspense>
      
      {/* Reflector 항상 표시 */}
      <Reflector config={sceneConfig.reflector} isCurrentModel={isCurrentModel} />

      {/* OrbitControls - 확장 모드이고 현재 모델인 경우에만 표시 */}
      {isExpanded && isCurrentModel && (
        <OrbitControls
          ref={handleOrbitControlsRef}
          minPolarAngle={ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE}
          maxPolarAngle={ORBIT_CONTROLS_CONFIG.MAX_POLAR_ANGLE}
          minAzimuthAngle={ORBIT_CONTROLS_CONFIG.MIN_AZIMUTH_ANGLE}
          maxAzimuthAngle={ORBIT_CONTROLS_CONFIG.MAX_AZIMUTH_ANGLE}
          minDistance={ORBIT_CONTROLS_CONFIG.MIN_DISTANCE}
          maxDistance={ORBIT_CONTROLS_CONFIG.MAX_DISTANCE}
          enableDamping={true}
          dampingFactor={0.1}
          enabled={isExpanded && isCurrentModel}
        />
      )}
    </animated.group>
  );
});

Model.displayName = 'Model';