import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Reflector, Stats } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useFrame } from '@react-three/fiber';
import { debounce } from 'lodash';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import Label from '../ui/Label';
import { ModelLoader } from './ModelLoader';
import { Controls, ControlsRef } from './Controls';
import { ANIMATION_CONFIG } from '../../config/sceneConfig';
import React from 'react';

const startTime = {
  current: Date.now()
};

/**
 * Scene 컴포넌트의 props 인터페이스
 * @interface SceneProps
 */
interface SceneProps {
  /** 씬 설정 객체 */
  config: SceneConfig;
}

export const Scene = memo(({ config }: SceneProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const toggleExpanded = useSceneStore((state) => state.toggleExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const controlsRef = useRef<ControlsRef>(null);
  const isMobileDevice = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  const clickStartTime = useRef<number>(0);
  const CLICK_THRESHOLD = 200;
  const groupRef = useRef<THREE.Group>(null);
  const rotationSpeed = 0.001;
  const lastRotation = useRef<number>(0);
  const isUserInteracting = useRef(false);

  useFrame(() => {
    if (groupRef.current && !isExpanded && !isUserInteracting.current) {
      const elapsedTime = (Date.now() - startTime.current) * 0.001;
      const maxRotation = Math.PI / 4;
      const newRotation = Math.sin(elapsedTime * rotationSpeed) * maxRotation;
      groupRef.current.rotation.y = newRotation;
      lastRotation.current = newRotation;
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    clickStartTime.current = Date.now();
    isUserInteracting.current = true;
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    const clickDuration = Date.now() - clickStartTime.current;
    if (clickDuration < CLICK_THRESHOLD) {
      toggleExpanded();
    }
    isUserInteracting.current = false;
  };

  useEffect(() => {
    if (groupRef.current) {
      if (!isExpanded && !isUserInteracting.current) {
        const elapsedTime = (Date.now() - startTime.current) * 0.001;
        const maxRotation = Math.PI / 4;
        const newRotation = Math.sin(elapsedTime * rotationSpeed) * maxRotation;
        groupRef.current.rotation.y = newRotation;
      } else {
        lastRotation.current = groupRef.current.rotation.y;
      }
    }
  }, [isExpanded]);

  const debouncedHoverHandler = useMemo(
    () => debounce((hovering: boolean) => {
      if (!isMobileDevice.current) {
        setModelHovered(hovering && isExpanded);
      }
    }, 100),
    [isExpanded, setModelHovered]
  );

  useEffect(() => {
    return () => {
      debouncedHoverHandler.cancel();
    };
  }, [debouncedHoverHandler]);

  const { scale } = useSpring({
    scale: config.model.scale * 0.7,
    config: {
      ...ANIMATION_CONFIG.SPRING,
      duration: 800,
      easing: t => t * (2 - t)
    },
    immediate: true
  });

  useEffect(() => {
    if (isExpanded) {
      // @ts-ignore
      scale.start(config.model.scale * 0.8);
    } else {
      // @ts-ignore
      scale.start(config.model.scale * 0.7);
    }
  }, [isExpanded, config.model.scale]);

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
        scale={scale}
        position={config.model.position}
        rotation={[0, lastRotation.current, 0]}
        onPointerEnter={() => debouncedHoverHandler(true)}
        onPointerLeave={() => debouncedHoverHandler(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <React.Suspense fallback={null}>
          <ModelLoader 
            component={config.model.component}
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