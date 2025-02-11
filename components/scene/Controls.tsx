import React, { memo, useMemo, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { ORBIT_CONTROLS_CONFIG } from '../../config/sceneConfig';
import { ThreeEvent } from '@react-three/fiber';

export interface ControlsProps {
  isExpanded: boolean;
  isInteracting: boolean;
  isActive: boolean;
  onStart: () => void;
  onEnd: () => void;
}

export interface ControlsRef {
  reset: () => void;
  object: THREE.Camera;
}

export const Controls = memo(forwardRef<ControlsRef, ControlsProps>(({ isExpanded, isInteracting, isActive, onStart, onEnd }, ref) => {
  const controlsRef = React.useRef<any>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    },
    get object() {
      return controlsRef.current?.object;
    }
  }));

  const controlsConfig = useMemo(() => ({
    ref: controlsRef,
    enabled: true,
    enableZoom: isExpanded,
    enablePan: false,
    enableRotate: true,
    autoRotate: isActive && !isInteracting && !isExpanded,
    autoRotateSpeed: ORBIT_CONTROLS_CONFIG.AUTO_ROTATE_SPEED,
    minPolarAngle: isExpanded ? 0 : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
    maxPolarAngle: isExpanded ? ORBIT_CONTROLS_CONFIG.MAX_POLAR_ANGLE : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
    minAzimuthAngle: ORBIT_CONTROLS_CONFIG.MIN_AZIMUTH_ANGLE,
    maxAzimuthAngle: ORBIT_CONTROLS_CONFIG.MAX_AZIMUTH_ANGLE,
    minDistance: isExpanded ? 380 * 0.8 : 380,
    maxDistance: isExpanded ? 380 * 1.3 : 380,
    touches: {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    }
  }), [isExpanded, isInteracting, isActive]);
  
  // isExpanded 상태 변경 감지
  React.useEffect(() => {
    if (controlsRef.current) {
      if (!isExpanded) {
        controlsRef.current.reset();
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, [isExpanded]);
  
  return <OrbitControls {...controlsConfig} onStart={onStart} onEnd={onEnd} />;
}));