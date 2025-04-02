import React, { memo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Stats } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import { ModelLoader } from './ModelLoader';
import { Controls } from './Controls';
import { Reflector } from './Reflector';
import { useResponsiveDevice } from '../../hooks/useResponsiveDevice';
import { useInteraction } from '../../hooks/useInteraction';
import { ANIMATION_CONFIG } from '../../config/sceneConfig';

/**
 * Scene 컴포넌트의 props 인터페이스
 * @interface SceneProps
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

// 각 모델 렌더링을 담당하는 분리된 컴포넌트
const Model = memo(({ 
  sceneConfig,
  index, 
  currentIndex, 
  isExpanded,
  handlePointerDown,
  handlePointerUp,
  setModelHovered,
  controlsRef
}: {
  sceneConfig: SceneConfig;
  index: number;
  currentIndex: number;
  isExpanded: boolean;
  handlePointerDown: (e: any) => void;
  handlePointerUp: (e: any) => void;
  setModelHovered: (isHovered: boolean) => void;
  controlsRef?: React.RefObject<any>;
}) => {
  const { getResponsiveScale, getResponsivePosition, isMobile } = useResponsiveDevice();
  
  // 기본 위치 및 스케일 계산
  const baseScale = sceneConfig.model.scale;
  const responsiveScale = getResponsiveScale(baseScale);
  const scaleFactor = isExpanded ? 1.0 : 0.9;
  const finalScale = responsiveScale * scaleFactor;
  
  // 위치 계산
  const basePosition = sceneConfig.model.position;
  const responsivePosition = getResponsivePosition(basePosition);
  
  // 모바일에서는 y축 간격이 4, 다른 디바이스에서는 6
  const ySpacing = isMobile ? 4 : 6;
  const yPos = responsivePosition[1] + (index * -ySpacing);
  
  // 스프링 애니메이션 적용
  const spring = useSpring({
    scale: finalScale,
    positionX: responsivePosition[0],
    positionY: yPos,
    positionZ: responsivePosition[2],
    config: {
      ...ANIMATION_CONFIG.SPRING,
      friction: 26,
      tension: 170
    }
  });

  return (
    <animated.group
      position-x={spring.positionX}
      position-y={spring.positionY}
      position-z={spring.positionZ}
      scale-x={spring.scale}
      scale-y={spring.scale}
      scale-z={spring.scale}
      rotation={[
        sceneConfig.model.rotation[0],
        sceneConfig.model.rotation[1],
        sceneConfig.model.rotation[2]
      ]}
      onPointerEnter={(e) => {
        if (index === currentIndex) {
          e.stopPropagation();
          setModelHovered(true);
        }
      }}
      onPointerLeave={(e) => {
        if (index === currentIndex) {
          e.stopPropagation();
          setModelHovered(false);
        }
      }}
      onPointerDown={(e) => {
        if (index === currentIndex) {
          e.stopPropagation();
          handlePointerDown(e);
        }
      }}
      onPointerUp={(e) => {
        if (index === currentIndex) {
          e.stopPropagation();
          handlePointerUp(e);
        }
      }}
    >
      <React.Suspense fallback={null}>
        <ModelLoader 
          component={sceneConfig.model.component}
          controlsRef={controlsRef}
        />
      </React.Suspense>
      
      {index === currentIndex && <Reflector config={sceneConfig.reflector} />}
    </animated.group>
  );
});

Model.displayName = 'Model';

export const Scene = memo(({ config, allConfigs, currentIndex, controlsRef }: SceneProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const groupRef = useRef<THREE.Group>(null);
  const isDev = process.env.NODE_ENV === 'development';

  // 이전 인덱스 추적
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  
  // 로드된 모델을 추적
  const [visibleModels, setVisibleModels] = useState<number[]>([
    Math.max(0, currentIndex - 1),
    currentIndex,
    Math.min(allConfigs.length - 1, currentIndex + 1)
  ].filter((idx, i, arr) => arr.indexOf(idx) === i)); // 중복 제거
  
  // 언로드 타이머
  const unloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 모델별 회전 상태 관리를 위한 로직
  const [rotationSpring, rotationApi] = useSpring(() => ({
    rotationX: 0,
    rotationY: 0,
    config: ANIMATION_CONFIG.SPRING
  }));

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
    rotationApi,
    rotationY: rotationSpring.rotationY,
    debug: isDev,
    enableRotation: !isExpanded,
    enableMouseTracking: true
  });

  // 현재 기기의 반응형 정보 가져오기
  const { isMobile } = useResponsiveDevice();
  
  // 모바일에서는 y축 간격이 4, 다른 디바이스에서는 6
  const ySpacing = isMobile ? 4 : 6;

  // 전체 모델 그룹의 y축 위치 애니메이션
  const modelsPositionY = useSpring({
    y: currentIndex * ySpacing,
    config: ANIMATION_CONFIG.SPRING
  });

  // 컨트롤 리셋
  useEffect(() => {
    if (!isExpanded && controlsRef?.current) {
      controlsRef.current.reset();
    }
  }, [isExpanded, controlsRef]);

  // 현재, 이전, 다음 모델만 로드하도록 관리
  useEffect(() => {
    // 인덱스가 변경됨
    if (currentIndex !== prevIndex) {
      // 이전 타이머가 있으면 제거
      if (unloadTimerRef.current) {
        clearTimeout(unloadTimerRef.current);
        unloadTimerRef.current = null;
      }
      
      // 현재, 이전, 다음 모델을 한번에 계산
      const newVisibleModels = [
        Math.max(0, currentIndex - 1), 
        currentIndex, 
        Math.min(allConfigs.length - 1, currentIndex + 1)
      ].filter((idx, i, arr) => arr.indexOf(idx) === i);
      
      // 이전 뷰에 있던 모델도 잠시 유지 (애니메이션 위함)
      const combinedModels = [...new Set([...visibleModels, ...newVisibleModels])];
      setVisibleModels(combinedModels);
      
      // 5초 후 현재, 이전, 다음 모델만 남기고 나머지 제거
      unloadTimerRef.current = setTimeout(() => {
        setVisibleModels(newVisibleModels);
      }, 1000); // 5초 후 불필요한 모델 언로드
      
      setPrevIndex(currentIndex);
    }
  }, [currentIndex, allConfigs.length, visibleModels, prevIndex]);
  
  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (unloadTimerRef.current) {
        clearTimeout(unloadTimerRef.current);
        unloadTimerRef.current = null;
      }
    };
  }, []);

  return (
    <group>
      <Controls
        ref={controlsRef}
        isExpanded={isExpanded}
        isActive={!isUserInteracting.current || isExpanded}
        isCenter={true}
        onStart={() => { 
          // 인터랙션 시작 시 추가 로직이 필요한 경우 여기에 작성
        }}
        onEnd={() => { 
          // OrbitControls 회전 종료 시 블러 효과 제거
          if (setBlurred) {
            setBlurred(false);
          }
        }}
      />
      
      <color attach="background" args={['black']} />
      <hemisphereLight intensity={0.5} groundColor="black" />

      <spotLight 
        decay={0} 
        position={[-10, 20, -10]} 
        angle={0.12} 
        penumbra={1} 
        intensity={.1} 
        castShadow 
        shadow-mapSize={1024} 
      />
      <spotLight 
        decay={0} 
        position={[10, 20, 10]} 
        angle={0.12} 
        penumbra={1} 
        intensity={.1} 
        castShadow 
        shadow-mapSize={1024} 
      />
      
      {/* 각 모델을 y축으로 -6 간격으로 배치하는 그룹 전체를 애니메이션으로 이동 */}
      <animated.group position-y={modelsPositionY.y}>
        {allConfigs.map((sceneConfig, index) => 
          // 현재 모델이 로드되어 있는지 확인
          visibleModels.includes(index) && (
            <Model
              key={`model-${index}`}
              sceneConfig={sceneConfig}
              index={index}
              currentIndex={currentIndex}
              isExpanded={isExpanded}
              handlePointerDown={handlePointerDown}
              handlePointerUp={handlePointerUp}
              setModelHovered={setModelHovered}
              controlsRef={controlsRef}
            />
          )
        )}
      </animated.group>
      {process.env.NODE_ENV === 'development' && <Stats />}
    </group>
  );
}, (prevProps, nextProps) => {
  return prevProps.config === nextProps.config && 
         prevProps.currentIndex === nextProps.currentIndex;
});

Scene.displayName = 'Scene';