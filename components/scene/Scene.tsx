import React, { memo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Stats } from '@react-three/drei';
import { animated } from '@react-spring/three';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import { ModelLoader } from './ModelLoader';
import { Controls } from './Controls';
import { Reflector } from './Reflector';
import { useResponsiveDevice } from '../../hooks/useResponsiveDevice';
import { useSceneAnimation } from '../../hooks/useSceneAnimation';
import { useInteraction } from '../../hooks/useInteraction';

/**
 * Scene 컴포넌트의 props 인터페이스
 * @interface SceneProps
 */
interface SceneProps {
  /** 씬 설정 객체 */
  config: SceneConfig;
  controlsRef?: React.RefObject<any>;
}

export const Scene = memo(({ config, controlsRef }: SceneProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const isTransitioning = useSceneStore((state) => state.isTransitioning);
  const setTransitioning = useSceneStore((state) => state.setTransitioning);
  const setBlurred = useSceneStore((state) => state.setBlurred);
  const groupRef = useRef<THREE.Group>(null);
  const isDev = process.env.NODE_ENV === 'development';

  // 애니메이션 관련 로직을 useSceneAnimation 훅으로 분리
  const {
    springs,
    rotationSpring,
    rotationApi,
    responsiveScale,
    responsivePosition,
    debouncedHoverHandler
  } = useSceneAnimation({
    isExpanded,
    isTransitioning,
    setTransitioning,
    setModelHovered,
    baseScale: config.model.scale,
    basePosition: config.model.position
  });

  // 인터랙션 관련 로직을 useInteraction 훅으로 분리
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

  // 컨트롤 리셋
  useEffect(() => {
    if (!isExpanded && controlsRef?.current) {
      controlsRef.current.reset();
    }
  }, [isExpanded, controlsRef]);

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
          // 인터랙션 종료 시 추가 로직이 필요한 경우 여기에 작성
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
      
      <animated.group
        ref={groupRef}
        scale={isTransitioning 
          ? [responsiveScale * (isExpanded ? 0.8 : 0.7), responsiveScale * (isExpanded ? 0.8 : 0.7), responsiveScale * (isExpanded ? 0.8 : 0.7)]
          : springs.scale}
        rotation-x={rotationSpring.rotationX}
        rotation-y={rotationSpring.rotationY}
        rotation-z={0}
        position={responsivePosition}
        onPointerEnter={(e) => {
          e.stopPropagation();
          debouncedHoverHandler(true);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          debouncedHoverHandler(false);
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <React.Suspense fallback={null}>
          <ModelLoader 
            component={config.model.component}
            controlsRef={controlsRef}
          />
        </React.Suspense>
        
        <Reflector config={config.reflector} />
      </animated.group>
      {process.env.NODE_ENV === 'development' && <Stats />}
    </group>
  );
}, (prevProps, nextProps) => {
  return prevProps.config === nextProps.config;
});

Scene.displayName = 'Scene';