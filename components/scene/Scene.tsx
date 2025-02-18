import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Reflector, Stats } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { debounce } from 'lodash';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import Label from '../ui/Label';
import { ModelLoader } from './ModelLoader';
import { Controls, ControlsRef } from './Controls';
import { ANIMATION_CONFIG } from '../../config/sceneConfig';
import React from 'react';
import { useResponsiveScale } from '../../hooks/useResponsiveScale';
import { useResponsivePosition } from '../../hooks/useResponsivePosition';

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
  const isMobileDevice = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const clickStartTime = useRef<number>(0);
  const CLICK_THRESHOLD = 200;
  const groupRef = useRef<THREE.Group>(null);
  const isUserInteracting = useRef(false);
  const responsiveScale = useResponsiveScale(config.model.scale);
  const responsivePosition = useResponsivePosition(config.model.position);

  const [{ rotationX, rotationY }, rotationApi] = useSpring(() => ({
    rotationX: 0,
    rotationY: 0,
    config: {
      mass: 1,
      tension: 120,
      friction: 50
    }
  }));

  useEffect(() => {
    if (rotationApi) {
      rotationApi.start({
        rotationX: 0,
        rotationY: 0,
        config: ANIMATION_CONFIG.SPRING
      });
    }
    
    if (!isExpanded && controlsRef?.current) {
      controlsRef.current.reset();
    }
  }, [rotationApi, isExpanded]);

  const handleMouseMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isUserInteracting.current && !isExpanded) {
      let x, y;
      
      if ('touches' in event) {
        // 터치 이벤트인 경우
        const touch = event.touches[0];
        x = (touch.clientX / window.innerWidth) * 2 - 1;
        y = -(touch.clientY / window.innerHeight) * 2 + 1;
      } else {
        // 마우스 이벤트인 경우
        x = (event.clientX / window.innerWidth) * 2 - 1;
        y = -(event.clientY / window.innerHeight) * 2 + 1;
      }
      
      rotationApi.start({
        rotationX: y * 0,
        rotationY: x * 0.3
      });
    }
  }, [rotationApi, isExpanded]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
    };
  }, [handleMouseMove]);

  const springs = useSpring<{ scale: [number, number, number] }>({
    scale: isExpanded 
      ? [responsiveScale * 0.8, responsiveScale * 0.8, responsiveScale * 0.8] 
      : [responsiveScale * 0.7, responsiveScale * 0.7, responsiveScale * 0.7],
    config: {
      mass: ANIMATION_CONFIG.SPRING.mass,
      tension: ANIMATION_CONFIG.SPRING.tension,
      friction: ANIMATION_CONFIG.SPRING.friction
    },
    onChange: () => {
      if (isTransitioning) {
        setTransitioning(false);
      }
    }
  });

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    clickStartTime.current = performance.now();
    isUserInteracting.current = true;
  }, []);

  const handlePointerUp = useCallback((e: any) => {
    e.stopPropagation();
    const clickDuration = performance.now() - clickStartTime.current;
    if (clickDuration < CLICK_THRESHOLD) {
      toggleExpanded();
    }
    isUserInteracting.current = false;
  }, [toggleExpanded]);

  const debouncedHoverHandler = useMemo(
    () => debounce((hovering: boolean) => {
      if (!isMobileDevice.current) {
        setModelHovered(hovering && isExpanded);
      }
    }, 50),
    [isExpanded, setModelHovered]
  );

  useEffect(() => {
    return () => {
      debouncedHoverHandler.cancel();
    };
  }, [debouncedHoverHandler]);

  return (
    <group>
      <Controls
        ref={controlsRef}
        isExpanded={isExpanded}
        isActive={!isUserInteracting.current}
        isCenter={true}
        onStart={() => { isUserInteracting.current = true }}
        onEnd={() => { isUserInteracting.current = false }}
      />
      
      <ambientLight intensity={1} />
      
      <animated.group
        ref={groupRef}
        scale={isTransitioning 
          ? [responsiveScale * (isExpanded ? 0.8 : 0.7), responsiveScale * (isExpanded ? 0.8 : 0.7), responsiveScale * (isExpanded ? 0.8 : 0.7)]
          : springs.scale}
        rotation-x={rotationX}
        rotation-y={rotationY}
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
        {isExpanded && config.labels?.map((label, index) => (
          <Label key={index} {...label} />
        ))}

        {(() => {
          const reflector = config.reflector;
          if (!reflector?.enabled) return null;
          
          return (
            <Reflector
              scale={reflector.scale}
              position={reflector.position}
              rotation={reflector.rotation}
              blur={reflector.blur ?? [0, 0]}
              mixBlur={reflector.mixBlur ?? 0.75}
              mixStrength={reflector.mixStrength ?? 1}
              resolution={reflector.resolution ?? 1024}
              args={reflector.args ?? [50, 50]}
              mirror={reflector.mirror ?? 0.9}
              minDepthThreshold={reflector.minDepthThreshold ?? 0.25}
              maxDepthThreshold={reflector.maxDepthThreshold ?? 1}
              depthScale={reflector.depthScale ?? 50}
            >
              {(Material, props) => (
                <Material 
                  metalness={reflector.metalness ?? 0.5} 
                  roughness={reflector.roughness ?? 1} 
                  {...props} 
                />
              )}
            </Reflector>
          );
        })()}
      </animated.group>
      {process.env.NODE_ENV === 'development' && <Stats />}
    </group>
  );
}, (prevProps, nextProps) => {
  return prevProps.config === nextProps.config;
});

Scene.displayName = 'Scene';