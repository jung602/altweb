import React, { memo, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { ORBIT_CONTROLS_CONFIG } from '../../config/sceneConfig';
import { useFrame } from '@react-three/fiber';

export interface ControlsProps {
  isExpanded: boolean;
  isActive: boolean;
  isCenter: boolean;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface ControlsRef {
  reset: () => void;
  object?: THREE.PerspectiveCamera;
}

export const Controls = memo(forwardRef<ControlsRef, ControlsProps>(
  ({ isExpanded, isActive, isCenter, onStart, onEnd }, ref) => {
    const controlsRef = useRef<any>(null);

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
      enablePan: isExpanded,
      enableRotate: true,
      autoRotate: !isExpanded,
      autoRotateSpeed: 0.1,
      minPolarAngle: isExpanded ? 0 : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      maxPolarAngle: isExpanded ? Math.PI : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
      minDistance: isExpanded ? 380 * 0.8 : 380,
      maxDistance: isExpanded ? 380 * 1.3 : 380,
      touches: {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_ROTATE
      }
    }), [isExpanded, isActive, isCenter]);

    useFrame(() => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    });

    return (
      <OrbitControls 
        {...controlsConfig} 
        onStart={onStart}
        onEnd={onEnd}
      />
    );
  }
));

Controls.displayName = 'Controls';