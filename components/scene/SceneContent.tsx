import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Reflector, Stats } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { debounce } from 'lodash';
import { useSceneStore } from '../../store/sceneStore';
import type { SceneConfig } from '../../types/scene';
import Label from '../ui/Label';
import { ModelLoader } from './ModelLoader';
import { ANIMATION_CONFIG } from '../../config/sceneConfig';

interface SceneContentProps {
  config: SceneConfig;
  width: number;
  height: number;
}

export const SceneContent = memo(({ config, width, height }: SceneContentProps) => {
  const isExpanded = useSceneStore((state) => state.isExpanded);
  const setModelHovered = useSceneStore((state) => state.setModelHovered);
  const [isInteracting, setIsInteracting] = useState(false);
  const controlsRef = useRef<any>(null);
  const isMobileDevice = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

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
    scale: isExpanded ? config.model.scale * 1.1 : config.model.scale * 0.9,
    config: ANIMATION_CONFIG.SPRING,
    immediate: false
  });

  return (
    <>
      <ambientLight intensity={1} />
      
      <group>
        <animated.group
          scale={scale}
          position={config.model.position}
          rotation={config.model.rotation}
          onPointerEnter={() => debouncedHoverHandler(true)}
          onPointerLeave={() => debouncedHoverHandler(false)}
        >
          <ModelLoader 
            component={config.model.component}
          />
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
      </group>
      {process.env.NODE_ENV === 'development' && <Stats />}
    </>
  );
}); 