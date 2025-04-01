import React, { memo, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { ORBIT_CONTROLS_CONFIG } from '../../config/cameraConfig';
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
        }
      },
      get object() {
        return controlsRef.current?.object;
      },
    }));

    const config = useMemo(() => ({
      minPolarAngle: isExpanded ? 0 : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      maxPolarAngle: isExpanded ? Math.PI : ORBIT_CONTROLS_CONFIG.MIN_POLAR_ANGLE,
      minAzimuthAngle: isExpanded ? -Infinity : -Infinity,
      maxAzimuthAngle: isExpanded ? Infinity : Infinity,
      minDistance: ORBIT_CONTROLS_CONFIG.MIN_DISTANCE,
      maxDistance: ORBIT_CONTROLS_CONFIG.MAX_DISTANCE,
      enableZoom: isExpanded,
      enablePan: false,
      enableRotate: true,
      autoRotate: !isExpanded,
      autoRotateSpeed: 0.05,
      onStart,
      onEnd
    }), [isExpanded, onStart, onEnd]);

    useFrame(() => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    });

    return <OrbitControls ref={controlsRef} {...config} />;
  }
));

Controls.displayName = 'Controls';