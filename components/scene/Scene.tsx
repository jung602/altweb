// components/scene/Scene.tsx
// @deprecated 이 파일은 이전 버전과의 호환성을 위해 유지됩니다.
// 새로운 코드에서는 다음 컴포넌트들을 사용하세요:
// - SceneGroup: 씬 그룹 관리
// - ModelAnimatedGroup: 애니메이션 처리
// - Model: 개별 모델 렌더링

import React, { memo, useRef } from 'react';
import * as THREE from 'three';
import { animated, useSpring } from '@react-spring/three';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import { useResponsiveDevice } from '../../hooks/useResponsiveDevice';
import { useInteraction } from '../../hooks/useInteraction';
import { useThree } from '@react-three/fiber';
import { Model } from './Model';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';
import { useModelVisibility } from '../../hooks/useModelVisibility';
import { useModelControls } from '../../hooks/useModelControls';
import { ANIMATION_CONFIG } from '../../config/animation';

/**
 * Scene 컴포넌트의 props 인터페이스
 * @interface SceneProps
 * @deprecated 새 코드에서는 renderer/SceneGroup을 사용하세요.
 */
interface SceneProps {
  /** 씬 설정 객체 */
  config: SceneConfig;
  /** 모든 씬 설정 객체 배열 */
  allConfigs: SceneConfig[];
  /** 현재 활성화된 씬 인덱스 */
  currentIndex: number;
  controlsRef?: React.RefObject<any>;
}

/**
 * 3D 씬과 모델을 관리하는 컴포넌트
 * @deprecated 새 코드에서는 renderer/SceneGroup을 사용하세요.
 */
export const Scene = memo(({ config, allConfigs, currentIndex, controlsRef }: SceneProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const groupRef = useRef<THREE.Group>(null);
  const isDev = process.env.NODE_ENV === 'development';

  // 모델별 controlsRef를 관리하는 객체
  const modelControlsRefs = useRef<{[key: number]: React.RefObject<any>}>({});

  // 기본 인터랙션 설정
  const {
    handlePointerDown,
    handlePointerUp,
    isUserInteracting,
    isDragging
  } = useInteraction({
    isExpanded,
    toggleExpanded,
    setBlurred,
    debug: isDev,
    enableRotation: false,
    enableMouseTracking: true
  });

  // 현재 기기의 반응형 정보 가져오기
  const { width } = useResponsiveDevice();
  
  // 브라우저 너비 기준: 768px 이하면 4, 768px 초과 1440px 이하면 5, 1440px 초과면 6
  const ySpacing = width <= 768 ? 4 : width <= 1440 ? 5 : 6;

  // 전체 모델 그룹의 y축 위치 애니메이션 - 원본과 동일한 설정으로 복원
  const modelsPositionY = useSpring({
    y: currentIndex * ySpacing,
    config: ANIMATION_CONFIG.SPRING
  });
  
  // WebGL 컨텍스트 접근을 위한 three hook 사용
  const { gl } = useThree();
  
  // 성능 모니터링 로직 커스텀 훅으로 분리
  usePerformanceMonitoring(gl);

  // 컨트롤 관리 로직 커스텀 훅으로 분리
  useModelControls({
    isExpanded,
    controlsRef,
    modelControlsRefs: modelControlsRefs.current
  });

  // 모델 가시성 관리 로직 커스텀 훅으로 분리
  const { visibleModels } = useModelVisibility({
    currentIndex,
    allConfigsLength: allConfigs.length,
    isExpanded
  });

  return (
    <group>
      <color attach="background" args={['black']} />
      
      {/* 각 모델을 애니메이션으로 이동시키는 그룹 */}
      <animated.group position-y={modelsPositionY.y}>
        {allConfigs.map((sceneConfig, index) => {
          // 모델별로 고유한 ref 생성 및 관리
          if (!modelControlsRefs.current[index]) {
            modelControlsRefs.current[index] = React.createRef();
          }
          // 현재 모델이 로드되어 있는지 확인
          return visibleModels.includes(index) && (
            <Model
              key={`model-${index}`}
              sceneConfig={sceneConfig}
              index={index}
              currentIndex={currentIndex}
              isExpanded={isExpanded}
              handlePointerDown={handlePointerDown}
              handlePointerUp={handlePointerUp}
              setModelHovered={setModelHovered}
              setBlurred={setBlurred}
              controlsRef={modelControlsRefs.current[index]}
            />
          );
        })}
      </animated.group>
    </group>
  );
}, (prevProps, nextProps) => {
  return prevProps.config === nextProps.config && 
         prevProps.currentIndex === nextProps.currentIndex;
});

Scene.displayName = 'Scene';