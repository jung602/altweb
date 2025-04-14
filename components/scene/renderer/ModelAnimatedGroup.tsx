import React from 'react';
import { animated, useSpring } from '@react-spring/three';
import { useResponsiveDevice } from '../../../hooks/useResponsiveDevice';
import { SceneConfig } from '../../../types/scene';
import { Model } from '../Model';
import { ANIMATION_CONFIG } from '../../../config/animation';

interface ModelAnimatedGroupProps {
  scenes: SceneConfig[];
  currentIndex: number;
  visibleModels: number[];
  isExpanded: boolean;
  handlePointerDown: (e: any) => void;
  handlePointerUp: (e: any) => void;
  setModelHovered: (isHovered: boolean) => void;
  setBlurred: (isBlurred: boolean) => void;
  modelControlsRefs: {[key: number]: React.RefObject<any>};
}

/**
 * 애니메이션이 적용된 모델 그룹을 렌더링하는 컴포넌트
 */
const ModelAnimatedGroup: React.FC<ModelAnimatedGroupProps> = ({
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
  const ySpacing = width <= 768 ? 4 : width <= 1440 ? 5 : 6;

  // 전체 모델 그룹의 y축 위치 애니메이션
  const modelsPositionY = useSpring({
    y: currentIndex * ySpacing,
    config: ANIMATION_CONFIG.SPRING
  });

  // 컨트롤러 ref 생성 함수
  const getOrCreateControlsRef = (index: number) => {
    if (!modelControlsRefs[index]) {
      modelControlsRefs[index] = React.createRef();
    }
    return modelControlsRefs[index];
  };

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
};

export default ModelAnimatedGroup; 