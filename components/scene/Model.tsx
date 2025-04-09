import React, { memo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { animated } from '@react-spring/three';
import { ModelLoader } from './ModelLoader';
import { Reflector } from './Reflector';
import { useResponsiveDevice } from '../../hooks/useResponsiveDevice';
import type { SceneConfig } from '../../types/scene';
import { useModelRotation } from '../../hooks/useModelRotation';
import { useModelScale } from '../../hooks/useModelScale';
import { useModelPosition } from '../../hooks/useModelPosition';
import { useModelEmission } from '../../hooks/useModelEmission';
import { useScrollEvents } from '../../hooks/useScrollEvents';

interface ModelProps {
  sceneConfig: SceneConfig;
  index: number;
  currentIndex: number;
  isExpanded: boolean;
  handlePointerDown: (e: any) => void;
  handlePointerUp: (e: any) => void;
  setModelHovered: (isHovered: boolean) => void;
  setBlurred?: (isBlurred: boolean) => void;
  controlsRef?: React.RefObject<any>;
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

  // 현재 모델 여부가 변경될 때마다 처리
  useEffect(() => {
    // 현재 모델이 아니게 되었을 때 초기 회전 상태로 즉시 리셋
    if (!isCurrentModel) {
      resetRotation();
    }
  }, [isCurrentModel, resetRotation]);

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
      onPointerEnter={(e) => {
        if (isCurrentModel) {
          e.stopPropagation();
          setModelHovered(true);
        }
      }}
      onPointerLeave={(e) => {
        if (isCurrentModel) {
          e.stopPropagation();
          setModelHovered(false);
        }
      }}
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
    </animated.group>
  );
});

Model.displayName = 'Model';