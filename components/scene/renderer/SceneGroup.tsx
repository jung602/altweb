import React, { useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '../../../store/sceneStore';
import { usePerformanceMonitoring } from '../../../hooks/usePerformanceMonitoring';
import { useModelVisibility } from '../../../hooks/useModelVisibility';
import { useModelControls } from '../../../hooks/useModelControls';
import { SceneConfig } from '../../../types/scene';
import ModelAnimatedGroup from './ModelAnimatedGroup';

interface SceneGroupProps {
  scenes: SceneConfig[];
  currentIndex: number;
  isExpanded: boolean;
  controlsRef?: React.RefObject<any>;
}

/**
 * 여러 3D 모델을 그룹으로 관리하는 컴포넌트
 */
const SceneGroup: React.FC<SceneGroupProps> = ({
  scenes,
  currentIndex,
  isExpanded,
  controlsRef
}) => {
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  
  // 모델별 controlsRef를 관리하는 객체
  const modelControlsRefs = useRef<{[key: number]: React.RefObject<any>}>({});
  
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
    allConfigsLength: scenes.length,
    isExpanded
  });
  
  // 인터랙션 핸들러
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
  };
  
  const handlePointerUp = (e: any) => {
    e.stopPropagation();
  };

  return (
    <group>
      <color attach="background" args={['black']} />
      
      <ModelAnimatedGroup 
        scenes={scenes} 
        currentIndex={currentIndex}
        visibleModels={visibleModels}
        isExpanded={isExpanded}
        handlePointerDown={handlePointerDown}
        handlePointerUp={handlePointerUp}
        setModelHovered={setModelHovered}
        setBlurred={setBlurred}
        modelControlsRefs={modelControlsRefs.current}
      />
    </group>
  );
};

export default SceneGroup; 