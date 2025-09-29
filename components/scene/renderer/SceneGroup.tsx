import React, { useRef, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { ThreeEvent } from '@react-three/fiber';
import { useSceneStore } from '../../../store/sceneStore';
import { usePerformanceMonitoring } from '../../../hooks/device';
import { useModelVisibility, useModelControls } from '../../../hooks/model';
import { useInteraction } from '../../../hooks/interaction';
import { SceneConfig } from '../../../types/scene';
import { OrbitControlsType, OrbitControlsInterface } from '../../../types/controls/orbitControls';
import { animated, useSpring } from '@react-spring/three';
import { useResponsiveDevice } from '../../../hooks/device';
import { Model } from '../Model';
import { ANIMATION_CONFIG } from '../../../config/animation';

// OrbitControls 타입 정의는 types/controls/orbitControls.ts로 이동

interface SceneGroupProps {
  scenes: SceneConfig[];
  currentIndex: number;
  isExpanded: boolean;
  controlsRef?: React.RefObject<OrbitControlsInterface | null>;
}

/**
 * 여러 3D 모델을 그룹으로 관리하는 컴포넌트
 */
const SceneGroup: React.FC<SceneGroupProps> = React.memo(({
  scenes,
  currentIndex,
  isExpanded,
  controlsRef
}) => {
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const isDev = process.env.NODE_ENV === 'development';
  const { width } = useResponsiveDevice();
  
  // 모델별 controlsRef를 관리하는 객체
  const modelControlsRefs = useRef<{[key: number]: React.RefObject<OrbitControlsType>}>({});
  
  // WebGL 컨텍스트 접근을 위한 three hook 사용
  const { gl } = useThree();
  
  // 성능 모니터링 로직 커스텀 훅으로 분리
  usePerformanceMonitoring(gl);

  // 기본 인터랙션 설정
  const {
    handlePointerDown,
    handlePointerUp: originalHandlePointerUp
  } = useInteraction({
    isExpanded,
    toggleExpanded,
    setBlurred,
    debug: isDev,
    enableRotation: false,
    enableMouseTracking: true
  });

  // handlePointerUp 확장: 마우스를 떼면 무조건 blur 해제
  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    originalHandlePointerUp(e);
    // 마우스를 떼면 추가로 blur 상태를 항상 해제
    setBlurred(false);
  }, [originalHandlePointerUp, setBlurred]);

  // 컨트롤 관리 로직 커스텀 훅으로 분리
  useModelControls({
    isExpanded,
    controlsRef,
    modelControlsRefs: modelControlsRefs.current
  });

  // 모델 가시성 관리 로직 커스텀 훅으로 분리
  const { visibleModels } = useModelVisibility({
    currentIndex,
    allConfigsLength: scenes.length,
    isExpanded
  });

  // 모델 호버 상태 설정 함수를 메모이제이션
  const memoizedSetModelHovered = useCallback((isHovered: boolean) => {
    setModelHovered(isHovered);
  }, [setModelHovered]);

  // 블러 상태 설정 함수를 메모이제이션
  const memoizedSetBlurred = useCallback((isBlurred: boolean) => {
    setBlurred(isBlurred);
  }, [setBlurred]);

  // y 간격 및 그룹 위치 스프링
  const ySpacing = useMemo(() => (width <= 768 ? 4 : width <= 1440 ? 5 : 6), [width]);
  const modelsPositionY = useSpring({
    y: currentIndex * ySpacing,
    config: ANIMATION_CONFIG.SPRING
  });

  const getOrCreateControlsRef = useCallback((index: number): React.RefObject<OrbitControlsType | null> => {
    if (!modelControlsRefs.current[index]) {
      modelControlsRefs.current[index] = React.createRef<OrbitControlsType>();
    }
    return modelControlsRefs.current[index] as React.RefObject<OrbitControlsType | null>;
  }, []);

  return (
    <animated.group position-y={modelsPositionY.y}>
      <color attach="background" args={['black']} />
      {scenes.map((sceneConfig, index) => (
        visibleModels.includes(index) && (
          <Model
            key={`model-${index}`}
            sceneConfig={sceneConfig}
            index={index}
            currentIndex={currentIndex}
            isExpanded={isExpanded}
            handlePointerDown={handlePointerDown}
            handlePointerUp={handlePointerUp}
            setModelHovered={memoizedSetModelHovered}
            setBlurred={memoizedSetBlurred}
            controlsRef={getOrCreateControlsRef(index)}
          />
        )
      ))}
    </animated.group>
  );
});

// displayName 추가
SceneGroup.displayName = 'SceneGroup';

export default SceneGroup; 