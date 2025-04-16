import React, { useCallback, useMemo } from 'react';
import { animated, useSpring } from '@react-spring/three';
import { ThreeEvent } from '@react-three/fiber';
import { useResponsiveDevice } from '../../../hooks/device';
import { SceneConfig } from '../../../types/scene';
import { Model } from '../Model';
import { ANIMATION_CONFIG } from '../../../config/animation';

// OrbitControls의 인스턴스 타입을 any로 지정
type OrbitControlsType = any;

interface ModelAnimatedGroupProps {
  scenes: SceneConfig[];
  currentIndex: number;
  visibleModels: number[];
  isExpanded: boolean;
  handlePointerDown: (e: ThreeEvent<PointerEvent>) => void;
  handlePointerUp: (e: ThreeEvent<PointerEvent>) => void;
  setModelHovered: (isHovered: boolean) => void;
  setBlurred: (isBlurred: boolean) => void;
  modelControlsRefs: {[key: number]: React.RefObject<OrbitControlsType>};
}

/**
 * 애니메이션이 적용된 모델 그룹을 렌더링하는 컴포넌트
 */
const ModelAnimatedGroup: React.FC<ModelAnimatedGroupProps> = React.memo(({
  scenes,
  currentIndex,
  visibleModels,
  isExpanded,
  handlePointerDown,
  handlePointerUp,
  setModelHovered,
  setBlurred,
  modelControlsRefs
}) => {
  const { width } = useResponsiveDevice();
  
  // 브라우저 너비 기준: 768px 이하면 4, 768px 초과 1440px 이하면 5, 1440px 초과면 6
  // useMemo를 사용하여 width가 변경될 때만 계산되도록 최적화
  const ySpacing = useMemo(() => {
    return width <= 768 ? 4 : width <= 1440 ? 5 : 6;
  }, [width]);

  // 전체 모델 그룹의 y축 위치 애니메이션
  const modelsPositionY = useSpring({
    y: currentIndex * ySpacing,
    config: ANIMATION_CONFIG.SPRING
  });

  // 컨트롤러 ref 생성 함수를 useCallback으로 메모이제이션
  const getOrCreateControlsRef = useCallback((index: number): React.RefObject<OrbitControlsType> => {
    if (!modelControlsRefs[index]) {
      modelControlsRefs[index] = React.createRef();
    }
    return modelControlsRefs[index];
  }, [modelControlsRefs]);

  return (
    <animated.group position-y={modelsPositionY.y}>
      {scenes.map((sceneConfig, index) => {
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
            controlsRef={getOrCreateControlsRef(index)}
          />
        );
      })}
    </animated.group>
  );
});

// displayName 추가
ModelAnimatedGroup.displayName = 'ModelAnimatedGroup';

export default ModelAnimatedGroup; 